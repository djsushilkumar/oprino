-- Oprino Phase 05 Migration: V1 Release Blockers Remediation
-- BLK-002 (Secure Invitations), BLK-004 (Selfie & Policy Attendance), BLK-005 (Lifecycle & Manager), BLK-006 (Location Retention)

-- 1. Extend workspaces with location retention days and attendance policy
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "location_retention_days" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "attendance_policy" varchar(50) DEFAULT 'SIMPLE' NOT NULL;--> statement-breakpoint

-- 2. Extend workspace_memberships with manager_id
ALTER TABLE "workspace_memberships" ADD COLUMN IF NOT EXISTS "manager_id" uuid;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

-- 3. Extend attendance_sessions with selfie and coordinates
ALTER TABLE "attendance_sessions" ADD COLUMN IF NOT EXISTS "selfie_media_key" text;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD COLUMN IF NOT EXISTS "punch_in_latitude" double precision;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD COLUMN IF NOT EXISTS "punch_in_longitude" double precision;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD COLUMN IF NOT EXISTS "punch_in_accuracy" double precision;--> statement-breakpoint

-- 4. Create workspace_invitations table for BLK-002 secure invitations
CREATE TABLE IF NOT EXISTS "workspace_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"role_id" uuid NOT NULL,
	"invited_by" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL UNIQUE,
	"status" varchar(32) DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "workspace_invitations_workspace_idx" ON "workspace_invitations" ("workspace_id", "status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspace_invitations_email_idx" ON "workspace_invitations" ("workspace_id", "email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "workspace_invitations_token_hash_idx" ON "workspace_invitations" ("token_hash");--> statement-breakpoint

-- 5. Row-Level Security on workspace_invitations
ALTER TABLE "workspace_invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspace_invitations" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation_workspace_invitations" ON "workspace_invitations";--> statement-breakpoint
CREATE POLICY "tenant_isolation_workspace_invitations" ON "workspace_invitations"
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

-- 6. Per-Workspace Telemetry Retention Pruning Procedure (BLK-006)
CREATE OR REPLACE FUNCTION telemetry_prune_workspace_records(p_workspace_id UUID, p_retention_days INT)
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
  WHERE "workspace_id" = p_workspace_id
    AND "recorded_at" < v_cutoff;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

