# Join

Join ist ein gemeinsames Teamprojekt der Developer Akademie – eine webbasierte
Kanban-/Task-Management-App nach Figma-Vorgabe.

**Join ist ein Angular-Projekt.** Die frühere HTML/CSS/JS-Struktur wurde ersetzt
und ist nicht mehr Teil des aktuellen Projektstands. Sie bleibt nur über die
Git-Historie nachvollziehbar.

Die App ist als **Single Page Application (SPA)** umgesetzt, nicht als Multi Page
Application.

## Team

- Roger
- Kevin
- Marko

## Technische Grundlage

Empfohlene Versionen (Teamstand):

- Angular CLI `21.2.x`
- Node.js `24.x`
- npm `11.x`

Stylesheets: SCSS. Kein zusätzliches UI-Framework. Kein SSR.

## Setup

Abhängigkeiten installieren:

```bash
npm install
```

Entwicklungsserver starten:

```bash
ng serve
```

## Lokaler Start

Nach `ng serve` läuft die App lokal unter:

```text
http://localhost:4200
```

## Projektstruktur (Auszug)

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
├── docs/                              (Team-Doku: Regeln, Git-Workflow, Setup)
├── angular.json
├── package.json
└── README.md
```

## Routing

Login ist eine Angular-Route/Komponente (keine Root-`index.html`-Seite).
`src/index.html` ist nur noch der App-Einstieg.

- `/login`
- `/summary`
- `/board`
- `/add-task`
- `/contacts`
- `/legal-notice`
- `/privacy-policy`
- Default-Route → `/login`
- Wildcard-Route → `/login`

## Supabase Cloud

Join nutzt **Supabase Cloud**. In diesem Schritt ist Supabase nur strukturell
vorbereitet. Es werden **keine Secrets / keine echten Keys** ins Repository
geschrieben. Details:

```text
docs/supabase-setup.md
```

## Sprint 1 – Ziel

- Projektstruktur (Angular SPA)
- Git-Repository / Teamworkflow
- Supabase Cloud vorbereiten
- Dummy-Daten-Konzept
- Header / Navbar / Footer
- Contacts-Seite
- Contacts User Stories 1–4

Die Aufgabenverteilung wird zusätzlich im Trello Board des Teams gepflegt.

## Teamworkflow (VS Code / GitHub)

Wir arbeiten **nicht direkt auf `main`**. Änderungen laufen über Feature-Branches
und Pull Requests. Der genaue Ablauf und die Regeln stehen hier:

```text
docs/git-workflow.md
docs/team-rules.md
docs/task-split.md
docs/supabase-setup.md
```

## Hinweis zur alten Struktur

Die ursprüngliche HTML/CSS/JS-Variante wurde durch das Angular-Projekt ersetzt.
Die alten Dateien sind nicht mehr Teil des aktuellen Projektstands und bleiben
ausschließlich über die Git-Historie nachvollziehbar.
