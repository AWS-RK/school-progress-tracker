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
