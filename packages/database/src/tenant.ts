import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema/index.js';

/**
 * Executes a database operation within an explicit, transaction-scoped tenant boundary.
 * Enforces Rule 6: Multi-Tenant Isolation with SET LOCAL app.current_workspace_id.
 */
export async function withTenantContext<T>(
  db: PostgresJsDatabase<typeof schema>,
  workspaceId: string,
  operation: (tx: PostgresJsDatabase<typeof schema>) => Promise<T>,
): Promise<T> {
  if (!workspaceId || typeof workspaceId !== 'string') {
    throw new Error('Tenant context violation: workspaceId is required and must be non-empty');
  }

  return db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL app.current_workspace_id = ${workspaceId}`);
    return operation(tx as unknown as PostgresJsDatabase<typeof schema>);
  });
}
