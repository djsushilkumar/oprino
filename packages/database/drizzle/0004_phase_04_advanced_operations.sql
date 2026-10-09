-- Oprino Phase 04 Migration: Advanced Scheduling, Dispatch Routing, Conflict Resilience & Operational Analytics

-- 1. Extend visits table with sequence order and route date
ALTER TABLE "visits" ADD COLUMN "sequence_order" integer;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "route_date" varchar(10);--> statement-breakpoint
CREATE INDEX "visits_workspace_user_route_idx" ON "visits" ("workspace_id", "user_id", "route_date", "sequence_order");--> statement-breakpoint

-- 2. Create recurring_task_templates table
CREATE TABLE "recurring_task_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"priority" varchar(20) DEFAULT 'MEDIUM' NOT NULL,
	"customer_id" uuid,
	"site_id" uuid,
	"requires_signature" boolean DEFAULT false NOT NULL,
	"requires_photo_proof" boolean DEFAULT false NOT NULL,
	"checklist_template" jsonb DEFAULT '[]'::jsonb,
	"assignee_ids" jsonb DEFAULT '[]'::jsonb,
	"recurrence_frequency" varchar(20) NOT NULL,
	"recurrence_interval" integer DEFAULT 1 NOT NULL,
	"days_of_week" jsonb DEFAULT '[]'::jsonb,
	"day_of_month" integer,
	"time_of_day" varchar(10) DEFAULT '09:00' NOT NULL,
	"timezone" varchar(50) DEFAULT 'UTC' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"next_run_at" timestamp with time zone NOT NULL,
	"last_run_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "recurring_task_templates" ADD CONSTRAINT "recurring_task_templates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_task_templates" ADD CONSTRAINT "recurring_task_templates_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_task_templates" ADD CONSTRAINT "recurring_task_templates_site_id_customer_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "customer_sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_task_templates" ADD CONSTRAINT "recurring_task_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recurring_tasks_workspace_active_idx" ON "recurring_task_templates" ("workspace_id", "is_active", "next_run_at");--> statement-breakpoint

-- 3. Create shift_rosters table
CREATE TABLE "shift_rosters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"shift_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"scheduled_date" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'SCHEDULED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "shift_rosters" ADD CONSTRAINT "shift_rosters_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_rosters" ADD CONSTRAINT "shift_rosters_shift_id_attendance_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "attendance_shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_rosters" ADD CONSTRAINT "shift_rosters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "shift_rosters_workspace_user_date_idx" ON "shift_rosters" ("workspace_id", "user_id", "scheduled_date");--> statement-breakpoint
CREATE INDEX "shift_rosters_workspace_date_idx" ON "shift_rosters" ("workspace_id", "scheduled_date");--> statement-breakpoint

-- 4. Create notifications table
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"entity_type" varchar(50),
	"entity_id" varchar(255),
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_workspace_user_read_idx" ON "notifications" ("workspace_id", "user_id", "is_read", "created_at");--> statement-breakpoint

-- 5. Create sync_mutation_records table
CREATE TABLE "sync_mutation_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"mutation_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(255) NOT NULL,
	"mutation_type" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"resolution_note" text,
	"client_timestamp" timestamp with time zone NOT NULL,
	"replayed_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "sync_mutation_records" ADD CONSTRAINT "sync_mutation_records_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sync_mutations_workspace_mutation_idx" ON "sync_mutation_records" ("workspace_id", "mutation_id");--> statement-breakpoint
CREATE INDEX "sync_mutations_workspace_entity_idx" ON "sync_mutation_records" ("workspace_id", "entity_type", "entity_id");--> statement-breakpoint

-- =========================================================================
-- ROW-LEVEL SECURITY POLICIES (MANDATORY INVARIANT)
-- =========================================================================

-- 1. recurring_task_templates RLS
ALTER TABLE "recurring_task_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "recurring_task_templates" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation_recurring_task_templates" ON "recurring_task_templates"
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

-- 2. shift_rosters RLS
ALTER TABLE "shift_rosters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "shift_rosters" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation_shift_rosters" ON "shift_rosters"
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

-- 3. notifications RLS
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation_notifications" ON "notifications"
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

-- 4. sync_mutation_records RLS
ALTER TABLE "sync_mutation_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sync_mutation_records" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation_sync_mutation_records" ON "sync_mutation_records"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR "workspace_id" = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR "workspace_id" = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid
  );
