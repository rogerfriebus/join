# Task Distribution Join

This file is a proposal and can be adjusted by the team. It complements the
Trello board, where the tasks are maintained on an ongoing basis.

Join is an **Angular project** (SPA).

## Sprint 1 – Proposal

### Roger

- Angular project setup
- Supabase structure (preparation, without secrets)
- Documentation (`README.md`, `docs/*`)
- Code reviews / pull requests

### Kevin

- Layout shell (`src/app/layout/shell/`)
- Header (`src/app/layout/header/`)
- Navbar (`src/app/layout/navbar/`)
- Footer (`src/app/layout/footer/`)

### Marko

- Contacts UI (`src/app/pages/contacts/`)
- Contact list
- Detail view

### Shared Integration

- Contact Form (Add / Edit)
- Form validation
- CRUD against Supabase

## Shared Files Requiring Coordination

```text
package.json
package-lock.json
angular.json
src/app/app.routes.ts
src/app/app.config.ts
src/styles.scss
```
