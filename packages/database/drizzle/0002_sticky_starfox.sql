CREATE TABLE "daily_travel_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"date" varchar(10) NOT NULL,
	"total_distance_meters" real DEFAULT 0 NOT NULL,
	"total_duration_minutes" integer DEFAULT 0 NOT NULL,
	"point_count" integer DEFAULT 0 NOT NULL,
	"first_point_at" timestamp with time zone,
	"last_point_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_travel_summaries_user_date_idx" UNIQUE("workspace_id","user_id","date")
);
--> statement-breakpoint
CREATE TABLE "employee_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid,
	"recorded_at" timestamp with time zone NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"accuracy" real NOT NULL,
	"speed" real,
	"heading" real,
	"altitude" real,
	"battery_level" real,
	"is_charging" boolean,
	"activity_type" varchar(50) DEFAULT 'still',
	"is_moving" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geofences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"radius_meters" real DEFAULT 100 NOT NULL,
	"geofence_type" varchar(50) DEFAULT 'OFFICE' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_travel_summaries" ADD CONSTRAINT "daily_travel_summaries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_travel_summaries" ADD CONSTRAINT "daily_travel_summaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_locations" ADD CONSTRAINT "employee_locations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_locations" ADD CONSTRAINT "employee_locations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_locations" ADD CONSTRAINT "employee_locations_session_id_attendance_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."attendance_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_locations_workspace_user_time_idx" ON "employee_locations" USING btree ("workspace_id","user_id","recorded_at");--> statement-breakpoint
CREATE INDEX "employee_locations_workspace_time_idx" ON "employee_locations" USING btree ("workspace_id","recorded_at");--> statement-breakpoint
CREATE INDEX "geofences_workspace_active_idx" ON "geofences" USING btree ("workspace_id","is_active");--> statement-breakpoint

-- =========================================================================
-- Phase 02C: PostgreSQL Row-Level Security (RLS) Isolation Policies
-- Invariant: Multi-Tenant Isolation with SET LOCAL app.current_workspace_id
-- =========================================================================

-- 1. Employee Locations Telemetry RLS
ALTER TABLE "employee_locations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "employee_locations" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation_employee_locations" ON "employee_locations"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR "workspace_id" = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR "workspace_id" = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid
  );--> statement-breakpoint

-- 2. Geofences RLS
ALTER TABLE "geofences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "geofences" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation_geofences" ON "geofences"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR "workspace_id" = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR "workspace_id" = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid
  );--> statement-breakpoint

-- 3. Daily Travel Summaries RLS
ALTER TABLE "daily_travel_summaries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "daily_travel_summaries" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation_daily_travel_summaries" ON "daily_travel_summaries"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR "workspace_id" = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR "workspace_id" = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid
  );--> statement-breakpoint

-- =========================================================================
-- Phase 02C: Security Definer Procedure for Telemetry Retention Pruning
-- ADR-008 & RETENTION-ARCHITECTURE: Default 30-day retention pruning
-- =========================================================================
CREATE OR REPLACE FUNCTION telemetry_prune_expired_records(p_retention_days INT)
RETURNS INT AS $$
DECLARE
  v_cutoff TIMESTAMPTZ;
  v_deleted_count INT;
BEGIN
  IF p_retention_days < 7 THEN
    RAISE EXCEPTION 'Retention days cannot be less than 7 for safety';
  END IF;

  v_cutoff := NOW() - (p_retention_days || ' days')::INTERVAL;

  DELETE FROM "employee_locations"
  WHERE "recorded_at" < v_cutoff;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;