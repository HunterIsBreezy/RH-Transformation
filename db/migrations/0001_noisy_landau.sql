ALTER TYPE "public"."client_status" ADD VALUE 'applied' BEFORE 'scheduled';--> statement-breakpoint
ALTER TYPE "public"."client_status" ADD VALUE 'paid' BEFORE 'active';--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "canceled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "calendly_event_uri" text;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "calendly_invitee_uri" text;