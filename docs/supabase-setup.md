# Supabase Setup (Cloud)

This document describes how Join uses Supabase **Cloud**. In this
sprint, Supabase is only **prepared structurally** – no real keys are set up
yet.

## Basic Rules

- Join uses **Supabase Cloud**. **Nothing is self-installed.**
- **No secrets in the repository.** Do not commit real keys, passwords, or tokens,
  and no `.env` files with real values.
- Access credentials (Project URL, anon key) are kept locally/via the environment
  and later integrated through the Angular `environment` configuration.
- **According to the course requirements, guest login and logged-in users use the
  same data set.**

## Table Design `contacts`

| Column       | Type        | Constraints              |
| ------------ | ----------- | ------------------------ |
| `id`         | `uuid`      | Primary Key, `default gen_random_uuid()` |
| `name`       | `text`      | `not null`               |
| `email`      | `text`      | `not null`               |
| `phone`      | `text`      | `not null`               |
| `color`      | `text`      | `null`                   |
| `initials`   | `text`      | `null`                   |
| `created_at` | `timestamp` | Default: `now()`         |
| `updated_at` | `timestamp` | Default: `now()`         |

The corresponding frontend model is located at `src/app/core/models/contact.model.ts`
(camelCase: `color` / `initials` / `createdAt` / `updatedAt`).

### Example SQL

Example without real data and without secrets:

```sql
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  color text,
  initials text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

## Current State

With **Orange 4B**, Supabase is connected for the contacts demo:

- The `@supabase/supabase-js` client is installed.
- The `ContactService` remains the **central place** for the contacts data logic
  and additionally provides Supabase methods
  (`loadContactsFromSupabase`, `addContactToSupabase`, `updateContactInSupabase`,
  `deleteContactFromSupabase`).
- The existing mock methods (`getContacts`, `getContactById`, `addContact`,
  `updateContact`, `deleteContact`) are kept as a **fallback**.

### Angular Demo: URL + Publishable Key

For this Developer Akademie demo project, it has been decided:

- The **Project URL** and the **Publishable Key** may be stored for the demo in the
  Angular `environment` files (`src/environments/`).
- **Only the Publishable Key** is used.
- **Never store the Secret Key / Service Role Key in the frontend.**
- The current demo **RLS policy** allows **anon access** to `contacts`.
  This is intentionally set for the school project and is **not production-ready**.
- The contacts stored in Supabase are **demo data** without real
  personal information.

> This solution is demo-suitable but not production-ready. Later,
> **auth and RLS should be hardened** (see "Next Steps").

## Dummy Data

- Create at least **10 legitimate contacts** for the sprint submission.
- There are currently 12 mock contacts in the service `src/app/core/services/contact.service.ts`.
- This mock data will later be replaced by real Supabase data.
- Real personal data must **not** be used as demo data.

## Tasks Setup

For Sprint 2 (Board & Add Task), the Supabase structure for tasks is
being prepared. Execution is done **manually via the Supabase SQL Editor** –
at this stage there is still **no** Angular-Supabase connection for tasks.

- **SQL file:** `supabase/sql/tasks-setup.sql` (idempotent, can be run multiple times)
- **Tables:** `tasks`, `subtasks`
  - `tasks.id` is `text` (e.g. `t1`), consistent with the Angular task model.
  - `subtasks.task_id` references `tasks(id)` with `on delete cascade`.
  - `tasks.assigned_contact_ids` is `text[]` and references the
    contacts demo IDs.
- **Status values:** `todo`, `inProgress`, `awaitFeedback`, `done`
- **Priorities:** `urgent`, `medium`, `low`
- **Categories:** `Technical Task`, `User Story`
- **Demo data:** at least 6 demo tasks including subtasks, matching
  `src/app/core/data/task-dummy-data.ts`, without real personal data.
- **Demo RLS:** policies for `anon` (select/insert/update/delete) are **intentionally
  open** and **not production-ready** (analogous to the contacts demo).
- **No secrets:** Neither the Secret Key nor the Service Role Key or passwords
  belong in the SQL file or the repository.

> As with contacts: demo-suitable but not production-ready. Later,
> **auth and RLS should be hardened**.

## Secret Rules

**Not in the repository:**

- Supabase URL with a real project value
- Supabase Anon Key
- Supabase Service Role Key
- `.env` files with real values
- Screenshots with visible keys

**Allowed:**

- Placeholders
- Example names without real personal data
- Technical documentation without real keys

## Local Configuration (later, Orange 4B)

For Orange 4B, it needs to be defined how the local configuration is done.
Possible options:

- Angular `environment` files with placeholders
- a local, **untracked** environment file
- configuration via the deployment environment

For Sprint 1: **No real Supabase credentials in the repo.**

## Next Steps (not yet in this sprint)

1. Create the Supabase project in the cloud (coordinated by the team).
2. Create the `contacts` table according to the design above.
3. Provide the Project URL and anon key **outside the repo**
   (Angular `environment`, not checked in).
4. Switch `ContactService` from mock data to Supabase calls.
5. Review Row Level Security / policies according to the course requirements.

## Responsibility

**Owner for Supabase setup:** Roger

Open questions:

- Who ultimately creates the Supabase project?
- Who gets access?
- Which URL/anon key configuration is used locally?
- Which Row Level Security rules are needed?
- Do guest login and users use the same data set?
