# Team Rules for the Join Project

Join is an **Angular project** (SPA). These rules help us collaborate cleanly
as a team and avoid merge conflicts.

## Angular and Branches

Angular helps us divide the work better, because functionality can be separated
into components, pages, services, and layout areas.

Nevertheless, we continue to work with branches.

Why?

- `main` remains our stable shared version.
- A feature branch protects `main` from unfinished changes.
- Pull requests make changes visible and reviewable.
- Even in Angular there are shared files that can affect multiple team
  members.

In short: **Angular separates the work at the technical level, Git branches
protect `main` organizationally.** One does not replace the other.

The claim "When we work with Angular, we don't need branches because
everyone works in their own area" is only half true: the technical
separation via components is correct – but it does not make branches and pull
requests unnecessary.

Examples of shared files:

```text
package.json
package-lock.json
angular.json
src/app/app.routes.ts
src/styles.scss
src/app/core/services/*
src/app/shared/*
src/app/layout/*
```

## 1. Don't Work Directly on `main`

`main` is our stable shared project version. New changes are
always prepared first in a dedicated feature branch.

## 2. Branch Names Describe Tasks

Branch names contain **no personal names**.

Good:

```text
feature/contacts
feature/contacts-detail
feature/layout-shell
chore/angular-project-setup
docs/update-readme
```

Not good:

```text
feature/contacts-marko
feature/board-kevin
feature/login-roger
```

Who works on which task is clarified through coordination or
`docs/task-split.md`, not through the branch name.

## 3. Feature Branches and Separate Areas

Each task area has its own components/folders under `src/app/`.

Examples:

```text
Contacts:   src/app/pages/contacts/
Board:      src/app/pages/board/
Add Task:   src/app/pages/add-task/
Summary:    src/app/pages/summary/
Layout:     src/app/layout/ (header, navbar, footer, shell)
```

This way we avoid multiple people changing the same file at the same time.

## 4. Only Change Shared Files After Coordination

These files affect the entire project and are only changed in a
**coordinated** way:

```text
package.json
package-lock.json
angular.json
tsconfig*.json
src/app/app.routes.ts
src/app/app.config.ts
src/styles.scss
README.md
docs/team-rules.md
docs/git-workflow.md
```

Please only touch `package.json`, `package-lock.json`, and `angular.json` after
coordination in particular – otherwise conflicts with dependencies and the build arise quickly.

## 5. Small Pull Requests Instead of Large Bundled Changes

Prefer small, understandable changes over huge pull requests.

## 6. Quick Check Before Merging

```text
Are the right files changed?
Does the build run (npm run build)?
Are there conflicts?
Is the change clearly described?
```

## 7. Delete the Branch After Merging

Once a pull request has been merged, the corresponding branch is deleted.
Then switch back to `main` and sync.

## Key Takeaway

```text
Coordinate first, then change.
Branch first, then commit.
Pull request first, then merge.
```
