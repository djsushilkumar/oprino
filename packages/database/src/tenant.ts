import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema/index.js';

/**
 * Executes a database operation within an explicit, transaction-scoped tenant boundary.
 * Enforces Rule 6 & ADR-005: Multi-Tenant Isolation with SET LOCAL app.current_workspace_id.
 *
 * In pooled connection environments, using set_config(..., true) ensures the setting
 * clears automatically upon transaction commit or rollback, completely preventing
 * cross-tenant connection pool leaks.
 */
export async function withTenantContext<T>(
  db: PostgresJsDatabase<typeof schema>,
  workspaceId: string,
  operation: (tx: PostgresJsDatabase<typeof schema>) => Promise<T>,
  options?: { asAppRole?: boolean },
): Promise<T> {
  if (!workspaceId || typeof workspaceId !== 'string') {
    throw new Error('Tenant context violation: workspaceId is required and must be non-empty');
  }

  return db.transaction(async (tx) => {
    if (options?.asAppRole) {
      await tx.execute(sql`SET LOCAL ROLE oprino_app`);
    }
    await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);
    return operation(tx as unknown as PostgresJsDatabase<typeof schema>);
  });
}
