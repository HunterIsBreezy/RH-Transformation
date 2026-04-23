# RH Transformation — Prioritized Roadmap

Last re-prioritized 2026-04-22 after V1.5 (mobile nav, intake, actuals, Claude apply)
and V1.6 transcripts + search shipped. Work top-down, one item per session.

---

## 🎯 Next up — quick-win stack (1–2 hours each)

**Start here. Each one is contained, ships in a single session, compounds.**

1. **Past-week grace period for mark-complete.** Let a client mark last
   week's training blocks done within 7 days of the week ending. Tiny change
   to `moveScheduleBlock` + `toggleBlockComplete` client-side gate, UI shows
   "Grace period ends in 3 days" badge. Directly affects the 80%-completion
   guarantee math.

2. **Reprocess meeting button (coach).** When the Zoom workflow fails or
   the recording posts late, coach can kick it off again from the meeting
   row. Adds a `reprocessMeetingRecording(meetingId)` Server Action that
   calls `start(processMeetingRecording, [id])`. Safety net for the whole
   V1.4 pipeline.

3. **Archive graduated clients.** Default roster filter to
   `status in (applicant, applied, scheduled, paid, active)`; collapsible
   "Archive" section for `graduated | paused | declined`. No schema change.

4. **Duplicate week in program builder.** Button on each W1–W15 row
   header: "Copy week → next" or "Copy week → through end". Reuses the
   `cloneFromClient` snapshot pattern intra-client.

5. **Payment history card on client detail.** `payments` table already
   populates from the Stripe webhook. Coach just can't see it yet. One
   query + one card.

## 🟠 Client-experience fixes (half-day each)

6. **Resource library filters (client side).** Currently client `/app/resources`
   is a flat reverse-chron list. Add "Prescribed to me" (join through
   behavior_entries.resource_ids + prescription_templates), "By pillar",
   "Most-used". Coach side already has filters.

7. **Behavior priority + archive.** Pin the 1–2 behaviors a man is focused
   on this week; archive completed/dropped so the board doesn't stack
   forever. Adds `priority` int + visual order to `behavior_entries`.

8. **Exercise demo preview inside the program builder.** Hover/click a
   catalog row → inline video preview without leaving the page. Reuses
   `ResourceChip` embed logic.

## 🔴 Retention-critical

9. **Notification center.** Red-dot unread counter in the sidebar +
   `/app/inbox`. Events that fire: coach flag raised, new meeting scheduled,
   new resource shared, worrying check-in pattern. Needs new `notifications`
   table + a poller or server-push. Without this, coach actions don't reach
   clients between calls.

10. **Flags: wire to real signals.** Auto-raise a flag when: no check-in
    for 2+ consecutive days, mood ≤ 2 for 3+ days, friction contains
    keyword list ("hurt", "injured", "giving up", "quit", etc.), missed
    meeting. Until this ships, the copper flag dot is decorative.

## 🟦 V2 — The weekly planner (multi-session bet)

The biggest feature on the roadmap. Covey 4th-generation weekly planning:
client defines their roles, sets 1–2 Q2 (important-not-urgent) goals per
role per week, and schedules big rocks first — with coach-prescribed
training and behavior-board work already populated.

Break into three sessions:

**Session A — data + roles:**
- `client_roles` table: `id, clientId, name, position`
- `weekly_goals` table: `id, clientId, weekStart, roleId, text, position, completedAt`
- `planner_entries` table: `id, clientId, startAt, durationMin, title, roleId?, source (training|behavior|personal), linkedId`
- `/app/plan/roles` CRUD

**Session B — weekly compass:**
- `/app/plan/this-week` — the Covey template laid out as one page:
  1. Roles list (editable in place)
  2. Weekly goals grid — 1–2 per role
  3. Big-rocks schedule (Mon–Sun) — auto-populated from training + behaviors
  4. Drag personal tasks + goals onto the schedule

**Session C — friday review + daily adapt:**
- Friday review prompt (which goals hit, which didn't)
- Daily single-day view for day-of adjustments (phone-friendly)

## 🟢 V2 polish (small, whenever)

- Audit log on shared resources + exercises
- Skeleton loaders / `<Suspense>` boundaries on heavier pages
- Keyboard shortcuts on coach client-detail (`j/k` walk meetings, etc.)
- Weight/reps history chart on client training view
- Cohort view for coach (all Week-3 men same Monday)
- Magic-string enums consolidated into `lib/enums.ts`
- Blob proxy supports HTTP Range for video scrubbing
- Push locally-only env keys to Vercel so `env pull` doesn't wipe them
- In-app changelog + first-login tour for new clients

## 📋 Pre-launch ops checklist (not code)

- End-to-end Stripe webhook test. `stripe listen --forward-to
  localhost:3000/api/webhooks/stripe` → grab `whsec_…` → `stripe trigger
  checkout.session.completed` → confirm `payments` row + `clients.status=paid`
  + `start_date` populated.
- Register Stripe webhook in production dashboard at
  `https://rhtransformation.xyz/api/webhooks/stripe`.
- Configure Calendly webhook against prod URL (same flow we used for ngrok).
- Provision Zoom server-to-server OAuth (Account ID + Client ID/Secret +
  Coach User ID) in Vercel env.
- Confirm `ANTHROPIC_API_KEY`, `CALENDLY_SIGNING_KEY`, `OPENAI_API_KEY`
  (or AI Gateway auth) are in Vercel prod env — not just local.

---

## How to pick the next session

- **New session, short on time** → take the next unchecked item from the
  quick-win stack.
- **2–3 hour chunk** → one item from retention-critical.
- **Full day** → kick off the weekly planner Session A.

*Keep this file honest. Mark items done as you ship them.*
