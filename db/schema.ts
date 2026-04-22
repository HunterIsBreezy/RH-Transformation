import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  vector,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["coach", "client"]);
export const clientStatusEnum = pgEnum("client_status", [
  "applicant",
  "applied",
  "scheduled",
  "paid",
  "active",
  "graduated",
  "paused",
  "declined",
]);
export const meetingKindEnum = pgEnum("meeting_kind", [
  "discovery",
  "kickoff",
  "weekly",
  "close_out",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "refunded",
  "failed",
]);
export const behaviorStatusEnum = pgEnum("behavior_status", [
  "current",
  "desired",
  "prescribed",
  "inflight",
  "completed",
  "dropped",
]);
export const flagSeverityEnum = pgEnum("flag_severity", ["info", "watch", "urgent"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: text("clerk_id").notNull(),
    email: text("email").notNull(),
    fullName: text("full_name"),
    role: roleEnum("role").notNull().default("client"),
    avatarUrl: text("avatar_url"),
    ...timestamps,
  },
  (t) => ({
    clerkIdx: uniqueIndex("users_clerk_id_idx").on(t.clerkId),
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  }),
);

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    status: clientStatusEnum("status").notNull().default("applicant"),
    cohortLabel: text("cohort_label"),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    transcriptConsent: boolean("transcript_consent").notNull().default(false),
    consentSignedAt: timestamp("consent_signed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    userIdx: uniqueIndex("clients_user_id_idx").on(t.userId),
    statusIdx: index("clients_status_idx").on(t.status),
  }),
);

export const intakeResponses = pgTable(
  "intake_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
    source: text("source").notNull().default("tally"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull(),
    payload: jsonb("payload").notNull(),
    ...timestamps,
  },
  (t) => ({
    clientIdx: index("intake_responses_client_idx").on(t.clientId),
  }),
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
    stripeId: text("stripe_id").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    kind: text("kind").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    stripeIdx: uniqueIndex("payments_stripe_id_idx").on(t.stripeId),
    clientIdx: index("payments_client_idx").on(t.clientId),
  }),
);

export const meetings = pgTable(
  "meetings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
    coachId: uuid("coach_id").references(() => users.id).notNull(),
    kind: meetingKindEnum("kind").notNull().default("weekly"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    source: text("source").notNull().default("manual"),
    calendlyEventUri: text("calendly_event_uri"),
    calendlyInviteeUri: text("calendly_invitee_uri"),
    zoomMeetingId: text("zoom_meeting_id"),
    zoomRecordingUrl: text("zoom_recording_url"),
    transcriptText: text("transcript_text"),
    transcriptEmbedding: vector("transcript_embedding", { dimensions: 1536 }),
    coachNotes: text("coach_notes"),
    ...timestamps,
  },
  (t) => ({
    clientIdx: index("meetings_client_idx").on(t.clientId),
    scheduledIdx: index("meetings_scheduled_idx").on(t.scheduledAt),
  }),
);

export const checkIns = pgTable(
  "check_ins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
    day: timestamp("day", { withTimezone: true, mode: "date" }).notNull(),
    mood: integer("mood"),
    energy: integer("energy"),
    sleepHours: integer("sleep_hours"),
    training: text("training"),
    nutrition: text("nutrition"),
    win: text("win"),
    friction: text("friction"),
    note: text("note"),
    ...timestamps,
  },
  (t) => ({
    clientDayIdx: uniqueIndex("check_ins_client_day_idx").on(t.clientId, t.day),
  }),
);

export const behaviorEntries = pgTable(
  "behavior_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
    pillar: text("pillar").notNull(),
    current: text("current").notNull(),
    desired: text("desired").notNull(),
    prescription: text("prescription"),
    resourceIds: jsonb("resource_ids").$type<string[]>().default([]).notNull(),
    status: behaviorStatusEnum("status").notNull().default("current"),
    progressPct: integer("progress_pct").notNull().default(0),
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (t) => ({
    clientIdx: index("behavior_entries_client_idx").on(t.clientId),
  }),
);

export const resources = pgTable(
  "resources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    author: text("author"),
    url: text("url"),
    bodyMd: text("body_md"),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    behaviorsTargeted: jsonb("behaviors_targeted").$type<string[]>().default([]).notNull(),
    coverAssetId: text("cover_asset_id"),
    authorId: uuid("author_id").references(() => users.id),
    inLibrary: boolean("in_library").notNull().default(true),
    ...timestamps,
  },
  (t) => ({
    kindIdx: index("resources_kind_idx").on(t.kind),
  }),
);

export const prescriptionTemplates = pgTable(
  "prescription_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    pillar: text("pillar").notNull(),
    body: text("body").notNull(),
    resourceIds: jsonb("resource_ids").$type<string[]>().default([]).notNull(),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    authorId: uuid("author_id").references(() => users.id),
    ...timestamps,
  },
);

export const exercises = pgTable(
  "exercises",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    primaryMuscles: jsonb("primary_muscles").$type<string[]>().default([]).notNull(),
    demoUrl: text("demo_url"),
    cues: text("cues"),
    defaultSets: integer("default_sets"),
    defaultReps: text("default_reps"),
    authorId: uuid("author_id").references(() => users.id),
    ...timestamps,
  },
  (t) => ({
    nameIdx: uniqueIndex("exercises_name_idx").on(t.name),
  }),
);

export const trainingBlockTemplates = pgTable(
  "training_block_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    goal: text("goal"),
    weeks: integer("weeks").notNull().default(4),
    structure: jsonb("structure").notNull(),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    authorId: uuid("author_id").references(() => users.id),
    ...timestamps,
  },
);

export const clientSchedule = pgTable(
  "client_schedule",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
    weekStart: timestamp("week_start", { withTimezone: true, mode: "date" }).notNull(),
    day: integer("day").notNull(),
    slot: integer("slot").notNull().default(0),
    exerciseId: uuid("exercise_id").references(() => exercises.id),
    title: text("title").notNull(),
    detail: jsonb("detail").notNull(),
    lockedByCoach: boolean("locked_by_coach").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    clientWeekIdx: index("client_schedule_client_week_idx").on(t.clientId, t.weekStart),
  }),
);

export const clientProfile = pgTable(
  "client_profile",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
    psychProfile: jsonb("psych_profile"),
    motivationNotes: text("motivation_notes"),
    riskFlags: jsonb("risk_flags").$type<string[]>().default([]).notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    ...timestamps,
  },
  (t) => ({
    clientIdx: uniqueIndex("client_profile_client_idx").on(t.clientId),
  }),
);

export const coachFlags = pgTable(
  "coach_flags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
    raisedBy: uuid("raised_by").references(() => users.id).notNull(),
    severity: flagSeverityEnum("severity").notNull().default("watch"),
    reason: text("reason").notNull(),
    sourceKind: text("source_kind"),
    sourceId: uuid("source_id"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedBy: uuid("resolved_by").references(() => users.id),
    resolutionNote: text("resolution_note"),
    ...timestamps,
  },
  (t) => ({
    clientIdx: index("coach_flags_client_idx").on(t.clientId),
    openIdx: index("coach_flags_open_idx").on(t.resolvedAt),
  }),
);
