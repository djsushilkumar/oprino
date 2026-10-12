import { eq, and, desc, sql, gte, lte, isNull } from 'drizzle-orm';
import type { Database } from '@oprino/database';
import {
  employeeLocations,
  geofences,
  dailyTravelSummaries,
  attendanceSessions,
  users,
  tasks,
  taskAssignees,
} from '@oprino/database/schema';
import type { PubSubService } from './pubsub.service.js';

export interface LocationPointInput {
  id: string;
  recordedAt: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number | null;
  heading?: number | null;
  altitude?: number | null;
  batteryLevel?: number | null;
  isCharging?: boolean | null;
  activityType?: string | null;
  isMoving?: boolean | null;
}

export interface CreateGeofenceDto {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  geofenceType?: 'OFFICE' | 'CUSTOMER_SITE' | 'CHECKPOINT';
}

/**
 * Calculates Haversine distance in meters between two coordinates.
 */
export function calculateHaversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export class TelemetryService {
  constructor(
    private db: Database,
    private pubsub: PubSubService,
  ) {}

  /**
   * INGESTION TIER: POST /v1/telemetry/locations
   * 
   * Strict 3-Layer Duty Boundary Invariant:
   * Off-duty employee location tracking must NEVER occur.
   * If user is NOT currently in an active ON_DUTY session,
   * coordinates are dropped immediately with ZERO database writes.
   */
  async ingestLocations(
    workspaceId: string,
    userId: string,
    locations: LocationPointInput[],
  ) {
    // 1. Boundary Check: Active Duty Shift Verification
    const [activeSession] = await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      return tx
        .select()
        .from(attendanceSessions)
        .where(
          and(
            eq(attendanceSessions.workspaceId, workspaceId),
            eq(attendanceSessions.userId, userId),
            eq(attendanceSessions.status, 'ON_DUTY'),
            isNull(attendanceSessions.punchOutTime),
          ),
        )
        .limit(1);
    });

    const nowIso = new Date().toISOString();

    if (!activeSession) {
      // Zero-Trust Discard: Zero database write; return dropped telemetry report
      return {
        accepted: 0,
        dropped: locations.length,
        reason: 'OFF_DUTY_FILTER',
        serverTimestamp: nowIso,
      };
    }

    // 2. Quality Filter (accuracy <= 50m, speed <= 45m/s (~162km/h), valid coordinate range)
    const validPoints: LocationPointInput[] = [];
    let droppedCount = 0;

    for (const loc of locations) {
      const recDate = new Date(loc.recordedAt);

      // Must be on or after punch in time
      if (recDate < activeSession.punchInTime) {
        droppedCount++;
        continue;
      }

      // Accuracy filter: reject points with accuracy > 50m
      if (loc.accuracy > 50) {
        droppedCount++;
        continue;
      }

      // Latitude and Longitude boundary checks
      if (loc.latitude < -90 || loc.latitude > 90 || loc.longitude < -180 || loc.longitude > 180) {
        droppedCount++;
        continue;
      }

      // Speed anomaly / teleportation check (speed > 45 m/s)
      if (loc.speed !== undefined && loc.speed !== null && loc.speed > 45) {
        droppedCount++;
        continue;
      }

      validPoints.push(loc);
    }

    if (validPoints.length === 0) {
      return {
        accepted: 0,
        dropped: locations.length,
        reason: 'QUALITY_FILTER',
        serverTimestamp: nowIso,
      };
    }

    // 3. Persist valid on-duty telemetry & Rollup daily distance in transaction
    await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      // Fetch latest point of current session prior to inserting new batch, to compute distance delta for validPoints[0]
      const [lastKnownLocation] = await tx
        .select({
          id: employeeLocations.id,
          latitude: employeeLocations.latitude,
          longitude: employeeLocations.longitude,
        })
        .from(employeeLocations)
        .where(
          and(
            eq(employeeLocations.workspaceId, workspaceId),
            eq(employeeLocations.userId, userId),
            eq(employeeLocations.sessionId, activeSession.id),
          ),
        )
        .orderBy(desc(employeeLocations.recordedAt))
        .limit(1);

      // Insert locations (idempotent on conflict)
      await tx
        .insert(employeeLocations)
        .values(
          validPoints.map((p) => ({
            id: p.id,
            workspaceId,
            userId,
            sessionId: activeSession.id,
            recordedAt: new Date(p.recordedAt),
            latitude: p.latitude,
            longitude: p.longitude,
            accuracy: p.accuracy,
            speed: p.speed ?? null,
            heading: p.heading ?? null,
            altitude: p.altitude ?? null,
            batteryLevel: p.batteryLevel ?? null,
            isCharging: p.isCharging ?? null,
            activityType: p.activityType ?? 'still',
            isMoving: p.isMoving ?? false,
          })),
        )
        .onConflictDoNothing({ target: employeeLocations.id });

      // Calculate travel distance delta between previous known point and incoming batch
      let batchDistanceMeters = 0;
      if (lastKnownLocation && lastKnownLocation.id !== validPoints[0].id) {
        batchDistanceMeters += calculateHaversineMeters(
          lastKnownLocation.latitude,
          lastKnownLocation.longitude,
          validPoints[0].latitude,
          validPoints[0].longitude,
        );
      }
      for (let i = 1; i < validPoints.length; i++) {
        const prev = validPoints[i - 1];
        const curr = validPoints[i];
        batchDistanceMeters += calculateHaversineMeters(
          prev.latitude,
          prev.longitude,
          curr.latitude,
          curr.longitude,
        );
      }

      // Rollup into dailyTravelSummaries
      const todayDate = new Date(validPoints[0].recordedAt).toISOString().slice(0, 10);
      const [existingSummary] = await tx
        .select()
        .from(dailyTravelSummaries)
        .where(
          and(
            eq(dailyTravelSummaries.workspaceId, workspaceId),
            eq(dailyTravelSummaries.userId, userId),
            eq(dailyTravelSummaries.date, todayDate),
          ),
        );

      if (existingSummary) {
        await tx
          .update(dailyTravelSummaries)
          .set({
            totalDistanceMeters: existingSummary.totalDistanceMeters + batchDistanceMeters,
            pointCount: existingSummary.pointCount + validPoints.length,
            lastPointAt: new Date(validPoints[validPoints.length - 1].recordedAt),
            updatedAt: new Date(),
          })
          .where(eq(dailyTravelSummaries.id, existingSummary.id));
      } else {
        await tx.insert(dailyTravelSummaries).values({
          workspaceId,
          userId,
          date: todayDate,
          totalDistanceMeters: batchDistanceMeters,
          pointCount: validPoints.length,
          firstPointAt: new Date(validPoints[0].recordedAt),
          lastPointAt: new Date(validPoints[validPoints.length - 1].recordedAt),
        });
      }
    });

    // 4. Publish latest coordinate to Redis / PubSub ephemeral channel
    const latest = validPoints[validPoints.length - 1];
    await this.pubsub.publish(`live_ops:${workspaceId}`, {
      type: 'location_update',
      userId,
      recordedAt: latest.recordedAt,
      latitude: latest.latitude,
      longitude: latest.longitude,
      accuracy: latest.accuracy,
      speed: latest.speed ?? null,
      heading: latest.heading ?? null,
      batteryLevel: latest.batteryLevel ?? null,
      isCharging: latest.isCharging ?? null,
      dutyStatus: 'ON_DUTY',
    });

    return {
      accepted: validPoints.length,
      dropped: droppedCount,
      reason: droppedCount > 0 ? 'PARTIAL_DROPPED_BY_FILTER' : null,
      serverTimestamp: nowIso,
    };
  }

  /**
   * Retrieves all currently on-duty workers with their latest coordinate and active task.
   */
  async getLiveWorkers(workspaceId: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      // 1. Fetch all active sessions
      const activeSessions = await tx
        .select({
          session: attendanceSessions,
          user: users,
        })
        .from(attendanceSessions)
        .innerJoin(users, eq(attendanceSessions.userId, users.id))
        .where(
          and(
            eq(attendanceSessions.workspaceId, workspaceId),
            eq(attendanceSessions.status, 'ON_DUTY'),
            isNull(attendanceSessions.punchOutTime),
          ),
        );

      const workers = [];

      for (const row of activeSessions) {
        // Latest location point
        const [latestLoc] = await tx
          .select()
          .from(employeeLocations)
          .where(
            and(
              eq(employeeLocations.workspaceId, workspaceId),
              eq(employeeLocations.userId, row.user.id),
            ),
          )
          .orderBy(desc(employeeLocations.recordedAt))
          .limit(1);

        // Current active task if any
        const [activeTaskRow] = await tx
          .select({
            taskId: tasks.id,
            taskTitle: tasks.title,
          })
          .from(taskAssignees)
          .innerJoin(tasks, eq(taskAssignees.taskId, tasks.id))
          .where(
            and(
              eq(taskAssignees.workspaceId, workspaceId),
              eq(taskAssignees.userId, row.user.id),
              sql`${tasks.status} IN ('ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS')`,
            ),
          )
          .limit(1);

        if (latestLoc) {
          workers.push({
            userId: row.user.id,
            userName: row.user.name,
            userEmail: row.user.email,
            dutyStatus: 'ON_DUTY' as const,
            sessionId: row.session.id,
            recordedAt: latestLoc.recordedAt.toISOString(),
            latitude: latestLoc.latitude,
            longitude: latestLoc.longitude,
            accuracy: latestLoc.accuracy,
            speed: latestLoc.speed,
            heading: latestLoc.heading,
            batteryLevel: latestLoc.batteryLevel,
            isCharging: latestLoc.isCharging,
            activityType: latestLoc.activityType,
            isMoving: latestLoc.isMoving,
            currentTaskId: activeTaskRow?.taskId ?? null,
            currentTaskTitle: activeTaskRow?.taskTitle ?? null,
          });
        }
      }

      return { workers };
    });
  }

  /**
   * Retrieves historical breadcrumb trail for an employee during duty hours of a given date.
   */
  async getLocationHistory(workspaceId: string, userId: string, dateStr: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);

      const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

      const points = await tx
        .select()
        .from(employeeLocations)
        .where(
          and(
            eq(employeeLocations.workspaceId, workspaceId),
            eq(employeeLocations.userId, userId),
            gte(employeeLocations.recordedAt, startOfDay),
            lte(employeeLocations.recordedAt, endOfDay),
          ),
        )
        .orderBy(employeeLocations.recordedAt);

      // Distance calculation
      let totalDistanceMeters = 0;
      for (let i = 1; i < points.length; i++) {
        totalDistanceMeters += calculateHaversineMeters(
          points[i - 1].latitude,
          points[i - 1].longitude,
          points[i].latitude,
          points[i].longitude,
        );
      }

      let totalDurationMinutes = 0;
      if (points.length >= 2) {
        const ms =
          points[points.length - 1].recordedAt.getTime() - points[0].recordedAt.getTime();
        totalDurationMinutes = Math.round(ms / 60000);
      }

      return {
        userId,
        userName: user?.name ?? 'Employee',
        date: dateStr,
        totalDistanceMeters: Math.round(totalDistanceMeters * 10) / 10,
        totalDurationMinutes,
        points: points.map((p) => ({
          id: p.id,
          recordedAt: p.recordedAt.toISOString(),
          latitude: p.latitude,
          longitude: p.longitude,
          accuracy: p.accuracy,
          speed: p.speed,
          heading: p.heading,
          altitude: p.altitude,
          batteryLevel: p.batteryLevel,
          isCharging: p.isCharging,
          activityType: p.activityType,
          isMoving: p.isMoving,
        })),
      };
    });
  }

  /**
   * Creates a new geofence.
   */
  async createGeofence(workspaceId: string, creatorId: string, input: CreateGeofenceDto) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [geofence] = await tx
        .insert(geofences)
        .values({
          workspaceId,
          name: input.name,
          description: input.description ?? null,
          latitude: input.latitude,
          longitude: input.longitude,
          radiusMeters: input.radiusMeters ?? 100,
          geofenceType: input.geofenceType ?? 'OFFICE',
          createdBy: creatorId,
        })
        .returning();

      return {
        id: geofence.id,
        workspaceId: geofence.workspaceId,
        name: geofence.name,
        description: geofence.description,
        latitude: geofence.latitude,
        longitude: geofence.longitude,
        radiusMeters: geofence.radiusMeters,
        geofenceType: geofence.geofenceType,
        isActive: geofence.isActive,
        createdBy: geofence.createdBy,
        createdAt: geofence.createdAt.toISOString(),
        updatedAt: geofence.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Lists all active geofences in the workspace.
   */
  async listGeofences(workspaceId: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const list = await tx
        .select()
        .from(geofences)
        .where(and(eq(geofences.workspaceId, workspaceId), eq(geofences.isActive, true)))
        .orderBy(desc(geofences.createdAt));

      return {
        geofences: list.map((g) => ({
          id: g.id,
          workspaceId: g.workspaceId,
          name: g.name,
          description: g.description,
          latitude: g.latitude,
          longitude: g.longitude,
          radiusMeters: g.radiusMeters,
          geofenceType: g.geofenceType as 'OFFICE' | 'CUSTOMER_SITE' | 'CHECKPOINT',
          isActive: g.isActive,
          createdBy: g.createdBy,
          createdAt: g.createdAt.toISOString(),
          updatedAt: g.updatedAt.toISOString(),
        })),
      };
    });
  }

  /**
   * Deletes a geofence.
   */
  async deleteGeofence(workspaceId: string, geofenceId: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [deleted] = await tx
        .delete(geofences)
        .where(and(eq(geofences.workspaceId, workspaceId), eq(geofences.id, geofenceId)))
        .returning();

      if (!deleted) {
        const err = new Error('Geofence not found');
        (err as any).statusCode = 404;
        throw err;
      }

      return { success: true };
    });
  }

  /**
   * Validates proximity of coordinates to a geofence.
   */
  async validateProximity(
    workspaceId: string,
    geofenceId: string,
    lat: number,
    lon: number,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [geofence] = await tx
        .select()
        .from(geofences)
        .where(and(eq(geofences.workspaceId, workspaceId), eq(geofences.id, geofenceId)))
        .limit(1);

      if (!geofence) {
        const err = new Error('Geofence not found');
        (err as any).statusCode = 404;
        throw err;
      }

      const distanceMeters = calculateHaversineMeters(
        geofence.latitude,
        geofence.longitude,
        lat,
        lon,
      );

      return {
        geofenceId: geofence.id,
        geofenceName: geofence.name,
        distanceMeters,
        radiusMeters: geofence.radiusMeters,
        isInside: distanceMeters <= geofence.radiusMeters,
      };
    });
  }
}
