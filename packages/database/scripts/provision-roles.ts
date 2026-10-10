import postgres from 'postgres';

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://oprino_admin:oprino_dev_password@localhost:5432/oprino_db';

const sql = postgres(databaseUrl, { max: 1 });

async function main() {
  console.log('Provisioning non-superuser role oprino_app for RLS kernel enforcement...');
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'oprino_app') THEN
        CREATE ROLE oprino_app WITH LOGIN PASSWORD 'oprino_dev_password';
      END IF;
    END $$;
  `;
  try {
    await sql`GRANT ALL PRIVILEGES ON DATABASE oprino_db TO oprino_app`;
  } catch (err) {
    console.warn('Database-level grant notice:', err.message);
  }
  await sql`GRANT USAGE ON SCHEMA public TO oprino_app`;
  await sql`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO oprino_app`;
  await sql`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO oprino_app`;
  await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO oprino_app`;
  await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO oprino_app`;
  console.log('✔ Non-superuser role oprino_app successfully provisioned with RLS table permissions.');
  await sql.end();
}

main().catch((err) => {
  console.error('Failed to provision roles:', err);
  process.exit(1);
});
