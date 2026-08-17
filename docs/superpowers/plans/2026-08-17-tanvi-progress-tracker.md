# Tanvi's Progress Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a React web app that recreates all 7 screens of the "Tanvi's Progress Tracker" mockup, backed by a real Supabase database with multi-user auth and sharing.

**Architecture:** Vite + React + TypeScript SPA, React Router for screen navigation, Supabase (Postgres + Auth + Storage) as the backend via `@supabase/supabase-js`. Visual design ported verbatim from the prototype's "Modernist" CSS design system. Deployed to Vercel.

**Tech Stack:** React 18, TypeScript, Vite, react-router-dom v6, @supabase/supabase-js, lucide-react, Vitest.

**Reference spec:** `docs/superpowers/specs/2026-08-17-tanvi-progress-tracker-design.md`
**Reference prototype:** `extracted/tanvi-s-progress-tracker/project/Tanvi Progress Tracker.dc.html` and `extracted/tanvi-s-progress-tracker/project/_ds/modernist-8a8aa2e9-eeec-4f42-abc1-9bc63899be71/styles.css`

---

## File Structure

```
package.json, tsconfig.json, tsconfig.node.json, vite.config.ts, index.html
.env.local.example              -- template for Supabase credentials (real .env.local is gitignored)
supabase/migrations/0001_init.sql

src/
  main.tsx                      -- app entry
  App.tsx                       -- router + top-level layout
  vite-env.d.ts
  supabaseClient.ts

  styles/
    tokens.css                  -- ported Modernist design tokens + component classes (verbatim from prototype)
    app.css                     -- app-shell/header/tab-bar/fab layout not covered by tokens.css

  lib/
    types.ts                    -- shared TS types
    levels.ts                   -- percentToLevel, goalStatus, average (pure, TDD)
    dates.ts                    -- fmtDateShort, fmtMonthYear, monthsElapsed, groupByMonth (pure, TDD)
    levels.test.ts
    dates.test.ts

  data/
    domains.ts                  -- fetch domains+skills+latest assessments, compute percents
    goals.ts                    -- fetch goals, decorate with status
    timeline.ts                 -- fetch/insert timeline entries, attachment upload
    team.ts                     -- fetch/insert/delete team_members

  auth/
    AuthContext.tsx             -- session state + magic-link sign-in
    SignIn.tsx                  -- email entry screen
    RequireAuth.tsx             -- route guard

  components/
    ProgressBar.tsx
    Tag.tsx
    TabBar.tsx
    Fab.tsx
    Header.tsx                  -- shared top bar (title + back/close/actions)

  screens/
    Home.tsx
    Timeline.tsx
    Goals.tsx
    Profile.tsx
    DomainDetail.tsx
    AddEntry.tsx
    ShareInvite.tsx
```

---

## Task 1: Scaffold the Vite + React + TypeScript project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/vite-env.d.ts`
- Create: `src/App.tsx`
- Create: `.env.local.example`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "tanvi-progress-tracker",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "lucide-react": "^0.400.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Tanvi's Progress Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 7: Create `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/tokens.css';
import './styles/app.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 8: Create placeholder `src/App.tsx`**

```tsx
export default function App() {
  return <div>Tanvi's Progress Tracker</div>;
}
```

- [ ] **Step 9: Create `.env.local.example`**

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 10: Install dependencies**

Run: `npm install`
Expected: installs without errors, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 11: Verify dev server starts**

Run: `npm run dev` (then stop it with Ctrl+C once you see the local URL)
Expected: output includes `Local: http://localhost:5173/` with no errors.

- [ ] **Step 12: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts index.html .env.local.example src/main.tsx src/vite-env.d.ts src/App.tsx
git commit -m "Scaffold Vite + React + TypeScript project"
```

---

## Task 2: Port the Modernist design system

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/app.css`

- [ ] **Step 1: Copy the design tokens verbatim**

Copy the full contents of
`extracted/tanvi-s-progress-tracker/project/_ds/modernist-8a8aa2e9-eeec-4f42-abc1-9bc63899be71/styles.css`
into `src/styles/tokens.css` unchanged. This is the source-of-truth CSS for colors, spacing,
typography, and the `.card`/`.tag`/`.btn`/`.input`/`.field`/`.seg`/`.seg-opt` component
classes used throughout every screen.

- [ ] **Step 2: Create `src/styles/app.css` for app-specific layout**

The prototype's device-frame chrome (status bar, bezel) is a design-preview artifact and is
**not** part of the app — skip it. This file adds only the layout pieces the real app needs
that aren't already in `tokens.css`: the mobile-width shell, tab bar, and floating action
button.

```css
.app-shell {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  position: relative;
}

.screen {
  flex: 1;
  overflow: auto;
  padding-bottom: 96px;
}

.screen-no-tabs {
  flex: 1;
  overflow: auto;
}

.header-bar {
  padding: 20px 20px 16px;
  border-bottom: 2px solid var(--color-divider);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-divider);
  cursor: pointer;
  background: none;
  padding: 0;
}

.icon-btn-plain {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}

.progress-track {
  height: 6px;
  background: var(--color-neutral-200);
  width: 100%;
}

.progress-track.thin {
  height: 5px;
}

.progress-fill {
  height: 100%;
  background: var(--color-accent);
}

.tab-bar {
  display: flex;
  border-top: 2px solid var(--color-divider);
  background: var(--color-bg);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 0 12px;
  cursor: pointer;
  position: relative;
  background: none;
  border: none;
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 10px;
}

.tab-item-indicator {
  position: absolute;
  top: 0;
  width: 28px;
  height: 3px;
}

.fab {
  position: absolute;
  right: 20px;
  bottom: 80px;
  width: 56px;
  height: 56px;
  background: var(--color-accent);
  color: var(--color-bg);
  border: none;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.entry-row {
  padding: 12px 20px;
  border-bottom: 2px solid var(--color-neutral-200);
  cursor: pointer;
}

.chip-row {
  display: flex;
  gap: 8px;
  padding: 14px 20px;
  overflow: auto;
}

.segmented-3 {
  display: flex;
  border: 1px solid var(--color-divider);
}

.segmented-opt {
  flex: 1;
  padding: 10px 6px;
  text-align: center;
  font-size: 12px;
  font-family: var(--font-heading);
  font-weight: 800;
  cursor: pointer;
  border: none;
  border-right: 1px solid var(--color-divider);
}

.segmented-opt:last-child {
  border-right: none;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens.css src/styles/app.css
git commit -m "Port Modernist design system tokens and app layout styles"
```

---

## Task 3: Shared TypeScript types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Create `src/lib/types.ts`**

```ts
export type Level = 'Emerging' | 'Developing' | 'Secure' | 'Independent';
export type Source = 'parent' | 'teacher' | 'assessment';
export type TeamRole = 'family' | 'school_staff' | 'service_provider';
export type TeamScope = 'full' | 'academic_only';
export type GoalStatus = 'On Track' | 'In Progress' | 'Needs Support';

export interface Profile {
  id: string;
  name: string;
  gradeLabel: string;
  iepStatus: string;
  lastReevaluationDate: string;
  nextAnnualReviewDate: string;
}

export interface Skill {
  id: string;
  domainId: string;
  name: string;
  sortOrder: number;
  percent: number;
  lastAssessedAt: string;
}

export interface Domain {
  id: string;
  profileId: string;
  name: string;
  icon: string;
  sortOrder: number;
  skills: Skill[];
}

export interface Goal {
  id: string;
  profileId: string;
  domainId: string;
  title: string;
  baseline: string;
  target: string;
  percent: number;
}

export interface TimelineEntry {
  id: string;
  profileId: string;
  domainId: string;
  authorId: string | null;
  source: Source;
  level: Level;
  note: string;
  attachmentUrl: string | null;
  occurredAt: string;
}

export interface TeamMember {
  id: string;
  profileId: string;
  userId: string | null;
  name: string;
  title: string;
  role: TeamRole;
  scope: TeamScope;
  invitedEmail: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "Add shared TypeScript types"
```

---

## Task 4: Pure logic — level/status thresholds (TDD)

