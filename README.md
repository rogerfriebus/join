# Join

Join ist ein Teamprojekt der Developer Akademie. Ziel ist eine Task-Management-App nach Figma-Vorgabe mit klassischem HTML, CSS und JavaScript.

## Projektziel

Wir bauen gemeinsam eine Web-App mit folgenden Bereichen:

- Login / Registrierung
- Summary
- Board
- Add Task
- Contacts
- Legal Notice / Privacy Policy

## Team

- Roger
- Kevin
- Marko

## Technische Grundlage

Dieses Projekt wird zunächst ohne Framework umgesetzt:

- HTML
- CSS
- JavaScript
- später ggf. Firebase / Remote Storage nach Kursvorgabe

Kein Angular, kein React und kein npm-Setup, solange die Join-Vorgaben nichts anderes verlangen.

## Empfohlene Arbeitsweise

1. Nicht direkt auf `main` arbeiten.
2. Für jede größere Aufgabe einen Feature-Branch erstellen.
3. Möglichst getrennte Dateien pro Funktionsbereich nutzen.
4. Gemeinsame Dateien nur nach Absprache ändern.
5. Vor Arbeitsbeginn immer den aktuellen Stand holen.
6. Kleine, verständliche Commits schreiben.
7. Fertige Arbeit per Pull Request zusammenführen.

## Branch-Namensschema

```txt
feature/project-setup
feature/login
feature/signup
feature/summary
feature/board
feature/add-task
feature/contacts
feature/responsive-layout
```

Keine Personennamen in Branches. Verantwortlichkeiten stehen in `docs/task-split.md` oder im Kanban-Board.

## Lokaler Start

Öffne `index.html` im Browser oder nutze in VS Code die Extension „Live Server“.

## Ordnerstruktur

```txt
join/
├── index.html
├── summary.html
├── board.html
├── add-task.html
├── contacts.html
├── privacy-policy.html
├── legal-notice.html
├── css/
├── js/
├── assets/
└── docs/
```

## Wichtige Regel gegen Merge-Konflikte

Nicht alle arbeiten dauerhaft in denselben Sammeldateien wie `style.css` oder `script.js`.

Stattdessen:

- Board: `board.html`, `css/board.css`, `js/board.js`
- Contacts: `contacts.html`, `css/contacts.css`, `js/contacts.js`
- Summary: `summary.html`, `css/summary.css`, `js/summary.js`
- Auth: `index.html`, `css/auth.css`, `js/auth.js`
- Add Task: `add-task.html`, `css/add-task.css`, `js/add-task.js`
