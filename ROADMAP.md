# RH Transformation — Post-V1 Roadmap

Captured 2026-04-22 after the end-of-V1 audit. Items are grouped by milestone.
Check boxes mean: planned for that milestone, not yet shipped.

---

## V1.5 — Ship-blockers (next build)

- [ ] **Mobile nav for the portal.** Sidebar is desktop-only. Add a top bar + drawer for `<md`.
- [ ] **Intake → labeled fields.** Stop `JSON.stringify`-ing the Tally payload on the coach client page; render as "Label → Answer" rows.
- [ ] **Fix Claude "Apply to form" regression.** Diagnose via the debug logs already in place; apply should also give a visible "Applied" confirmation so the coach knows it worked even without scrolling.
- [ ] **End-to-end Stripe webhook test.** Stripe CLI + `stripe trigger checkout.session.completed`; confirm a `payments` row + `clients.status=paid` + `start_date` populated.
- [ ] **Log actual weight / reps / notes on training blocks.** On mark-complete, prompt for what was actually performed; persist to `client_schedule.detail.actual = { sets, reps, weight, note }`.

## V1.6 — Biggest client-value follow-ups

- [ ] **Speaker-labeled transcripts + transcript search.**
  - Parse WebVTT `<v Name>` tags so the UI renders per-speaker.
  - Add `/app/transcripts` search: embed query → pgvector similarity → return matching transcript paragraphs with the meeting linked.
- [ ] **Notification center.** Red-dot unread counter in the sidebar + `/app/inbox` page. Events that fire: coach flag raised, new meeting scheduled, new resource shared, worrying check-in pattern.
- [ ] **Past-week grace period for mark-complete.** Client can mark last week's blocks complete within 7 days of the week ending.
- [ ] **Flags: wire to real signals.** Auto-raise a flag when: no check-in for 2+ consecutive days, mood ≤ 2 for 3+ days, friction contains keyword list ("hurt", "injured", "giving up", "quit", etc.), missed meeting. Or remove the dot in the roster.
- [ ] **Reprocess button on meetings.** If the Zoom workflow stalled or failed, coach can kick it off again from the meeting row.

## V2 — The weekly planner (4th-generation planning, Covey)

The biggest feature bet on the roadmap. Model the client-side weekly view on Covey's
Quadrant II / 7 Habits 4th-gen planning templates. The client uses the portal to plan
their whole week, not just training.

**Concept:**
- Client defines their **roles** (father, husband, athlete, operator, brother, friend…)
- Each week they set **1–2 Q2 goals per role** (important, not urgent)
- They schedule the "big rocks" first — the coach-prescribed training sessions, the
  behavior-board work, their own Q2 goals
- Then the small stuff fits around those rocks

**Surfaces:**
- [ ] `client_roles` table: `id, clientId, name, position`
- [ ] `weekly_goals` table: `id, clientId, weekStart, roleId, text, position, completedAt`
- [ ] `planner_entries` table: personal tasks/events the client adds themselves (title,
      startAt, durationMin, roleId, source=training|behavior|personal, linked_id nullable)
- [ ] `/app/plan/this-week` — Covey "Weekly Compass" view:
  1. **Sharpen the saw** (principles pane — static, pulled from your mindset content)
  2. **Roles** list — editable
  3. **This week's goals** — 1–2 per role, big-rock flagged
  4. **Schedule** — 7-day grid that pre-populates with assigned training + behavior
     prompts, then client drags goals + personal tasks onto specific days/times.
     Reuses `@dnd-kit`.
  5. **Daily adapt** — phone-friendly single-day view for the day-of adjustments.
- [ ] Training + behaviors auto-appear in the schedule, draggable but not deletable
      by the client (same rules as `/app/training`).
- [ ] Friday review prompt: which Q2 goals hit, which didn't, why?

## V2 polish

- [ ] **Archive graduated clients.** Collapsed "archive" section in the roster.
- [ ] **Duplicate week in program builder.** One-click copy a completed week forward.
- [ ] **Resource library filters.** Client side: "Prescribed to me", "By pillar",
      "Most-used" tabs. Coach side already has filters.
- [ ] **Audit log** on shared resources + exercises (who edited what, when).
- [ ] **Skeleton loaders** / `<Suspense>` boundaries on the heavier pages.
- [ ] **Keyboard shortcuts** on the coach client-detail page.
- [ ] **Behavior priority / archive.** Pin the 1-2 behaviors a man is focused on this
      week; archive completed ones so the board doesn't stack forever.
- [ ] **Exercise demo preview inside the program builder** (hover/click the catalog
      row to peek the video without leaving).
- [ ] **Weight/reps history chart** on a client's training view.
- [ ] **Payment history** on the client detail page.
- [ ] **Cohort view** for the coach (all Week-3 men on the same Monday).

## V2 nice-to-haves

- [ ] Magic-string enums consolidated into `lib/enums.ts`.
- [ ] Blob proxy supports HTTP Range for video scrubbing.
- [ ] Keys that live only in `.env.local` (Anthropic, Calendly signing) get
      pushed to Vercel so `env pull` doesn't wipe them.
- [ ] In-app changelog + first-login tour for new clients.

---

*Source: post-V1 audit. Last updated 2026-04-22.*
