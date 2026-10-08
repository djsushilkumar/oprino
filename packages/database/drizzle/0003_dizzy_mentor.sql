CREATE TABLE "customer_sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"geofence_radius_meters" double precision DEFAULT 100 NOT NULL,
	"contact_name" varchar(255),
	"contact_phone" varchar(50),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"company_name" varchar(255),
	"email" varchar(255),
	"phone" varchar(50),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"visit_id" uuid,
	"user_id" uuid NOT NULL,
	"proof_type" varchar(50) NOT NULL,
	"file_key" text NOT NULL,
	"file_url" text,
	"file_size_bytes" integer,
	"mime_type" varchar(100),
	"signer_name" varchar(255),
	"signer_phone" varchar(50),
	"watermark_metadata" jsonb DEFAULT '{}'::jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"site_id" uuid,
	"task_id" uuid,
	"user_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'PLANNED' NOT NULL,
	"planned_at" timestamp with time zone,
	"check_in_time" timestamp with time zone,
	"check_out_time" timestamp with time zone,
	"check_in_latitude" double precision,
	"check_in_longitude" double precision,
	"check_out_latitude" double precision,
	"check_out_longitude" double precision,
	"duration_minutes" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "customer_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "site_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "requires_signature" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "requires_photo_proof" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "verified_by" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "verification_notes" text;--> statement-breakpoint
ALTER TABLE "customer_sites" ADD CONSTRAINT "customer_sites_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_sites" ADD CONSTRAINT "customer_sites_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_proofs" ADD CONSTRAINT "task_proofs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_proofs" ADD CONSTRAINT "task_proofs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_proofs" ADD CONSTRAINT "task_proofs_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_proofs" ADD CONSTRAINT "task_proofs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_site_id_customer_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."customer_sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_sites_workspace_customer_idx" ON "customer_sites" USING btree ("workspace_id","customer_id");--> statement-breakpoint
CREATE INDEX "customer_sites_workspace_active_idx" ON "customer_sites" USING btree ("workspace_id","is_active");--> statement-breakpoint
CREATE INDEX "customers_workspace_active_idx" ON "customers" USING btree ("workspace_id","is_active");--> statement-breakpoint
CREATE INDEX "customers_workspace_name_idx" ON "customers" USING btree ("workspace_id","name");--> statement-breakpoint
CREATE INDEX "task_proofs_workspace_task_idx" ON "task_proofs" USING btree ("workspace_id","task_id");--> statement-breakpoint
CREATE INDEX "task_proofs_workspace_type_idx" ON "task_proofs" USING btree ("workspace_id","proof_type");--> statement-breakpoint
CREATE INDEX "visits_workspace_user_idx" ON "visits" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "visits_workspace_customer_idx" ON "visits" USING btree ("workspace_id","customer_id");--> statement-breakpoint
CREATE INDEX "visits_workspace_task_idx" ON "visits" USING btree ("workspace_id","task_id");--> statement-breakpoint
CREATE INDEX "visits_workspace_status_idx" ON "visits" USING btree ("workspace_id","status");--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_site_id_customer_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."customer_sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- =========================================================================
-- Phase 03: PostgreSQL Row-Level Security (RLS) Isolation Policies
-- Invariant: Multi-Tenant Isolation with SET LOCAL app.current_workspace_id
-- =========================================================================

-- 1. Customer Sites RLS
ALTER TABLE "customer_sites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "customer_sites" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation_customer_sites" ON "customer_sites"
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

-- 2. Customers Directory RLS
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "customers" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation_customers" ON "customers"
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

-- 3. Physical Site Visits RLS
ALTER TABLE "visits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "visits" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation_visits" ON "visits"
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

-- 4. Proof of Work & Media Attachments RLS
ALTER TABLE "task_proofs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "task_proofs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation_task_proofs" ON "task_proofs"
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