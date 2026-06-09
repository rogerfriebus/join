
# Join

Join ist ein gemeinsames Teamprojekt der Developer Akademie.

Ziel ist die Entwicklung einer webbasierten Kanban-/Task-Management-App nach Figma-Vorgabe mit klassischem HTML, CSS und JavaScript.

Das Projekt wird im Team umgesetzt und dient dazu, die Zusammenarbeit mit Git, GitHub, VS Code, Figma und agilen Arbeitsweisen praktisch zu üben.

## Projektziel

Wir bauen gemeinsam eine Web-App mit folgenden Bereichen:

* Login / Registrierung
* Summary
* Board
* Add Task
* Contacts
* Legal Notice / Privacy Policy

## Team

* Roger
* Kevin
* Marko

## Technische Grundlage

Dieses Projekt wird zunächst ohne Framework umgesetzt:

* HTML
* CSS
* JavaScript

Später ggf. Firebase / Remote Storage nach Kursvorgabe.

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

Branch-Namen beschreiben die Aufgabe, nicht die Person.

Gut:

```text
feature/project-setup
feature/login
feature/signup
feature/summary
feature/board
feature/add-task
feature/contacts
feature/responsive-layout
docs/update-git-workflow
docs/update-team-rules
docs/update-readme
```

Nicht gut:

```text
feature/login-roger
feature/board-kevin
feature/contacts-marko
```

Keine Personennamen in Branches. Verantwortlichkeiten stehen in `docs/task-split.md` oder werden im Team abgestimmt.

## Lokaler Start

Das Projekt kann direkt im Browser geöffnet werden.

Einstiegsdatei:

```text
index.html
```

Empfohlen für die lokale Vorschau in VS Code:

```text
Live Server
```

## Ordnerstruktur

```text
join/
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── img/
├── css/
│   ├── global.css
│   ├── layout.css
│   ├── auth.css
│   ├── summary.css
│   ├── board.css
│   ├── add-task.css
│   ├── contacts.css
│   └── responsive.css
├── docs/
│   ├── git-workflow.md
│   ├── team-rules.md
│   ├── task-split.md
│   └── setup-checklist.md
├── js/
│   ├── main.js
│   ├── storage.js
│   ├── validation.js
│   ├── auth.js
│   ├── summary.js
│   ├── board.js
│   ├── add-task.js
│   └── contacts.js
├── index.html
├── summary.html
├── board.html
├── add-task.html
├── contacts.html
├── privacy-policy.html
├── legal-notice.html
├── .gitignore
└── README.md
```

## Seiten

| Datei                   | Zweck                                   |
| ----------------------- | --------------------------------------- |
| `index.html`          | Login / Einstieg                        |
| `summary.html`        | Zusammenfassung / Startseite nach Login |
| `board.html`          | Kanban-Board                            |
| `add-task.html`       | Neue Aufgabe erstellen                  |
| `contacts.html`       | Kontakte                                |
| `privacy-policy.html` | Datenschutzerklärung                   |
| `legal-notice.html`   | Impressum                               |

## CSS-Dateien

| Datei                  | Zweck                                   |
| ---------------------- | --------------------------------------- |
| `css/global.css`     | Globale Farben, Schrift, Grundregeln    |
| `css/layout.css`     | Allgemeines Layout, Navigation, Sidebar |
| `css/auth.css`       | Login / Registrierung                   |
| `css/summary.css`    | Summary-Seite                           |
| `css/board.css`      | Board-Seite                             |
| `css/add-task.css`   | Add-Task-Seite                          |
| `css/contacts.css`   | Contacts-Seite                          |
| `css/responsive.css` | Übergreifende responsive Anpassungen   |

## JavaScript-Dateien

| Datei                | Zweck                                                      |
| -------------------- | ---------------------------------------------------------- |
| `js/main.js`       | Allgemeine App-Logik                                       |
| `js/storage.js`    | Datenhaltung / Local Storage / später ggf. Remote Storage |
| `js/validation.js` | Gemeinsame Formularprüfungen                              |
| `js/auth.js`       | Login / Registrierung                                      |
| `js/summary.js`    | Logik für Summary                                         |
| `js/board.js`      | Logik für Board                                           |
| `js/add-task.js`   | Logik für Add Task                                        |
| `js/contacts.js`   | Logik für Contacts                                        |

## Zusammenarbeit im Team

Bitte arbeitet nicht direkt auf `main`.

`main` ist unsere stabile gemeinsame Projektversion. Änderungen werden zuerst in einem eigenen Branch vorbereitet und danach per Pull Request übernommen.

Vor der ersten Aufgabe bitte lesen:

* [Git-Workflow mit VS Code](https://chatgpt.com/g/g-p-6925716879608191892716bb862aa7ff-developer-akademie/c/docs/git-workflow.md)
* [Team-Regeln](https://chatgpt.com/g/g-p-6925716879608191892716bb862aa7ff-developer-akademie/c/docs/team-rules.md)
* [Aufgabenaufteilung](https://chatgpt.com/g/g-p-6925716879608191892716bb862aa7ff-developer-akademie/c/docs/task-split.md)
* [Setup-Checkliste](https://chatgpt.com/g/g-p-6925716879608191892716bb862aa7ff-developer-akademie/c/docs/setup-checklist.md)

## Gemeinsame Dateien

Einige Dateien betreffen das gesamte Projekt und dürfen nur nach Absprache geändert werden:

```text
css/global.css
css/layout.css
css/responsive.css
js/main.js
js/storage.js
js/validation.js
README.md
docs/team-rules.md
docs/git-workflow.md
```

Bereichsdateien wie `board.css`, `contacts.css`, `summary.css`, `add-task.css` oder `auth.css` können einfacher einer konkreten Aufgabe zugeordnet werden.

## Wichtige Regel gegen Merge-Konflikte

Bitte möglichst nicht gleichzeitig dieselbe Datei bearbeiten.

Beispiele für saubere Aufteilung:

```text
Board:
board.html
css/board.css
js/board.js

Contacts:
contacts.html
css/contacts.css
js/contacts.js

Summary:
summary.html
css/summary.css
js/summary.js

Add Task:
add-task.html
css/add-task.css
js/add-task.js

Login / Registrierung:
index.html
css/auth.css
js/auth.js
```

## Aktueller Entwicklungsstand

Die Grundstruktur des Projekts ist vorbereitet.

Vorhanden sind:

* HTML-Startseiten
* getrennte CSS-Dateien pro Bereich
* getrennte JavaScript-Dateien pro Bereich
* Dokumentationsordner
* GitHub-/VS-Code-Workflow für Zusammenarbeit

Die fachliche Umsetzung von Login, Board, Contacts, Add Task, Storage, Drag & Drop und Validierung erfolgt schrittweise im Team.

## Ziel

Am Ende soll Join eine funktionierende Task-Management-App sein, in der Aufgaben erstellt, angezeigt, bearbeitet und organisiert werden können.

Wichtig ist neben der technischen Umsetzung auch die saubere Zusammenarbeit im Team und weniger Konflikte.
