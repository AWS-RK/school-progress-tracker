# Tanvi's Progress Tracker — Design Spec

Date: 2026-08-17

## Background

A Claude Design handoff bundle (`Tanvi's Progress Tracker-handoff.zip`) contains a fully
specified interactive mockup for a mobile app that tracks a child's (Tanvi's) IEP /
developmental progress: skill levels by domain, IEP goals, a timeline of updates from
parents/teachers/assessments, and a shareable team of people with view access.

The prototype (`project/Tanvi Progress Tracker.dc.html`) is a "DC" (Design Component)
file — plain HTML/CSS/JS with template-like bindings (`{{...}}`, `sc-if`, `sc-for`) — not
production code. It fully specifies layout, copy, states, and interactions for 7 screens
inside an Android device frame (412×892). This spec turns that mockup into a real,
deployed web application.

The "Modernist" design system (`project/_ds/.../styles.css`) is the source of visual
truth: Archivo font, bold red/orange accent (`#ec3013`), zero border-radius everywhere,
tonal color ramps, sharp 2px dividers. The build must match this pixel-for-pixel — same
colors, spacing, and component look (cards, tags, buttons, inputs) — just re-implemented
as a maintainable React app instead of the template-binding prototype markup.

## Goals

- Recreate all 7 prototype screens (Home, Timeline, Goals, Profile, Domain Detail, Add
  Entry, Share/Invite) with matching visual design and interactions.
- Real multi-user data: a family, teachers, and outside providers can each sign in and
  see/update Tanvi's progress, replacing the prototype's in-memory-only state.
- Data persists across devices and sessions via a real backend.
- Deployed and reachable at a URL, not just running locally.

## Non-goals (out of scope for this spec)

- Native iOS/Android app (web app only, though mobile-responsive/installable as PWA).
- Multi-child support in the UI (data model allows it, but only one profile — Tanvi — is
  seeded and the UI doesn't need a child switcher).
- Push notifications, email digests, or reminders.
- Fine-grained per-skill sharing scopes beyond the two the prototype already has ("Full
  progress" / "Academic only").

## Architecture

- **Frontend**: React + TypeScript + Vite. React Router handles the 4 tab routes
  (`/`, `/timeline`, `/goals`, `/profile`) plus sheet/modal-style routes for Add Entry,
  Share/Invite, and Domain Detail (`/domain/:id`, `/add`, `/share`), matching the
  prototype's screen-swap navigation.
- **Backend**: Supabase — the user's existing Supabase project (URL/anon key supplied
  during implementation setup, not committed to the repo). Postgres for structured data,
  Supabase Auth for magic-link sign-in, Supabase Storage for entry attachments
  (photos/documents).
- **Styling**: The Modernist tokens from `styles.css` are ported as global CSS custom
  properties, with component classes (`.card`, `.tag`, `.btn`, `.input`, `.field`)
  reimplemented as CSS Modules or plain CSS matching the originals class-for-class.
  Icons via `lucide-react` (same icon set as the prototype's `lucide` script include).
- **Deployment**: Vercel, connected to this project's git repo for CI-less deploys on
  push (Vite build preset). Supabase URL/anon key set as Vercel env vars.

## Data Model (Postgres / Supabase)

```sql
profiles           -- the tracked child; only one row seeded ("Tanvi") but not hardcoded
  id, name, grade_label, iep_status, last_reevaluation_date, next_annual_review_date

domains             -- Academic Skills, Executive Function, Independence & Safety
  id, profile_id, name, icon, sort_order

skills               -- Reading, Writing, Organization, ...
  id, domain_id, name, sort_order

skill_assessments   -- history of percent-complete per skill (latest = current level)
  id, skill_id, percent, assessed_at

goals                -- IEP goals
  id, profile_id, domain_id, title, baseline, target, percent, status

timeline_entries    -- log of updates; feeds Home "Recent Updates" + full Timeline
  id, profile_id, domain_id, author_id, source (parent|teacher|assessment),
  level, note, attachment_url, occurred_at, created_at

team_members         -- who can access a profile; replaces prototype's in-memory sharedWith
  id, profile_id, user_id (nullable until invite accepted), name, title,
  role (family|school_staff|service_provider), scope (full|academic_only),
  invited_email, created_at
```

**Access control**: Row-Level Security on every table scoped to `profile_id`, where a
user may read/write only if a `team_members` row exists for them (matched by `user_id`
once they've accepted an invite) on that profile. The profile creator is auto-added as
the first `team_members` row.

**Derived values** (computed client-side or via views, not stored): domain-level percent
= average of its skills' latest assessment; skill level label (Emerging / Developing /
Secure / Independent) = threshold bucketing of percent, same thresholds as the prototype
(`percentToLevel`); goal status (On Track / In Progress / Needs Support) = threshold
bucketing of goal percent, same as prototype (`decorateGoal`).

## Screens

| Prototype screen | Route | Behavior |
|---|---|---|
| Home | `/` | Header with child name/grade, year-progress bar, progress-by-domain cards, IEP goals summary card, recent updates feed (last 4 timeline entries) |
| Timeline | `/timeline` | Domain filter chips, entries grouped by month |
| Goals | `/goals` | All goals with status tag and progress bar |
| Profile | `/profile` | IEP status fields, team list grouped by role, "+ Invite" action |
| Domain detail | `/domain/:id` | Overall level, per-skill progress, goals in this domain, history, "Log an update" button |
| Add Entry | `/add` | Domain/skill/source/level/date/note/attachment form → inserts `timeline_entries` row, uploads attachment to Storage |
| Share/Invite | `/share` | Name/title/email/role/scope form → inserts `team_members` row, sends Supabase invite email to `invited_email` |

Bottom tab bar (Home/Timeline/Goals/Profile) and floating "+" add button are shown on all
top-level screens, hidden on Domain Detail / Add / Share, matching the prototype's
`showTabsFinal`/`showFabFinal` logic.

## Auth Flow

- Unauthenticated visitors land on a sign-in screen (styled to match Modernist) that
  asks for an email and sends a Supabase magic link.
- Clicking the link signs them in; if their email matches a `team_members.invited_email`
  with no `user_id` yet, that row is claimed (linked to their new `user_id`) on first
  sign-in.
- No separate "invite acceptance" UI needed — arriving via the magic link *is* acceptance.

## Error Handling

- Form validation is inline and matches the prototype's disabled-until-valid pattern
  (e.g. Save Update disabled until note is non-empty).
- Network/save failures show an inline error banner within the form/screen rather than a
  toast library — keeps dependencies minimal and matches the prototype's lack of a toast
  system.
- Attachment upload failures block save with a specific inline message (distinct from a
  general save failure) since the attachment is a separate Storage call.

## Testing

- Vitest unit tests for pure data-shaping logic: `percentToLevel`, goal status bucketing,
  domain percent averaging, timeline month-grouping/filtering.
- Manual in-browser verification of each screen's golden path and key edge cases
  (empty timeline, empty team, goal at each status threshold) since this is UI-heavy and
  most of its value is visual/interactive fidelity to the mockup.

## Deployment

- Vercel project linked to this repo, Vite build preset, auto-deploy on push to `main`.
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` set as Vercel env vars (and in a local
  `.env.local`, gitignored) — values supplied by the user during implementation setup.
