ALTER TABLE "exercises" ADD COLUMN "default_duration_min" integer;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "coach_notes" text;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "in_library" boolean DEFAULT true NOT NULL;