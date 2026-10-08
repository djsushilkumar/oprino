import { eq, and, or, ilike, desc, sql } from 'drizzle-orm';
import type { Database } from '@oprino/database';
import { customers, customerSites } from '@oprino/database/schema';
import type {
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CreateCustomerSiteRequest,
  UpdateCustomerSiteRequest,
} from '@oprino/contracts';

export class CustomerService {
  constructor(private db: Database) {}

  /**
   * Creates a new customer within tenant workspace context.
   */
  async createCustomer(workspaceId: string, input: CreateCustomerRequest) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [customer] = await tx
        .insert(customers)
        .values({
          workspaceId,
          name: input.name,
          companyName: input.companyName ?? null,
          email: input.email ?? null,
          phone: input.phone ?? null,
          notes: input.notes ?? null,
          isActive: true,
        })
        .returning();

      if (!customer) {
        throw new Error('Failed to create customer');
      }

      return {
        id: customer.id,
        workspaceId: customer.workspaceId,
        name: customer.name,
        companyName: customer.companyName,
        email: customer.email,
        phone: customer.phone,
        notes: customer.notes,
        isActive: customer.isActive,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Lists customers with optional search filtering.
   */
  async listCustomers(
    workspaceId: string,
    query?: { search?: string; page?: number; limit?: number },
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const conditions = [eq(customers.workspaceId, workspaceId)];

      if (query?.search) {
        const pattern = `%${query.search}%`;
        conditions.push(
          or(
            ilike(customers.name, pattern),
            ilike(customers.companyName, pattern),
            ilike(customers.email, pattern),
          )!,
        );
      }

      const rows = await tx
        .select()
        .from(customers)
        .where(and(...conditions))
        .orderBy(desc(customers.createdAt));

      return {
        customers: rows.map((c) => ({
          id: c.id,
          workspaceId: c.workspaceId,
          name: c.name,
          companyName: c.companyName,
          email: c.email,
          phone: c.phone,
          notes: c.notes,
          isActive: c.isActive,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        })),
        total: rows.length,
      };
    });
  }

  /**
   * Retrieves single customer by ID.
   */
  async getCustomerById(workspaceId: string, customerId: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [customer] = await tx
        .select()
        .from(customers)
        .where(and(eq(customers.workspaceId, workspaceId), eq(customers.id, customerId)));

      if (!customer) {
        const error = new Error('Customer not found');
        (error as any).statusCode = 404;
        throw error;
      }

      return {
        id: customer.id,
        workspaceId: customer.workspaceId,
        name: customer.name,
        companyName: customer.companyName,
        email: customer.email,
        phone: customer.phone,
        notes: customer.notes,
        isActive: customer.isActive,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Updates an existing customer.
   */
  async updateCustomer(workspaceId: string, customerId: string, input: UpdateCustomerRequest) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [existing] = await tx
        .select()
        .from(customers)
        .where(and(eq(customers.workspaceId, workspaceId), eq(customers.id, customerId)));

      if (!existing) {
        const error = new Error('Customer not found');
        (error as any).statusCode = 404;
        throw error;
      }

      const updates: Record<string, any> = {
        updatedAt: new Date(),
      };

      if (input.name !== undefined) updates.name = input.name;
      if (input.companyName !== undefined) updates.companyName = input.companyName;
      if (input.email !== undefined) updates.email = input.email;
      if (input.phone !== undefined) updates.phone = input.phone;
      if (input.notes !== undefined) updates.notes = input.notes;
      if (input.isActive !== undefined) updates.isActive = input.isActive;

      const [updated] = await tx
        .update(customers)
        .set(updates)
        .where(and(eq(customers.workspaceId, workspaceId), eq(customers.id, customerId)))
        .returning();

      return {
        id: updated.id,
        workspaceId: updated.workspaceId,
        name: updated.name,
        companyName: updated.companyName,
        email: updated.email,
        phone: updated.phone,
        notes: updated.notes,
        isActive: updated.isActive,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Creates a physical customer site.
   */
  async createCustomerSite(
    workspaceId: string,
    customerId: string,
    input: CreateCustomerSiteRequest,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      // Verify customer exists
      const [customer] = await tx
        .select({ id: customers.id, name: customers.name })
        .from(customers)
        .where(and(eq(customers.workspaceId, workspaceId), eq(customers.id, customerId)));

      if (!customer) {
        const error = new Error('Customer not found');
        (error as any).statusCode = 404;
        throw error;
      }

      const [site] = await tx
        .insert(customerSites)
        .values({
          workspaceId,
          customerId,
          name: input.name,
          address: input.address,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          geofenceRadiusMeters: input.geofenceRadiusMeters ?? 100.0,
          contactName: input.contactName ?? null,
          contactPhone: input.contactPhone ?? null,
          notes: input.notes ?? null,
          isActive: true,
        })
        .returning();

      if (!site) {
        throw new Error('Failed to create customer site');
      }

      return {
        id: site.id,
        workspaceId: site.workspaceId,
        customerId: site.customerId,
        customerName: customer.name,
        name: site.name,
        address: site.address,
        latitude: site.latitude,
        longitude: site.longitude,
        geofenceRadiusMeters: site.geofenceRadiusMeters,
        contactName: site.contactName,
        contactPhone: site.contactPhone,
        notes: site.notes,
        isActive: site.isActive,
        createdAt: site.createdAt.toISOString(),
        updatedAt: site.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Lists all physical sites for a customer.
   */
  async listCustomerSites(workspaceId: string, customerId: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      // Verify customer exists
      const [customer] = await tx
        .select({ id: customers.id, name: customers.name })
        .from(customers)
        .where(and(eq(customers.workspaceId, workspaceId), eq(customers.id, customerId)));

      if (!customer) {
        const error = new Error('Customer not found');
        (error as any).statusCode = 404;
        throw error;
      }

      const rows = await tx
        .select()
        .from(customerSites)
        .where(and(eq(customerSites.workspaceId, workspaceId), eq(customerSites.customerId, customerId)))
        .orderBy(desc(customerSites.createdAt));

      return {
        sites: rows.map((s) => ({
          id: s.id,
          workspaceId: s.workspaceId,
          customerId: s.customerId,
          customerName: customer.name,
          name: s.name,
          address: s.address,
          latitude: s.latitude,
          longitude: s.longitude,
          geofenceRadiusMeters: s.geofenceRadiusMeters,
          contactName: s.contactName,
          contactPhone: s.contactPhone,
          notes: s.notes,
          isActive: s.isActive,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
        total: rows.length,
      };
    });
  }

  /**
   * Retrieves single customer site by ID.
   */
  async getCustomerSiteById(workspaceId: string, customerId: string, siteId: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [customer] = await tx
        .select({ id: customers.id, name: customers.name })
        .from(customers)
        .where(and(eq(customers.workspaceId, workspaceId), eq(customers.id, customerId)));

      if (!customer) {
        const error = new Error('Customer not found');
        (error as any).statusCode = 404;
        throw error;
      }

      const [site] = await tx
        .select()
        .from(customerSites)
        .where(
          and(
            eq(customerSites.workspaceId, workspaceId),
            eq(customerSites.customerId, customerId),
            eq(customerSites.id, siteId),
          ),
        );

      if (!site) {
        const error = new Error('Customer site not found');
        (error as any).statusCode = 404;
        throw error;
      }

      return {
        id: site.id,
        workspaceId: site.workspaceId,
        customerId: site.customerId,
        customerName: customer.name,
        name: site.name,
        address: site.address,
        latitude: site.latitude,
        longitude: site.longitude,
        geofenceRadiusMeters: site.geofenceRadiusMeters,
        contactName: site.contactName,
        contactPhone: site.contactPhone,
        notes: site.notes,
        isActive: site.isActive,
        createdAt: site.createdAt.toISOString(),
        updatedAt: site.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Updates an existing customer site.
   */
  async updateCustomerSite(
    workspaceId: string,
    customerId: string,
    siteId: string,
    input: UpdateCustomerSiteRequest,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [customer] = await tx
        .select({ id: customers.id, name: customers.name })
        .from(customers)
        .where(and(eq(customers.workspaceId, workspaceId), eq(customers.id, customerId)));

      if (!customer) {
        const error = new Error('Customer not found');
        (error as any).statusCode = 404;
        throw error;
      }

      const [existing] = await tx
        .select()
        .from(customerSites)
        .where(
          and(
            eq(customerSites.workspaceId, workspaceId),
            eq(customerSites.customerId, customerId),
            eq(customerSites.id, siteId),
          ),
        );

      if (!existing) {
        const error = new Error('Customer site not found');
        (error as any).statusCode = 404;
        throw error;
      }

      const updates: Record<string, any> = {
        updatedAt: new Date(),
      };

      if (input.name !== undefined) updates.name = input.name;
      if (input.address !== undefined) updates.address = input.address;
      if (input.latitude !== undefined) updates.latitude = input.latitude;
      if (input.longitude !== undefined) updates.longitude = input.longitude;
      if (input.geofenceRadiusMeters !== undefined) updates.geofenceRadiusMeters = input.geofenceRadiusMeters;
      if (input.contactName !== undefined) updates.contactName = input.contactName;
      if (input.contactPhone !== undefined) updates.contactPhone = input.contactPhone;
      if (input.notes !== undefined) updates.notes = input.notes;
      if (input.isActive !== undefined) updates.isActive = input.isActive;

      const [updated] = await tx
        .update(customerSites)
        .set(updates)
        .where(
          and(
            eq(customerSites.workspaceId, workspaceId),
            eq(customerSites.customerId, customerId),
            eq(customerSites.id, siteId),
          ),
        )
        .returning();

      return {
        id: updated.id,
        workspaceId: updated.workspaceId,
        customerId: updated.customerId,
        customerName: customer.name,
        name: updated.name,
        address: updated.address,
        latitude: updated.latitude,
        longitude: updated.longitude,
        geofenceRadiusMeters: updated.geofenceRadiusMeters,
        contactName: updated.contactName,
        contactPhone: updated.contactPhone,
        notes: updated.notes,
        isActive: updated.isActive,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    });
  }
}
