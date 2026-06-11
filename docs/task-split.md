# Aufgabenaufteilung Join

Diese Datei ist ein Vorschlag und kann im Team angepasst werden. Sie ergänzt das
Trello Board, in dem die Aufgaben laufend gepflegt werden.

Join ist ein **Angular-Projekt** (SPA).

## Sprint 1 – Vorschlag

### Roger

- Angular-Projekt-Setup
- Supabase-Struktur (Vorbereitung, ohne Secrets)
- Dokumentation (`README.md`, `docs/*`)
- Code-Reviews / Pull Requests

### Kevin

- Layout-Shell (`src/app/layout/shell/`)
- Header (`src/app/layout/header/`)
- Navbar (`src/app/layout/navbar/`)
- Footer (`src/app/layout/footer/`)

### Marko

- Contacts UI (`src/app/pages/contacts/`)
- Kontaktliste
- Detailansicht

### Gemeinsame Integration

- Contact Form (Add / Edit)
- Formular-Validierung
- CRUD gegen Supabase

## Gemeinsame Dateien mit Abstimmung

```text
package.json
package-lock.json
angular.json
src/app/app.routes.ts
src/app/app.config.ts
src/styles.scss
```
