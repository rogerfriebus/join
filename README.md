# Join

Join is a collaborative team project from the Developer Akademie – a web-based
kanban/task management app based on a Figma design.

**Join is an Angular project.** The former HTML/CSS/JS structure has been replaced
and is no longer part of the current project state. It remains accessible only
through the Git history.

The app is implemented as a **Single Page Application (SPA)**, not as a Multi Page
Application.

## Team

- Roger
- Kevin
- Marko

## Technical Foundation

Recommended versions (team baseline):

- Angular CLI `21.2.x`
- Node.js `24.x`
- npm `11.x`

Stylesheets: SCSS. No additional UI framework. No SSR.

## Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
ng serve
```

## Local Start

After `ng serve`, the app runs locally at:

```text
http://localhost:4200
```

## Project Structure (Excerpt)

```text
join/
├── src/
│   └── app/
│       ├── core/
│       │   ├── services/
│       │   └── models/
│       ├── shared/
│       │   └── components/
│       ├── layout/
│       │   ├── header/
│       │   ├── navbar/
│       │   ├── footer/
│       │   └── shell/
│       └── pages/
│           ├── login/
│           ├── summary/
│           ├── board/
│           ├── add-task/
│           ├── contacts/
│           ├── legal-notice/
│           └── privacy-policy/
├── docs/                              (team docs: rules, Git workflow, setup)
├── angular.json
├── package.json
└── README.md
```

## Routing

Login is an Angular route/component (not a root `index.html` page).
`src/index.html` is now only the app entry point.

- `/login`
- `/summary`
- `/board`
- `/add-task`
- `/contacts`
- `/legal-notice`
- `/privacy-policy`
- Default route → `/login`
- Wildcard route → `/login`

## Supabase Cloud

Join uses **Supabase Cloud**. At this stage, Supabase is only prepared
structurally. **No secrets / no real keys** are written to the repository.
Details:

```text
docs/supabase-setup.md
```

## Sprint 1 – Goal

- Project structure (Angular SPA)
- Git repository / team workflow
- Prepare Supabase Cloud
- Dummy data concept
- Header / Navbar / Footer
- Contacts page
- Contacts User Stories 1–4

The task distribution is additionally maintained in the team's Trello board.

## Team Workflow (VS Code / GitHub)

We do **not work directly on `main`**. Changes go through feature branches
and pull requests. The exact procedure and rules are described here:

```text
docs/git-workflow.md
docs/team-rules.md
docs/task-split.md
docs/supabase-setup.md
```

## Note on the Old Structure

The original HTML/CSS/JS variant has been replaced by the Angular project.
The old files are no longer part of the current project state and remain
accessible exclusively through the Git history.