**Files:**
- Create: `src/lib/levels.ts`
- Test: `src/lib/levels.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/levels.test.ts
import { describe, it, expect } from 'vitest';
import { percentToLevel, goalStatus, average } from './levels';

describe('percentToLevel', () => {
  it('returns Emerging below 31', () => {
    expect(percentToLevel(0)).toBe('Emerging');
    expect(percentToLevel(30)).toBe('Emerging');
  });
  it('returns Developing from 31 to 60', () => {
    expect(percentToLevel(31)).toBe('Developing');
    expect(percentToLevel(60)).toBe('Developing');
  });
  it('returns Secure from 61 to 85', () => {
    expect(percentToLevel(61)).toBe('Secure');
    expect(percentToLevel(85)).toBe('Secure');
  });
  it('returns Independent at 86 and above', () => {
    expect(percentToLevel(86)).toBe('Independent');
    expect(percentToLevel(100)).toBe('Independent');
  });
});

describe('goalStatus', () => {
  it('returns Needs Support below 35', () => {
    expect(goalStatus(0)).toBe('Needs Support');
    expect(goalStatus(34)).toBe('Needs Support');
  });
  it('returns In Progress from 35 to 69', () => {
    expect(goalStatus(35)).toBe('In Progress');
    expect(goalStatus(69)).toBe('In Progress');
  });
  it('returns On Track at 70 and above', () => {
    expect(goalStatus(70)).toBe('On Track');
    expect(goalStatus(100)).toBe('On Track');
  });
});

describe('average', () => {
  it('rounds to the nearest integer', () => {
    expect(average([55, 35, 60, 50])).toBe(50);
  });
  it('returns 0 for an empty array', () => {
    expect(average([])).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './levels'` (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/levels.ts
import type { Level, GoalStatus } from './types';

export function percentToLevel(percent: number): Level {
  if (percent >= 86) return 'Independent';
  if (percent >= 61) return 'Secure';
  if (percent >= 31) return 'Developing';
  return 'Emerging';
}

export function goalStatus(percent: number): GoalStatus {
  if (percent >= 70) return 'On Track';
  if (percent < 35) return 'Needs Support';
  return 'In Progress';
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all 9 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/levels.ts src/lib/levels.test.ts
git commit -m "Add level/status threshold logic with tests"
```

---

## Task 5: Pure logic — date formatting and grouping (TDD)

**Files:**
- Create: `src/lib/dates.ts`
- Test: `src/lib/dates.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/dates.test.ts
import { describe, it, expect } from 'vitest';
import { fmtDateShort, fmtMonthYear, monthsElapsed, groupByMonth } from './dates';

describe('fmtDateShort', () => {
  it('formats an ISO date as "Mon D"', () => {
    expect(fmtDateShort('2026-08-03')).toBe('Aug 3');
  });
});

describe('fmtMonthYear', () => {
  it('formats an ISO date as "Month YYYY"', () => {
    expect(fmtMonthYear('2026-07-28')).toBe('July 2026');
  });
});

describe('monthsElapsed', () => {
  it('counts from August 1 as month 1', () => {
    expect(monthsElapsed(new Date(2026, 7, 1))).toBe(1);
  });
  it('counts October as month 3', () => {
    expect(monthsElapsed(new Date(2026, 9, 15))).toBe(3);
  });
  it('clamps to 11 in June of the following year', () => {
    expect(monthsElapsed(new Date(2027, 5, 15))).toBe(11);
  });
  it('rolls over to a new school year in July', () => {
    expect(monthsElapsed(new Date(2027, 6, 1))).toBe(11);
  });
});

describe('groupByMonth', () => {
  it('groups items by their formatted month, preserving order', () => {
    const items = [
      { date: '2026-08-03' },
      { date: '2026-07-28' },
      { date: '2026-07-15' },
    ];
    const groups = groupByMonth(items, (i) => i.date);
    expect(groups.map((g) => g.month)).toEqual(['August 2026', 'July 2026']);
    expect(groups[1].items).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './dates'`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/dates.ts
export function fmtDateShort(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function fmtMonthYear(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

const SCHOOL_YEAR_START_MONTH = 7; // August (0-indexed)

export function monthsElapsed(now: Date): number {
  const y = now.getMonth() >= SCHOOL_YEAR_START_MONTH ? now.getFullYear() : now.getFullYear() - 1;
  const start = new Date(y, SCHOOL_YEAR_START_MONTH, 1);
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
  if (months < 1) months = 1;
  if (months > 11) months = 11;
  return months;
}

export function groupByMonth<T>(
  items: T[],
  getDate: (item: T) => string
): { month: string; items: T[] }[] {
  const groups: { month: string; items: T[] }[] = [];
  for (const item of items) {
    const m = fmtMonthYear(getDate(item));
    let g = groups.find((x) => x.month === m);
    if (!g) {
      g = { month: m, items: [] };
      groups.push(g);
    }
    g.items.push(item);
  }
  return groups;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/dates.ts src/lib/dates.test.ts
git commit -m "Add date formatting/grouping logic with tests"
```

---

## Task 6: Supabase project setup and database schema

**Files:**
- Create: `supabase/migrations/0001_init.sql`

This task requires manual steps in the Supabase dashboard for the project mentioned during
planning, since no Supabase CLI is installed locally.

- [ ] **Step 1: Get project credentials**

In the Supabase dashboard for the target project: Project Settings → API. Copy the
**Project URL** and **anon public key**.

- [ ] **Step 2: Create local env file**

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and paste in the real `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
values. This file is gitignored and must never be committed.

- [ ] **Step 3: Enable pgcrypto for UUID generation**

In the Supabase SQL Editor, run:

```sql
create extension if not exists pgcrypto;
```

- [ ] **Step 4: Write the schema + seed migration**

Create `supabase/migrations/0001_init.sql`. This seeds one profile ("Tanvi") with the same
domains/skills/goals/timeline data as the prototype's mock data, and adds the signed-in
user's own email (`rakeshritta@gmail.com`) as the first team member so they have access
immediately on first sign-in — the prototype's other mock people (Priya Rao, Ms. Alvarez,
etc.) are **not** seeded since they aren't real invitees; real team members get added
through the Share/Invite screen once it's built.

```sql
-- 0001_init.sql

create table profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade_label text not null,
  iep_status text not null default 'Active',
  last_reevaluation_date date,
  next_annual_review_date date,
  created_at timestamptz not null default now()
);

create table domains (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  icon text not null,
  sort_order int not null default 0
);

create table skills (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references domains(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

create table skill_assessments (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references skills(id) on delete cascade,
  percent int not null check (percent >= 0 and percent <= 100),
  assessed_at date not null,
  created_at timestamptz not null default now()
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  domain_id uuid not null references domains(id) on delete cascade,
  title text not null,
  baseline text not null,
  target text not null,
  percent int not null check (percent >= 0 and percent <= 100)
);

create table timeline_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  domain_id uuid not null references domains(id) on delete cascade,
  author_id uuid references auth.users(id),
  source text not null check (source in ('parent','teacher','assessment')),
  level text not null check (level in ('Emerging','Developing','Secure','Independent')),
  note text not null,
  attachment_url text,
  occurred_at date not null,
  created_at timestamptz not null default now()
);

create table team_members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  user_id uuid references auth.users(id),
  name text not null,
  title text not null,
  role text not null check (role in ('family','school_staff','service_provider')),
  scope text not null check (scope in ('full','academic_only')),
  invited_email text not null,
  created_at timestamptz not null default now(),
  unique (profile_id, invited_email)
);

-- Row Level Security
alter table profiles enable row level security;
alter table domains enable row level security;
alter table skills enable row level security;
alter table skill_assessments enable row level security;
alter table goals enable row level security;
alter table timeline_entries enable row level security;
alter table team_members enable row level security;

create or replace function is_team_member(target_profile_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from team_members
    where profile_id = target_profile_id
      and user_id = auth.uid()
  );
$$;

create policy "team can read profile" on profiles
  for select using (is_team_member(id));

create policy "team can read domains" on domains
  for select using (is_team_member(profile_id));

create policy "team can read skills" on skills
  for select using (
    is_team_member((select profile_id from domains where domains.id = skills.domain_id))
  );

create policy "team can read assessments" on skill_assessments
  for select using (
    is_team_member((
      select domains.profile_id from domains
      join skills on skills.domain_id = domains.id
      where skills.id = skill_assessments.skill_id
    ))
  );
create policy "team can insert assessments" on skill_assessments
  for insert with check (
    is_team_member((
      select domains.profile_id from domains
      join skills on skills.domain_id = domains.id
      where skills.id = skill_assessments.skill_id
    ))
  );

create policy "team can read goals" on goals
  for select using (is_team_member(profile_id));

create policy "team can read timeline" on timeline_entries
  for select using (is_team_member(profile_id));
create policy "team can insert timeline" on timeline_entries
  for insert with check (is_team_member(profile_id));

create policy "team can read team_members" on team_members
  for select using (is_team_member(profile_id));
create policy "team can insert team_members" on team_members
  for insert with check (is_team_member(profile_id));
create policy "team can delete team_members" on team_members
  for delete using (is_team_member(profile_id));

-- Claim an invited team_members row for a user on their first sign-in
create or replace function claim_team_membership()
returns trigger
language plpgsql
security definer
as $$
begin
  update team_members
  set user_id = new.id
  where invited_email = new.email and user_id is null;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function claim_team_membership();

-- Seed: Tanvi's profile
insert into profiles (id, name, grade_label, iep_status, last_reevaluation_date, next_annual_review_date)
values ('a0000000-0000-0000-0000-000000000000', 'Tanvi', '5th Grade (Year 2)', 'Active', '2026-07-28', '2027-05-01');

-- Seed: domains
insert into domains (id, profile_id, name, icon, sort_order) values
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000000', 'Academic Skills', 'book-open', 1),
  ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000000', 'Executive Function', 'brain', 2),
  ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000000', 'Independence & Safety', 'shield', 3);

-- Seed: skills
insert into skills (id, domain_id, name, sort_order) values
  ('a0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'Reading', 1),
  ('a0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'Writing', 2),
  ('a0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'Math', 3),
  ('a0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'Comprehension', 4),
  ('a0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002', 'Organization', 1),
  ('a0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000002', 'Task Initiation', 2),
  ('a0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000002', 'Self-Regulation', 3),
  ('a0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000002', 'Following Directions', 4),
  ('a0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000003', 'Community Navigation', 1),
  ('a0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000003', 'Physical Safety Awareness', 2),
  ('a0000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000003', 'Emotional Understanding', 3),
  ('a0000000-0000-0000-0000-000000000034', 'a0000000-0000-0000-0000-000000000003', 'Self-Advocacy', 4);

-- Seed: latest skill assessments
insert into skill_assessments (skill_id, percent, assessed_at) values
  ('a0000000-0000-0000-0000-000000000011', 55, '2026-07-28'),
  ('a0000000-0000-0000-0000-000000000012', 35, '2026-06-10'),
  ('a0000000-0000-0000-0000-000000000013', 60, '2026-07-28'),
  ('a0000000-0000-0000-0000-000000000014', 50, '2026-07-28'),
  ('a0000000-0000-0000-0000-000000000021', 45, '2026-07-15'),
  ('a0000000-0000-0000-0000-000000000022', 50, '2026-07-15'),
  ('a0000000-0000-0000-0000-000000000023', 65, '2026-05-22'),
  ('a0000000-0000-0000-0000-000000000024', 70, '2026-05-22'),
  ('a0000000-0000-0000-0000-000000000031', 40, '2026-08-03'),
  ('a0000000-0000-0000-0000-000000000032', 55, '2026-08-03'),
  ('a0000000-0000-0000-0000-000000000033', 40, '2026-06-20'),
  ('a0000000-0000-0000-0000-000000000034', 30, '2026-06-20');

-- Seed: goals
insert into goals (id, profile_id, domain_id, title, baseline, target, percent) values
  ('a0000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000001', 'Read grade-level passages and answer comprehension questions with 80% accuracy', '30% accuracy', '80% accuracy', 60),
  ('a0000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000001', 'Write a complete 3-sentence paragraph independently', '1 sentence w/ support', '3 sentences, independent', 35),
  ('a0000000-0000-0000-0000-000000000103', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'Complete a 3-step task using a visual checklist without prompting', 'Needs full prompting', 'Independent w/ checklist', 55),
  ('a0000000-0000-0000-0000-000000000104', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'Transition between activities within 2 minutes of a verbal cue', '5+ minute transitions', 'Within 2 minutes', 80),
  ('a0000000-0000-0000-0000-000000000105', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000003', 'Identify safe vs. unsafe situations in familiar community settings', 'Identifies with prompting', 'Identifies independently', 50),
  ('a0000000-0000-0000-0000-000000000106', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000003', 'Name and communicate feelings using a feelings chart', 'Shuts down without naming feeling', 'Names feeling using chart', 40);

-- Seed: timeline entries
insert into timeline_entries (id, profile_id, domain_id, source, level, note, attachment_url, occurred_at) values
  ('a0000000-0000-0000-0000-000000000201', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000003', 'teacher', 'Developing', 'Practiced crossing signals with the school safety patrol during orientation walk-through.', null, '2026-08-03'),
  ('a0000000-0000-0000-0000-000000000202', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000001', 'assessment', 'Developing', 'Annual IEP re-evaluation: reading comprehension at approx. 2nd grade level, up from 1.5 grade level last year.', 'IEP-reevaluation-2026.pdf', '2026-07-28'),
  ('a0000000-0000-0000-0000-000000000203', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'parent', 'Developing', 'Followed a 3-item morning checklist independently for the first time this summer.', null, '2026-07-15'),
  ('a0000000-0000-0000-0000-000000000204', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000003', 'parent', 'Emerging', 'Used her feelings chart to say she was frustrated instead of shutting down.', null, '2026-06-20'),
  ('a0000000-0000-0000-0000-000000000205', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000001', 'teacher', 'Emerging', 'End-of-year writing sample: wrote 2 complete sentences with support.', null, '2026-06-10'),
  ('a0000000-0000-0000-0000-000000000206', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'teacher', 'Secure', 'Transitioned between 4 activities during the school day with only verbal reminders.', null, '2026-05-22');

-- Seed: the signed-in user as the first family team member
insert into team_members (profile_id, name, title, role, scope, invited_email) values
  ('a0000000-0000-0000-0000-000000000000', 'Rakesh', 'Parent', 'family', 'full', 'rakeshritta@gmail.com');
```

- [ ] **Step 5: Run the migration**

Paste the full contents of `supabase/migrations/0001_init.sql` into the Supabase SQL
Editor and run it.
Expected: "Success. No rows returned" and the new tables visible under Table Editor.

- [ ] **Step 6: Enable magic-link auth**

In the Supabase dashboard: Authentication → Providers → Email. Confirm "Enable Email
provider" is on and "Confirm email" / magic link sign-in is enabled (default). Under
Authentication → URL Configuration, set the Site URL to `http://localhost:5173` for now
(this gets updated to the production URL in the deploy task).

- [ ] **Step 7: Create a Storage bucket for attachments**

In the Supabase dashboard: Storage → Create bucket, name it `attachments`, set it to
**private** (not public). Add a storage policy allowing authenticated users to upload and
read: Storage → Policies → New Policy on `attachments` → allow `select` and `insert` for
`authenticated` role.

- [ ] **Step 8: Commit the migration file**

```bash
git add supabase/migrations/0001_init.sql
git commit -m "Add database schema, RLS policies, and seed data"
```

---

## Task 7: Supabase client

**Files:**
- Create: `src/supabaseClient.ts`

- [ ] **Step 1: Create `src/supabaseClient.ts`**

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 2: Commit**

```bash
git add src/supabaseClient.ts
git commit -m "Add Supabase client"
```

---

## Task 8: Auth — magic link sign-in, session context, route guard

**Files:**
- Create: `src/auth/AuthContext.tsx`
- Create: `src/auth/SignIn.tsx`
- Create: `src/auth/RequireAuth.tsx`

- [ ] **Step 1: Create `src/auth/AuthContext.tsx`**

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface AuthState {
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
```

- [ ] **Step 2: Create `src/auth/SignIn.tsx`**

```tsx
import { useState, type FormEvent } from 'react';
import { supabase } from '../supabaseClient';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setErrorMessage(error.message);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  }

  return (
    <div className="app-shell" style={{ justifyContent: 'center', padding: 20 }}>
      <h3 style={{ marginBottom: 4 }}>Tanvi's Progress Tracker</h3>
      <p className="text-muted" style={{ marginBottom: 20 }}>
        Sign in with your email to view Tanvi's progress.
      </p>
      {status === 'sent' ? (
        <p>Check your email for a sign-in link.</p>
      ) : (
        <form onSubmit={handleSubmit} className="field" style={{ gap: 12, display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            required
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn btn-primary btn-block" type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending link…' : 'Send sign-in link'}
          </button>
          {status === 'error' && (
            <p style={{ color: 'var(--color-accent-700)', fontSize: 13 }}>{errorMessage}</p>
          )}
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/auth/RequireAuth.tsx`**

```tsx
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import SignIn from './SignIn';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (!session) return <SignIn />;
  return <>{children}</>;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/auth/AuthContext.tsx src/auth/SignIn.tsx src/auth/RequireAuth.tsx
git commit -m "Add magic-link auth context, sign-in screen, and route guard"
```

---

## Task 9: Data layer — domains, skills, and percent calculation

**Files:**
- Create: `src/data/domains.ts`

- [ ] **Step 1: Create `src/data/domains.ts`**

```ts
import { supabase } from '../supabaseClient';
import { average } from '../lib/levels';
import type { Domain } from '../lib/types';

interface SkillRow {
  id: string;
  domain_id: string;
  name: string;
  sort_order: number;
  skill_assessments: { percent: number; assessed_at: string }[];
}

interface DomainRow {
  id: string;
  profile_id: string;
  name: string;
  icon: string;
  sort_order: number;
  skills: SkillRow[];
}

function latestAssessment(rows: { percent: number; assessed_at: string }[]) {
  return rows.reduce((a, b) => (a.assessed_at > b.assessed_at ? a : b));
}

export async function fetchDomains(profileId: string): Promise<Domain[]> {
  const { data, error } = await supabase
    .from('domains')
    .select('id, profile_id, name, icon, sort_order, skills(id, domain_id, name, sort_order, skill_assessments(percent, assessed_at))')
    .eq('profile_id', profileId)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data as unknown as DomainRow[]).map((d) => ({
    id: d.id,
    profileId: d.profile_id,
    name: d.name,
    icon: d.icon,
    sortOrder: d.sort_order,
    skills: [...d.skills]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => {
        const latest = latestAssessment(s.skill_assessments);
        return {
          id: s.id,
          domainId: s.domain_id,
          name: s.name,
          sortOrder: s.sort_order,
          percent: latest.percent,
          lastAssessedAt: latest.assessed_at,
        };
      }),
  }));
}

export function domainPercent(domain: Domain): number {
  return average(domain.skills.map((s) => s.percent));
}

export function domainLastAssessedAt(domain: Domain): string {
  return domain.skills.reduce((a, b) => (a.lastAssessedAt > b.lastAssessedAt ? a : b)).lastAssessedAt;
}

export async function addSkillAssessment(skillId: string, percent: number, assessedAt: string) {
  const { error } = await supabase
    .from('skill_assessments')
    .insert({ skill_id: skillId, percent, assessed_at: assessedAt });
  if (error) throw error;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/domains.ts
git commit -m "Add domains data layer with percent calculation"
```

---

## Task 10: Data layer — goals

**Files:**
- Create: `src/data/goals.ts`

- [ ] **Step 1: Create `src/data/goals.ts`**

```ts
import { supabase } from '../supabaseClient';
import type { Goal } from '../lib/types';

interface GoalRow {
  id: string;
  profile_id: string;
  domain_id: string;
  title: string;
  baseline: string;
  target: string;
  percent: number;
}

export async function fetchGoals(profileId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('id, profile_id, domain_id, title, baseline, target, percent')
    .eq('profile_id', profileId);

  if (error) throw error;

  return (data as GoalRow[]).map((g) => ({
    id: g.id,
    profileId: g.profile_id,
    domainId: g.domain_id,
    title: g.title,
    baseline: g.baseline,
    target: g.target,
    percent: g.percent,
  }));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/goals.ts
git commit -m "Add goals data layer"
```

---

## Task 11: Data layer — timeline entries and attachment upload

**Files:**
- Create: `src/data/timeline.ts`

- [ ] **Step 1: Create `src/data/timeline.ts`**

```ts
import { supabase } from '../supabaseClient';
import type { Level, Source, TimelineEntry } from '../lib/types';

interface TimelineRow {
  id: string;
  profile_id: string;
  domain_id: string;
  author_id: string | null;
  source: Source;
  level: Level;
  note: string;
  attachment_url: string | null;
  occurred_at: string;
}

function toTimelineEntry(row: TimelineRow): TimelineEntry {
  return {
    id: row.id,
    profileId: row.profile_id,
    domainId: row.domain_id,
    authorId: row.author_id,
    source: row.source,
    level: row.level,
    note: row.note,
    attachmentUrl: row.attachment_url,
    occurredAt: row.occurred_at,
  };
}

export async function fetchTimeline(profileId: string): Promise<TimelineEntry[]> {
  const { data, error } = await supabase
    .from('timeline_entries')
    .select('id, profile_id, domain_id, author_id, source, level, note, attachment_url, occurred_at')
    .eq('profile_id', profileId)
    .order('occurred_at', { ascending: false });

  if (error) throw error;
  return (data as TimelineRow[]).map(toTimelineEntry);
}

export interface NewTimelineEntry {
  profileId: string;
  domainId: string;
  source: Source;
  level: Level;
  note: string;
  occurredAt: string;
  attachmentFile: File | null;
}

export async function uploadAttachment(profileId: string, file: File): Promise<string> {
  const path = `${profileId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from('attachments').upload(path, file);
  if (error) throw error;
  return path;
}

export async function createTimelineEntry(entry: NewTimelineEntry): Promise<TimelineEntry> {
  let attachmentUrl: string | null = null;
  if (entry.attachmentFile) {
    attachmentUrl = await uploadAttachment(entry.profileId, entry.attachmentFile);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('timeline_entries')
    .insert({
      profile_id: entry.profileId,
      domain_id: entry.domainId,
      author_id: user?.id ?? null,
      source: entry.source,
      level: entry.level,
      note: entry.note,
      attachment_url: attachmentUrl,
      occurred_at: entry.occurredAt,
    })
    .select('id, profile_id, domain_id, author_id, source, level, note, attachment_url, occurred_at')
    .single();

  if (error) throw error;
  return toTimelineEntry(data as TimelineRow);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/timeline.ts
git commit -m "Add timeline data layer with attachment upload"
```

---

## Task 12: Data layer — team members

**Files:**
- Create: `src/data/team.ts`

- [ ] **Step 1: Create `src/data/team.ts`**

```ts
import { supabase } from '../supabaseClient';
import type { TeamMember, TeamRole, TeamScope } from '../lib/types';

interface TeamRow {
  id: string;
  profile_id: string;
  user_id: string | null;
  name: string;
  title: string;
  role: TeamRole;
  scope: TeamScope;
  invited_email: string;
}

function toTeamMember(row: TeamRow): TeamMember {
  return {
    id: row.id,
    profileId: row.profile_id,
    userId: row.user_id,
    name: row.name,
    title: row.title,
    role: row.role,
    scope: row.scope,
    invitedEmail: row.invited_email,
  };
}

export async function fetchTeam(profileId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('id, profile_id, user_id, name, title, role, scope, invited_email')
    .eq('profile_id', profileId);

  if (error) throw error;
  return (data as TeamRow[]).map(toTeamMember);
}

export interface NewTeamMember {
  profileId: string;
  name: string;
  title: string;
  email: string;
  role: TeamRole;
  scope: TeamScope;
}

export async function inviteTeamMember(input: NewTeamMember): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      profile_id: input.profileId,
      name: input.name,
      title: input.title,
      role: input.role,
      scope: input.scope,
      invited_email: input.email,
    })
    .select('id, profile_id, user_id, name, title, role, scope, invited_email')
    .single();

  if (error) throw error;

  const { error: inviteError } = await supabase.auth.signInWithOtp({
    email: input.email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (inviteError) throw inviteError;

  return toTeamMember(data as TeamRow);
}

export async function removeTeamMember(id: string): Promise<void> {
  const { error } = await supabase.from('team_members').delete().eq('id', id);
  if (error) throw error;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/team.ts
git commit -m "Add team members data layer"
```

---

## Task 13: Reusable UI components

**Files:**
- Create: `src/components/ProgressBar.tsx`
- Create: `src/components/Tag.tsx`
- Create: `src/components/TabBar.tsx`
- Create: `src/components/Fab.tsx`

- [ ] **Step 1: Create `src/components/ProgressBar.tsx`**

```tsx
export default function ProgressBar({ percent, thin = false }: { percent: number; thin?: boolean }) {
  return (
    <div className={`progress-track${thin ? ' thin' : ''}`}>
      <div className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/Tag.tsx`**

```tsx
import type { ReactNode } from 'react';

type TagVariant = 'accent' | 'accent-2' | 'neutral' | 'outline';

export default function Tag({ children, variant = 'neutral' }: { children: ReactNode; variant?: TagVariant }) {
  return <span className={`tag tag-${variant}`}>{children}</span>;
}
```

- [ ] **Step 3: Create `src/components/TabBar.tsx`**

```tsx
import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, Target, User } from 'lucide-react';

const TABS = [
  { to: '/', label: 'Home', Icon: Home, end: true },
  { to: '/timeline', label: 'Timeline', Icon: CalendarDays, end: false },
  { to: '/goals', label: 'Goals', Icon: Target, end: false },
  { to: '/profile', label: 'Profile', Icon: User, end: false },
];

export default function TabBar() {
  return (
    <div className="tab-bar">
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="tab-item"
          style={({ isActive }) => ({
            color: isActive ? 'var(--color-accent-700)' : 'color-mix(in srgb, var(--color-text) 55%, transparent)',
          })}
        >
          {({ isActive }) => (
            <>
              <span
                className="tab-item-indicator"
                style={{ background: isActive ? 'var(--color-accent)' : 'transparent' }}
              />
              <Icon width={20} height={20} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/Fab.tsx`**

```tsx
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Fab() {
  const navigate = useNavigate();
  return (
    <button className="fab" onClick={() => navigate('/add')} aria-label="Log an update">
      <Plus width={24} height={24} />
    </button>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ProgressBar.tsx src/components/Tag.tsx src/components/TabBar.tsx src/components/Fab.tsx
git commit -m "Add reusable ProgressBar, Tag, TabBar, and Fab components"
```

---

## Task 14: App shell and routing

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace `src/App.tsx` with the full router**

```tsx
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import RequireAuth from './auth/RequireAuth';
import TabBar from './components/TabBar';
import Fab from './components/Fab';
import Home from './screens/Home';
import Timeline from './screens/Timeline';
import Goals from './screens/Goals';
import Profile from './screens/Profile';
import DomainDetail from './screens/DomainDetail';
import AddEntry from './screens/AddEntry';
import ShareInvite from './screens/ShareInvite';

// Fixed seed profile id from supabase/migrations/0001_init.sql.
// Revisit if the app grows to support multiple children.
export const PROFILE_ID = 'a0000000-0000-0000-0000-000000000000';

function TabbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      {children}
      <Fab />
      <TabBar />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RequireAuth>
        <Routes>
          <Route path="/" element={<TabbedLayout><Home /></TabbedLayout>} />
          <Route path="/timeline" element={<TabbedLayout><Timeline /></TabbedLayout>} />
          <Route path="/goals" element={<TabbedLayout><Goals /></TabbedLayout>} />
          <Route path="/profile" element={<TabbedLayout><Profile /></TabbedLayout>} />
          <Route path="/domain/:domainId" element={<div className="app-shell"><DomainDetail /></div>} />
          <Route path="/add" element={<div className="app-shell"><AddEntry /></div>} />
          <Route path="/share" element={<div className="app-shell"><ShareInvite /></div>} />
        </Routes>
      </RequireAuth>
    </AuthProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "Add app shell and routing"
```

(This won't build yet — the `screens/` files it imports are created in the next tasks.)

---

## Task 15: Home screen

**Files:**
- Create: `src/screens/Home.tsx`

- [ ] **Step 1: Create `src/screens/Home.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, User as UserIcon, ChevronRight, BookOpen, Brain, Shield, MessageSquare, ClipboardCheck, Paperclip } from 'lucide-react';
import { PROFILE_ID } from '../App';
import { fetchDomains, domainPercent, domainLastAssessedAt } from '../data/domains';
import { fetchGoals } from '../data/goals';
import { fetchTimeline } from '../data/timeline';
import { percentToLevel, goalStatus } from '../lib/levels';
import { fmtDateShort, monthsElapsed } from '../lib/dates';
import ProgressBar from '../components/ProgressBar';
import Tag from '../components/Tag';
import type { Domain, Goal, TimelineEntry } from '../lib/types';

const DOMAIN_ICONS: Record<string, typeof BookOpen> = { 'book-open': BookOpen, brain: Brain, shield: Shield };
const SOURCE_ICONS = { parent: UserIcon, teacher: MessageSquare, assessment: ClipboardCheck };
const SOURCE_LABELS = { parent: 'Parent', teacher: 'Teacher', assessment: 'Assessment' };

export default function Home() {
  const navigate = useNavigate();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDomains(PROFILE_ID), fetchGoals(PROFILE_ID), fetchTimeline(PROFILE_ID)]).then(
      ([d, g, t]) => {
        setDomains(d);
        setGoals(g);
        setTimeline(t);
        setLoading(false);
      }
    );
  }, []);

  if (loading) return <div className="screen" style={{ padding: 20 }}>Loading…</div>;

  const monthsIn = monthsElapsed(new Date());
  const onTrackCount = goals.filter((g) => goalStatus(g.percent) === 'On Track').length;
  const recent = timeline.slice(0, 4);

  return (
    <div className="screen">
      <div className="header-bar">
        <div>
          <h3 style={{ margin: 0, fontSize: 22 }}>Tanvi</h3>
          <div style={{ fontSize: 12, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)', marginTop: 2 }}>
            5th Grade (Year 2) · 2026–27
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="icon-btn" onClick={() => navigate('/share')} aria-label="Share">
            <Share2 width={18} height={18} />
          </button>
          <button className="icon-btn" onClick={() => navigate('/profile')} aria-label="Profile">
            <UserIcon width={20} height={20} />
          </button>
        </div>
      </div>

      <div style={{ padding: '18px 20px 4px' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-accent-700)', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
          Month {monthsIn} of 11
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {Array.from({ length: 11 }, (_, i) => (
            <div key={i} style={{ flex: 1, height: 8, background: i < monthsIn ? 'var(--color-accent)' : 'var(--color-neutral-200)' }} />
          ))}
        </div>
      </div>

      <div style={{ padding: '22px 20px 8px' }}>
        <h6 style={{ margin: '0 0 12px' }}>Progress by Area</h6>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {domains.map((d) => {
            const percent = domainPercent(d);
            const Icon = DOMAIN_ICONS[d.icon] ?? BookOpen;
            return (
              <div key={d.id} className="card elev-sm" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/domain/${d.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="card-kicker" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon width={13} height={13} />
                    {d.name}
                  </div>
                  <ChevronRight width={16} height={16} style={{ opacity: 0.5 }} />
                </div>
                <div className="card-title">{percentToLevel(percent)}</div>
                <p className="card-body">{d.skills.length} skills tracked</p>
                <ProgressBar percent={percent} />
                <div className="card-meta">Last updated {fmtDateShort(domainLastAssessedAt(d))}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '14px 20px 8px' }}>
        <div className="card elev-sm" style={{ cursor: 'pointer' }} onClick={() => navigate('/goals')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="card-kicker">IEP Goals</div>
            <ChevronRight width={16} height={16} style={{ opacity: 0.5 }} />
          </div>
          <div className="card-title">{onTrackCount} of {goals.length} goals on track</div>
          <p className="card-body">2026–27 school year</p>
        </div>
      </div>

      <div style={{ padding: '20px 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h6 style={{ margin: 0 }}>Recent Updates</h6>
        <span
          style={{ fontSize: 12, color: 'var(--color-accent-700)', fontFamily: 'var(--font-heading)', fontWeight: 800, cursor: 'pointer' }}
          onClick={() => navigate('/timeline')}
        >
          See all
        </span>
      </div>
      <div>
        {recent.map((e) => {
          const domain = domains.find((d) => d.id === e.domainId);
          const SourceIcon = SOURCE_ICONS[e.source];
          return (
            <div key={e.id} className="entry-row" onClick={() => navigate(`/domain/${e.domainId}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <Tag variant="accent-2">{domain?.name}</Tag>
                <Tag variant="neutral">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <SourceIcon width={11} height={11} />
                    {SOURCE_LABELS[e.source]}
                  </span>
                </Tag>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.4 }}>{e.note}</div>
              {e.attachmentUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 11, color: 'var(--color-accent-700)' }}>
                  <Paperclip width={11} height={11} />
                  {e.attachmentUrl.split('/').pop()}
                </div>
              )}
              <div style={{ fontSize: 11, color: 'color-mix(in srgb, var(--color-text) 50%, transparent)', marginTop: 4 }}>
                {fmtDateShort(e.occurredAt)} · {e.level}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/Home.tsx
git commit -m "Add Home screen"
```

---

## Task 16: Timeline screen

**Files:**
- Create: `src/screens/Timeline.tsx`

- [ ] **Step 1: Create `src/screens/Timeline.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, MessageSquare, ClipboardCheck, Paperclip } from 'lucide-react';
import { PROFILE_ID } from '../App';
import { fetchDomains } from '../data/domains';
import { fetchTimeline } from '../data/timeline';
import { fmtDateShort, groupByMonth } from '../lib/dates';
import Tag from '../components/Tag';
import type { Domain, TimelineEntry } from '../lib/types';

const SOURCE_ICONS = { parent: UserIcon, teacher: MessageSquare, assessment: ClipboardCheck };
const SOURCE_LABELS = { parent: 'Parent', teacher: 'Teacher', assessment: 'Assessment' };

export default function Timeline() {
  const navigate = useNavigate();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDomains(PROFILE_ID), fetchTimeline(PROFILE_ID)]).then(([d, t]) => {
      setDomains(d);
      setTimeline(t);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="screen" style={{ padding: 20 }}>Loading…</div>;

  const filtered = timeline.filter((e) => filter === 'all' || e.domainId === filter);
  const groups = groupByMonth(filtered, (e) => e.occurredAt);
  const filters = [{ id: 'all', label: 'All' }, ...domains.map((d) => ({ id: d.id, label: d.name }))];

  return (
    <div className="screen">
      <div className="header-bar" style={{ justifyContent: 'flex-start' }}>
        <h3 style={{ margin: 0, fontSize: 20 }}>Timeline</h3>
      </div>
      <div className="chip-row">
        {filters.map((f) => (
          <span
            key={f.id}
            className={`tag ${filter === f.id ? 'tag-accent' : 'tag-outline'}`}
            style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </span>
        ))}
      </div>
      {groups.map((grp) => (
        <div key={grp.month}>
          <div
            style={{
              padding: '16px 20px 6px',
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              color: 'color-mix(in srgb, var(--color-text) 60%, transparent)',
            }}
          >
            {grp.month}
          </div>
          {grp.items.map((e) => {
            const domain = domains.find((d) => d.id === e.domainId);
            const SourceIcon = SOURCE_ICONS[e.source];
            return (
              <div key={e.id} className="entry-row" onClick={() => navigate(`/domain/${e.domainId}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <Tag variant="accent-2">{domain?.name}</Tag>
                  <Tag variant="neutral">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <SourceIcon width={11} height={11} />
                      {SOURCE_LABELS[e.source]}
                    </span>
                  </Tag>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.4 }}>{e.note}</div>
                {e.attachmentUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 11, color: 'var(--color-accent-700)' }}>
                    <Paperclip width={11} height={11} />
                    {e.attachmentUrl.split('/').pop()}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'color-mix(in srgb, var(--color-text) 50%, transparent)', marginTop: 4 }}>
                  {fmtDateShort(e.occurredAt)} · {e.level}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/Timeline.tsx
git commit -m "Add Timeline screen"
```

---

## Task 17: Goals screen

**Files:**
- Create: `src/screens/Goals.tsx`

- [ ] **Step 1: Create `src/screens/Goals.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PROFILE_ID } from '../App';
import { fetchDomains } from '../data/domains';
import { fetchGoals } from '../data/goals';
import { goalStatus } from '../lib/levels';
import ProgressBar from '../components/ProgressBar';
import Tag from '../components/Tag';
import type { Domain, Goal, GoalStatus } from '../lib/types';

const STATUS_VARIANT: Record<GoalStatus, 'neutral' | 'accent' | 'outline'> = {
  'On Track': 'neutral',
  'Needs Support': 'accent',
  'In Progress': 'outline',
};

export default function Goals() {
  const navigate = useNavigate();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDomains(PROFILE_ID), fetchGoals(PROFILE_ID)]).then(([d, g]) => {
      setDomains(d);
      setGoals(g);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="screen" style={{ padding: 20 }}>Loading…</div>;

  const onTrackCount = goals.filter((g) => goalStatus(g.percent) === 'On Track').length;
  const onTrackPercent = goals.length ? Math.round((onTrackCount / goals.length) * 100) : 0;

  return (
    <div className="screen">
      <div className="header-bar" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <h3 style={{ margin: 0, fontSize: 20 }}>IEP Goals</h3>
        <div style={{ fontSize: 12, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)', marginTop: 2 }}>
          2026–27 School Year
        </div>
      </div>
      <div style={{ padding: '16px 20px 4px' }}>
        <div style={{ fontSize: 13, marginBottom: 8 }}>
          {onTrackCount} of {goals.length} goals on track
        </div>
        <ProgressBar percent={onTrackPercent} />
      </div>
      <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {goals.map((g) => {
          const domain = domains.find((d) => d.id === g.domainId);
          const status = goalStatus(g.percent);
          return (
            <div key={g.id} className="card elev-sm" style={{ cursor: 'pointer' }} onClick={() => navigate(`/domain/${g.domainId}`)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span className="card-kicker" style={{ margin: 0 }}>{domain?.name}</span>
                <Tag variant={STATUS_VARIANT[status]}>{status}</Tag>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{g.title}</div>
              <ProgressBar percent={g.percent} />
              <div className="card-meta">{g.baseline} → {g.target}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/Goals.tsx
git commit -m "Add Goals screen"
```

---

## Task 18: Profile screen

**Files:**
- Create: `src/screens/Profile.tsx`

- [ ] **Step 1: Create `src/screens/Profile.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { PROFILE_ID } from '../App';
import { fetchTeam, removeTeamMember } from '../data/team';
import type { TeamMember, TeamRole } from '../lib/types';

const ROLE_LABELS: Record<TeamRole, string> = {
  family: 'Family',
  school_staff: 'School staff',
  service_provider: 'Outside providers',
};

const ROLE_ORDER: TeamRole[] = ['family', 'school_staff', 'service_provider'];

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('');
}

export default function Profile() {
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam(PROFILE_ID).then((t) => {
      setTeam(t);
      setLoading(false);
    });
  }, []);

  async function handleRemove(id: string) {
    await removeTeamMember(id);
    setTeam((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) return <div className="screen" style={{ padding: 20 }}>Loading…</div>;

  return (
    <div className="screen">
      <div className="header-bar" style={{ justifyContent: 'flex-start' }}>
        <h3 style={{ margin: 0, fontSize: 20 }}>Profile</h3>
      </div>
      <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 64, height: 64, background: 'var(--color-accent)', color: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 26, flexShrink: 0 }}>
          T
        </div>
        <div>
          <div style={{ fontSize: 19, fontFamily: 'var(--font-heading)', fontWeight: 800 }}>Tanvi</div>
          <div style={{ fontSize: 13, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)', marginTop: 2 }}>5th Grade (Year 2)</div>
        </div>
      </div>
      <div style={{ borderTop: '2px solid var(--color-divider)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '2px solid var(--color-neutral-200)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>IEP status</span>
          <span style={{ fontSize: 13 }}>Active</span>
        </div>
        <div style={{ padding: '14px 20px', borderBottom: '2px solid var(--color-neutral-200)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>Last re-evaluation</span>
          <span style={{ fontSize: 13 }}>Jul 28, 2026</span>
        </div>
        <div style={{ padding: '14px 20px', borderBottom: '2px solid var(--color-neutral-200)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>Next annual review</span>
          <span style={{ fontSize: 13 }}>May 2027</span>
        </div>
      </div>
      <div style={{ padding: '20px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h6 style={{ margin: 0 }}>Tanvi's Team · {team.length}</h6>
        <span
          style={{ fontSize: 12, color: 'var(--color-accent-700)', fontFamily: 'var(--font-heading)', fontWeight: 800, cursor: 'pointer' }}
          onClick={() => navigate('/share')}
        >
          + Invite
        </span>
      </div>
      {ROLE_ORDER.map((role) => {
        const people = team.filter((p) => p.role === role);
        if (people.length === 0) return null;
        return (
          <div key={role}>
            <div style={{ padding: '12px 20px 6px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>
              {ROLE_LABELS[role]}
            </div>
            {people.map((p) => (
              <div key={p.id} style={{ padding: '12px 20px', borderBottom: '2px solid var(--color-neutral-200)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, flexShrink: 0, background: 'var(--color-neutral-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 12 }}>
                  {initials(p.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', marginTop: 2 }}>
                    {p.title} · {p.scope === 'full' ? 'Full progress' : 'Academic only'}
                  </div>
                </div>
                <X width={16} height={16} style={{ cursor: 'pointer', opacity: 0.6, flexShrink: 0 }} onClick={() => handleRemove(p.id)} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/Profile.tsx
git commit -m "Add Profile screen"
```

---

## Task 19: Domain Detail screen

**Files:**
- Create: `src/screens/DomainDetail.tsx`

- [ ] **Step 1: Create `src/screens/DomainDetail.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, User as UserIcon, MessageSquare, ClipboardCheck, Paperclip, Plus } from 'lucide-react';
import { PROFILE_ID } from '../App';
import { fetchDomains, domainPercent } from '../data/domains';
import { fetchGoals } from '../data/goals';
import { fetchTimeline } from '../data/timeline';
import { percentToLevel, goalStatus } from '../lib/levels';
import { fmtDateShort } from '../lib/dates';
import ProgressBar from '../components/ProgressBar';
import Tag from '../components/Tag';
import type { Domain, Goal, TimelineEntry, GoalStatus } from '../lib/types';

const SOURCE_ICONS = { parent: UserIcon, teacher: MessageSquare, assessment: ClipboardCheck };
const SOURCE_LABELS = { parent: 'Parent', teacher: 'Teacher', assessment: 'Assessment' };
const STATUS_VARIANT: Record<GoalStatus, 'neutral' | 'accent' | 'outline'> = {
  'On Track': 'neutral',
  'Needs Support': 'accent',
  'In Progress': 'outline',
};

export default function DomainDetail() {
  const navigate = useNavigate();
  const { domainId } = useParams();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDomains(PROFILE_ID), fetchGoals(PROFILE_ID), fetchTimeline(PROFILE_ID)]).then(
      ([d, g, t]) => {
        setDomains(d);
        setGoals(g);
        setTimeline(t);
        setLoading(false);
      }
    );
  }, []);

  if (loading) return <div className="screen-no-tabs" style={{ padding: 20 }}>Loading…</div>;

  const domain = domains.find((d) => d.id === domainId);
  if (!domain) return <div className="screen-no-tabs" style={{ padding: 20 }}>Domain not found.</div>;

  const percent = domainPercent(domain);
  const domainGoals = goals.filter((g) => g.domainId === domainId);
  const history = timeline.filter((e) => e.domainId === domainId);

  return (
    <div className="screen-no-tabs">
      <div className="header-bar" style={{ justifyContent: 'flex-start' }}>
        <button className="icon-btn-plain" onClick={() => navigate(-1)} aria-label="Back">
          <ChevronLeft width={20} height={20} />
        </button>
        <h3 style={{ margin: 0, fontSize: 19 }}>{domain.name}</h3>
      </div>

      <div style={{ padding: 20 }}>
        <h6 style={{ margin: 0 }}>Overall</h6>
        <div style={{ fontSize: 30, fontFamily: 'var(--font-heading)', fontWeight: 800, marginTop: 6 }}>
          {percentToLevel(percent)}
        </div>
        <div style={{ marginTop: 10 }}>
          <ProgressBar percent={percent} />
        </div>
      </div>

      <div style={{ padding: '6px 20px 8px' }}>
        <h6 style={{ margin: '0 0 8px' }}>Skills</h6>
        {domain.skills.map((s) => (
          <div key={s.id} style={{ padding: '10px 0', borderBottom: '2px solid var(--color-neutral-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span>{s.name}</span>
              <span style={{ color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>{percentToLevel(s.percent)}</span>
            </div>
            <ProgressBar percent={s.percent} thin />
            <div style={{ fontSize: 11, color: 'color-mix(in srgb, var(--color-text) 50%, transparent)', marginTop: 4 }}>
              Last assessed {fmtDateShort(s.lastAssessedAt)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '16px 20px 8px' }}>
        <h6 style={{ margin: '0 0 8px' }}>IEP Goals in this Area</h6>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {domainGoals.map((g) => {
            const status = goalStatus(g.percent);
            return (
              <div key={g.id} className="card elev-sm">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <Tag variant={STATUS_VARIANT[status]}>{status}</Tag>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{g.title}</div>
                <ProgressBar percent={g.percent} thin />
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '16px 20px 8px' }}>
        <h6 style={{ margin: '0 0 4px' }}>History</h6>
        {history.map((e) => {
          const SourceIcon = SOURCE_ICONS[e.source];
          return (
            <div key={e.id} style={{ padding: '12px 0', borderBottom: '2px solid var(--color-neutral-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <Tag variant="neutral">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <SourceIcon width={11} height={11} />
                    {SOURCE_LABELS[e.source]}
                  </span>
                </Tag>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.4 }}>{e.note}</div>
              {e.attachmentUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 11, color: 'var(--color-accent-700)' }}>
                  <Paperclip width={11} height={11} />
                  {e.attachmentUrl.split('/').pop()}
                </div>
              )}
              <div style={{ fontSize: 11, color: 'color-mix(in srgb, var(--color-text) 50%, transparent)', marginTop: 4 }}>
                {fmtDateShort(e.occurredAt)} · {e.level}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '8px 20px 24px' }}>
        <button className="btn btn-secondary btn-block" onClick={() => navigate(`/add?domain=${domain.id}`)}>
          <Plus width={16} height={16} />
          &nbsp;Log an update
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/DomainDetail.tsx
git commit -m "Add Domain Detail screen"
```

---

## Task 20: Add Entry screen

**Files:**
- Create: `src/screens/AddEntry.tsx`

- [ ] **Step 1: Create `src/screens/AddEntry.tsx`**

```tsx
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Paperclip, FileCheck2 } from 'lucide-react';
import { PROFILE_ID } from '../App';
import { fetchDomains } from '../data/domains';
import { createTimelineEntry } from '../data/timeline';
import type { Domain, Level, Source } from '../lib/types';

const LEVELS: Level[] = ['Emerging', 'Developing', 'Secure', 'Independent'];
const SOURCES: { id: Source; label: string }[] = [
  { id: 'parent', label: 'Parent' },
  { id: 'teacher', label: 'Teacher' },
  { id: 'assessment', label: 'Assessment' },
];

export default function AddEntry() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainId, setDomainId] = useState('');
  const [source, setSource] = useState<Source>('parent');
  const [level, setLevel] = useState<Level>('Developing');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDomains(PROFILE_ID).then((d) => {
      setDomains(d);
      const fromQuery = searchParams.get('domain');
      setDomainId(fromQuery && d.some((dom) => dom.id === fromQuery) ? fromQuery : d[0]?.id ?? '');
    });
  }, [searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    setError('');
    try {
      await createTimelineEntry({
        profileId: PROFILE_ID,
        domainId,
        source,
        level,
        note: note.trim(),
        occurredAt: date,
        attachmentFile: attachment,
      });
      navigate('/timeline');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save update.');
      setSaving(false);
    }
  }

  return (
    <div className="screen-no-tabs">
      <div className="header-bar">
        <h3 style={{ margin: 0, fontSize: 19 }}>Log an Update</h3>
        <button className="icon-btn-plain" onClick={() => navigate(-1)} aria-label="Close">
          <X width={20} height={20} />
        </button>
      </div>
      <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="field">
          <label>Area</label>
          <div className="segmented-3">
            {domains.map((d) => (
              <button
                type="button"
                key={d.id}
                className="segmented-opt"
                style={{
                  background: domainId === d.id ? 'var(--color-accent)' : 'transparent',
                  color: domainId === d.id ? 'var(--color-bg)' : 'var(--color-text)',
                }}
                onClick={() => setDomainId(d.id)}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Source</label>
          <div className="segmented-3">
            {SOURCES.map((s) => (
              <button
                type="button"
                key={s.id}
                className="segmented-opt"
                style={{
                  background: source === s.id ? 'var(--color-accent)' : 'transparent',
                  color: source === s.id ? 'var(--color-bg)' : 'var(--color-text)',
                }}
                onClick={() => setSource(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="level">Level</label>
          <select id="level" className="input" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="date">Date</label>
          <input id="date" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="note">Note</label>
          <textarea
            id="note"
            className="input"
            rows={4}
            placeholder="What did you notice?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Attach a photo or document</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px dashed var(--color-divider)', padding: 14, cursor: 'pointer', position: 'relative' }}>
            {attachment ? <FileCheck2 width={18} height={18} /> : <Paperclip width={18} height={18} />}
            <span style={{ fontSize: 13, color: attachment ? 'var(--color-text)' : 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>
              {attachment ? attachment.name : 'Tap to attach a photo or document'}
            </span>
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
              onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {error && <p style={{ color: 'var(--color-accent-700)', fontSize: 13, margin: 0 }}>{error}</p>}

        <button className="btn btn-primary btn-block" style={{ justifyContent: 'center' }} type="submit" disabled={saving || !note.trim()}>
          {saving ? 'Saving…' : 'Save Update'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/AddEntry.tsx
git commit -m "Add Add Entry screen with attachment upload"
```

---

## Task 21: Share/Invite screen

**Files:**
- Create: `src/screens/ShareInvite.tsx`

- [ ] **Step 1: Create `src/screens/ShareInvite.tsx`**

```tsx
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { PROFILE_ID } from '../App';
import { inviteTeamMember } from '../data/team';
import type { TeamRole, TeamScope } from '../lib/types';

const ROLES: { id: TeamRole; label: string }[] = [
  { id: 'family', label: 'Family' },
  { id: 'school_staff', label: 'School staff' },
  { id: 'service_provider', label: 'Service provider' },
];
const SCOPES: { id: TeamScope; label: string }[] = [
  { id: 'full', label: 'Full progress' },
  { id: 'academic_only', label: 'Academic only' },
];

export default function ShareInvite() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('family');
  const [scope, setScope] = useState<TeamScope>('full');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    setError('');
    try {
      await inviteTeamMember({
        profileId: PROFILE_ID,
        name: name.trim(),
        title: title.trim() || ROLES.find((r) => r.id === role)!.label,
        email: email.trim(),
        role,
        scope,
      });
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite.');
      setSaving(false);
    }
  }

  return (
    <div className="screen-no-tabs">
      <div className="header-bar">
        <h3 style={{ margin: 0, fontSize: 19 }}>Invite to Team</h3>
        <button className="icon-btn-plain" onClick={() => navigate(-1)} aria-label="Close">
          <X width={20} height={20} />
        </button>
      </div>
      <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" className="input" type="text" placeholder="e.g. Dana Wells" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="title">Role on the team</label>
          <input id="title" className="input" type="text" placeholder="e.g. Private speech therapist" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Group</label>
          <div className="segmented-3">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.id}
                className="segmented-opt"
                style={{ background: role === r.id ? 'var(--color-accent)' : 'transparent', color: role === r.id ? 'var(--color-bg)' : 'var(--color-text)' }}
                onClick={() => setRole(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>What to share</label>
          <div className="segmented-3">
            {SCOPES.map((s) => (
              <button
                type="button"
                key={s.id}
                className="segmented-opt"
                style={{ background: scope === s.id ? 'var(--color-accent)' : 'transparent', color: scope === s.id ? 'var(--color-bg)' : 'var(--color-text)' }}
                onClick={() => setScope(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', margin: 0 }}>
          They'll get view-only access and an email invite. You can revoke access anytime from Profile.
        </p>
        {error && <p style={{ color: 'var(--color-accent-700)', fontSize: 13, margin: 0 }}>{error}</p>}
        <button className="btn btn-primary btn-block" style={{ justifyContent: 'center' }} type="submit" disabled={saving || !name.trim() || !email.trim()}>
          {saving ? 'Sending…' : 'Send Invite'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/ShareInvite.tsx
git commit -m "Add Share/Invite screen"
```

---

## Task 22: Manual QA pass

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: server starts at `http://localhost:5173/` with no console errors.

- [ ] **Step 2: Sign in**

Open the app in a browser. Enter `rakeshritta@gmail.com`, request the magic link, open it
from the inbox. Expected: lands back on the app signed in (not stuck on the sign-in screen).

- [ ] **Step 3: Walk through the golden path**

- Home: domain cards, year-progress bar, goals summary, and recent updates all show seeded
  data matching the values in `0001_init.sql`.
- Tap a domain card → Domain Detail shows its skills, goals, and history; "Log an update"
  pre-selects that domain on the Add screen.
- Timeline: filter chips narrow the list by domain; entries are grouped by month, most
  recent month first.
- Goals: all 6 goals show with correct status tags (On Track/In Progress/Needs Support)
  matching each goal's percent.
- Add Entry: fill in note + submit → new entry appears at the top of Timeline; attaching a
  file uploads to Supabase Storage and `attachment_url` shows in the entry.
- Profile: shows the seeded team member (you); tapping "+ Invite" opens Share/Invite;
  submitting adds a new team member row and Profile reflects it on return.
- Tab bar and floating "+" button appear on Home/Timeline/Goals/Profile, and are hidden on
  Domain Detail/Add/Share.

- [ ] **Step 4: Check edge cases**

- Remove all but one team member from Profile — grouping by role still renders correctly.
- Filter Timeline to a domain with zero entries — screen shows no entries, no crash.
- Try to submit Add Entry with an empty note — Save button stays disabled.

- [ ] **Step 5: Run the automated test suite**

Run: `npm test`
Expected: all tests pass (levels + dates suites from Tasks 4–5).

---

## Task 23: Deploy to Vercel

**Files:** none (deployment configuration only)

- [ ] **Step 1: Push the branch to GitHub**

```bash
git push -u origin master
```

- [ ] **Step 2: Create the Vercel project**

Run: `npx vercel link` (or connect the `AWS-RK/tanvi-progress-tracker` repo via the Vercel
dashboard: New Project → Import Git Repository). Framework preset: Vite.

- [ ] **Step 3: Set environment variables**

In Vercel project settings → Environment Variables, add for Production and Preview:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

(same values as `.env.local`)

- [ ] **Step 4: Deploy**

Run: `npx vercel --prod` (or push to `master`/open a PR if auto-deploy is configured in the
dashboard).
Expected: deployment succeeds, Vercel prints a production URL.

- [ ] **Step 5: Update Supabase auth URL**

In Supabase dashboard → Authentication → URL Configuration, add the Vercel production URL
to the Site URL / Redirect URLs so magic-link emails redirect correctly in production.

- [ ] **Step 6: Verify production**

Open the production URL, sign in with the magic link, confirm Home loads real data.

- [ ] **Step 7: Commit any deployment config that Vercel/vercel CLI generated**

```bash
git add .
git status
```

Review what `vercel link`/`vercel` added (typically `.vercel/` — add that to `.gitignore`
since it contains project IDs but no secrets) then commit anything meant to be tracked,
e.g. a `vercel.json` if one was created.

---

## Self-Review Notes

- **Spec coverage:** All 7 screens (Home, Timeline, Goals, Profile, Domain Detail, Add
  Entry, Share/Invite), the data model, RLS-based sharing, magic-link auth, attachment
  upload, and Vercel deployment from the spec are each covered by a task above.
- **Type consistency:** `Domain`/`Skill`/`Goal`/`TimelineEntry`/`TeamMember` types (Task 3)
  are used identically by every data module (Tasks 9–12) and every screen (Tasks 15–21) —
  field names match throughout (`domainId`, `attachmentUrl`, `occurredAt`, etc.).
- **Scope:** This plan covers the full app end-to-end; it does not include native mobile
  packaging, push notifications, or multi-child support, per the spec's stated non-goals.
