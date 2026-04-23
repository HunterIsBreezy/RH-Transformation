ALTER TABLE "clients" ALTER COLUMN "transcript_consent" SET DEFAULT true;--> statement-breakpoint
UPDATE "clients" SET "transcript_consent" = true WHERE "transcript_consent" = false;