-- ============================================================================
-- Join – Supabase Setup: Tasks & Subtasks (Sprint 2)
-- ============================================================================
-- Dieses Skript ist idempotent und wird MANUELL über den Supabase SQL Editor
-- ausgeführt. Es enthält:
--   1. Tabellen `tasks` und `subtasks`
--   2. Optionalen updated_at-Trigger
--   3. Demo-Daten passend zu src/app/core/data/task-dummy-data.ts
--   4. Demo-RLS-Policies (offen für anon, analog zur Contacts-Demo)
--
-- WICHTIG (Demo / Developer-Akademie):
--   - Die RLS-Policies sind BEWUSST offen für anon und NICHT produktionsreif.
--   - Es werden KEINE echten personenbezogenen Daten verwendet.
--   - Keine Secret Keys / Service Role Keys / Passwörter in dieser Datei.
--   - `tasks.id` bleibt text (z. B. 't1'), konsistent zum Angular-Task-Modell.
--   - `assigned_contact_ids` referenziert die Contacts-Demo-IDs als text[].
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabellen
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
-- 2. updated_at-Trigger (optional, hält updated_at automatisch aktuell)
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
-- 3. Demo-Daten (passend zu task-dummy-data.ts) – idempotent via upsert
-- ----------------------------------------------------------------------------
insert into tasks (id, title, description, due_date, priority, category, status, assigned_contact_ids) values
  ('t1', 'Kanban Board Grundlayout finalisieren',
   'Vier Spalten (ToDo, In Progress, Awaiting Feedback, Done) mit Platzhalter-Karten aufbauen.',
   '2026-07-15', 'urgent', 'Technical Task', 'todo', array['1','2']),
  ('t2', 'Add Task Formular validieren',
   'Pflichtfelder Titel, Due Date und Kategorie prüfen und Fehlermeldungen anzeigen.',
   '2026-07-10', 'medium', 'User Story', 'inProgress', array['3','4','5']),
  ('t3', 'Contacts Integration im Board prüfen',
   'Zugewiesene Kontakte als Initialen-Avatare auf den Task-Karten anzeigen.',
   '2026-07-08', 'low', 'Technical Task', 'awaitFeedback', array['6']),
  ('t4', 'Responsive Board Verhalten testen',
   'Board auf Tablet- und Mobilbreiten testen und Scroll-/Umbruchverhalten sicherstellen.',
   '2026-06-30', 'medium', 'User Story', 'done', array['7','8']),
  ('t5', 'Deployment Build für Mentor vorbereiten',
   'Produktions-Build erstellen und Abgabe-Stand für das Mentor-Review bereitstellen.',
   '2026-07-20', 'low', 'User Story', 'todo', array[]::text[]),
  ('t6', 'Drag-and-Drop zwischen Board-Spalten konzipieren',
   'Technisches Konzept für das Verschieben von Tasks zwischen den vier Spalten erarbeiten.',
   '2026-07-12', 'urgent', 'Technical Task', 'inProgress', array['9','10','11'])
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
  ('t1-s1', 't1', 'Spalten-Komponente erstellen', false, 0),
  ('t1-s2', 't1', 'Responsives Grid definieren', false, 1),
  ('t2-s1', 't2', 'Titel-Validierung', true, 0),
  ('t2-s2', 't2', 'Due-Date-Validierung', false, 1),
  ('t2-s3', 't2', 'Kategorie-Validierung', false, 2),
  ('t4-s1', 't4', 'Breakpoints definieren', true, 0),
  ('t4-s2', 't4', 'Mobile Ansicht prüfen', true, 1),
  ('t6-s1', 't6', 'CDK DragDrop evaluieren', true, 0),
  ('t6-s2', 't6', 'Statuswechsel beim Drop definieren', false, 1)
on conflict (id) do update set
  task_id = excluded.task_id,
  title = excluded.title,
  done = excluded.done,
  position = excluded.position,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 4. Demo-RLS-Policies (BEWUSST offen für anon – NICHT produktionsreif)
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
