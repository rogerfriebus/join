-- ============================================================================
-- Join – Supabase setup: tasks & subtasks
-- ============================================================================
-- This script is idempotent and is run MANUALLY via the Supabase SQL editor.
-- It contains:
--   1. Tables `tasks` and `subtasks`
--   2. Optional updated_at trigger
--   3. Demo data matching src/app/core/data/task-dummy-data.ts
--   4. Demo RLS policies (open for anon, like the contacts demo)
--
-- IMPORTANT (demo / Developer Akademie):
--   - The RLS policies are DELIBERATELY open for anon and NOT production-ready.
--   - NO real personal data is used.
--   - No secret keys / service role keys / passwords in this file.
--   - `tasks.id` stays text (e.g. 't1'), consistent with the Angular task model.
--   - `assigned_contact_ids` references the contacts demo IDs as text[].
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tables
-- ----------------------------------------------------------------------------
create table if not exists tasks (
  id text primary key,
  title text not null,
  description text,
  due_date date not null,
  priority text not null check (priority in ('urgent', 'medium', 'low')),
  category text not null check (category in ('Technical Task', 'User Story')),
  status text not null check (status in ('todo', 'inProgress', 'awaitFeedback', 'done')),
  assigned_contact_ids text[] not null default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists subtasks (
  id text primary key,
  task_id text not null references tasks(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_subtasks_task_id on subtasks(task_id);

-- ----------------------------------------------------------------------------
-- 2. updated_at trigger (optional, keeps updated_at current automatically)
-- ----------------------------------------------------------------------------
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_tasks_updated_at on tasks;
create trigger set_tasks_updated_at
  before update on tasks
  for each row
  execute function update_updated_at_column();

drop trigger if exists set_subtasks_updated_at on subtasks;
create trigger set_subtasks_updated_at
  before update on subtasks
  for each row
  execute function update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 3. Demo data (matching task-dummy-data.ts) – idempotent via upsert
-- ----------------------------------------------------------------------------
insert into tasks (id, title, description, due_date, priority, category, status, assigned_contact_ids) values
  ('t1', 'Design landing page hero section',
   'Create the hero layout with headline, call-to-action and a responsive image for the marketing landing page.',
   '2026-08-05', 'urgent', 'User Story', 'todo', array['1','2']),
  ('t2', 'Implement user authentication flow',
   'Build sign-up, login and logout with form validation and clear error messages.',
   '2026-07-30', 'medium', 'Technical Task', 'inProgress', array['3','4','5']),
  ('t3', 'Set up CI/CD pipeline',
   'Configure automated build, test and deployment steps so changes ship to staging on every merge.',
   '2026-08-12', 'low', 'Technical Task', 'awaitFeedback', array['6']),
  ('t4', 'Write onboarding user guide',
   'Document the core workflows so new users can get started with the board without extra support.',
   '2026-07-15', 'medium', 'User Story', 'done', array['7','8']),
  ('t5', 'Conduct usability testing session',
   'Run a moderated test with five participants and collect feedback on the task creation flow.',
   '2026-08-20', 'low', 'User Story', 'todo', array[]::text[])
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  due_date = excluded.due_date,
  priority = excluded.priority,
  category = excluded.category,
  status = excluded.status,
  assigned_contact_ids = excluded.assigned_contact_ids,
  updated_at = now();

insert into subtasks (id, task_id, title, done, position) values
  ('t1-s1', 't1', 'Draft wireframe in Figma', true, 0),
  ('t1-s2', 't1', 'Define responsive breakpoints', false, 1),
  ('t2-s1', 't2', 'Set up authentication service', true, 0),
  ('t2-s2', 't2', 'Add form validation', true, 1),
  ('t2-s3', 't2', 'Handle session persistence', false, 2),
  ('t4-s1', 't4', 'Outline guide structure', true, 0),
  ('t4-s2', 't4', 'Add annotated screenshots', true, 1)
on conflict (id) do update set
  task_id = excluded.task_id,
  title = excluded.title,
  done = excluded.done,
  position = excluded.position,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 4. Demo RLS policies (DELIBERATELY open for anon – NOT production-ready)
-- ----------------------------------------------------------------------------
alter table tasks enable row level security;
alter table subtasks enable row level security;

-- tasks
drop policy if exists "Allow public read tasks" on tasks;
create policy "Allow public read tasks" on tasks
  for select to anon using (true);

drop policy if exists "Allow public insert tasks" on tasks;
create policy "Allow public insert tasks" on tasks
  for insert to anon with check (true);

drop policy if exists "Allow public update tasks" on tasks;
create policy "Allow public update tasks" on tasks
  for update to anon using (true) with check (true);

drop policy if exists "Allow public delete tasks" on tasks;
create policy "Allow public delete tasks" on tasks
  for delete to anon using (true);

-- subtasks
drop policy if exists "Allow public read subtasks" on subtasks;
create policy "Allow public read subtasks" on subtasks
  for select to anon using (true);

drop policy if exists "Allow public insert subtasks" on subtasks;
create policy "Allow public insert subtasks" on subtasks
  for insert to anon with check (true);

drop policy if exists "Allow public update subtasks" on subtasks;
create policy "Allow public update subtasks" on subtasks
  for update to anon using (true) with check (true);

drop policy if exists "Allow public delete subtasks" on subtasks;
create policy "Allow public delete subtasks" on subtasks
  for delete to anon using (true);
