
# Git Workflow for the Join Project

This guide describes how we work as a team with GitHub and VS Code.
Join is an Angular project; the VS Code workflow described here remains
valid unchanged.

The goal is: we avoid chaos, don't overwrite each other, and integrate changes into the shared project version in a controlled way.

## Basic Rule

We do not work directly on `main`.

`main` is our stable shared version. New changes are first prepared in a dedicated branch and then merged into `main` via a pull request.

This also applies with Angular. While Angular separates work at the technical
level through components, pages, and services, branches additionally protect
`main` organizationally. The detailed explanation is in
`docs/team-rules.md` (section "Angular and Branches").

## Standard Procedure in VS Code

### 1. Start on `main`

The bottom left of VS Code must show `main`.

If a different branch is shown there, switch to `main` first.

Then sync `main` so that the current state from GitHub is available locally.

### 2. Create a New Branch

A dedicated branch is created for each task.

Examples:

```text
feature/login
feature/summary
feature/board
feature/add-task
feature/contacts
docs/update-git-workflow
```

Branch names describe the task, not the person.

Good:

```text
feature/contacts
```

Not good:

```text
feature/contacts-marko
```

### 3. Change Files

Next, edit the relevant files.

Examples:

```text
src/app/pages/board/
```

or:

```text
src/app/pages/contacts/
```

Important: Shared files (e.g. `package.json`, `package-lock.json`,
`angular.json`, `src/app/app.routes.ts`) are only changed after coordination.

### 4. Commit the Change

In VS Code, go to "Source Control" on the left.

There you can see the changed files.

Enter a short commit message, for example:

```text
Update login button text
```

Then click `Commit`.

### 5. Publish the Branch

After the commit, click `Publish Branch` or `Sync Changes`.

This uploads the branch to GitHub.

### 6. Create a Pull Request

In VS Code, create a pull request via "GitHub Pull Requests".

The direction must be:

```text
feature/... → main
```

That is: the feature branch is merged into `main`.

### 7. Review the Pull Request

Before merging, check:

* Is the direction `feature/... → main` correct?
* Are only the expected files changed?
* Are there no conflicts?
* Is the change clearly described?

### 8. Merge the Pull Request

If everything is fine, the pull request is merged.

After that, the change is officially in `main`.

### 9. Delete the Branch

After the merge, the branch can be deleted.

Both the local branch and the remote branch on GitHub can be deleted.

### 10. Back to `main`

After the merge, switch back to `main` and sync.

Your own local state is then clean again.

## Key Takeaway

```text
main is the stable shared version.
feature/... is a working branch for a specific task.
Changes come back to main via pull request.
```
