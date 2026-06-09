
# Team-Regeln für das Join-Projekt

Diese Regeln helfen uns, im Team sauber zusammenzuarbeiten und Merge-Konflikte zu vermeiden.

## 1. Nicht direkt auf `main` arbeiten

`main` ist unsere stabile gemeinsame Projektversion.

Neue Änderungen werden immer zuerst in einem eigenen Branch vorbereitet.

## 2. Branch-Namen beschreiben Aufgaben

Branch-Namen enthalten keine Personennamen.

Gut:

```text
feature/board
feature/contacts
feature/login
docs/update-readme
```

Nicht gut:

```text
feature/board-kevin
feature/contacts-marko
feature/login-roger
```

Wer an welcher Aufgabe arbeitet, klären wir über Absprache oder Aufgabenliste, nicht über den Branch-Namen.

## 3. Möglichst getrennte Dateien bearbeiten

Jeder Aufgabenbereich hat eigene Dateien.

Beispiele:

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

So vermeiden wir, dass mehrere Personen gleichzeitig dieselbe Datei ändern.

## 4. Gemeinsame Dateien nur nach Absprache ändern

Diese Dateien betreffen mehrere Bereiche und werden nur koordiniert geändert:

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

Wenn eine dieser Dateien geändert werden muss, sprechen wir das vorher kurz ab.

## 5. Kleine Pull Requests statt große Sammeländerungen

Lieber kleine, verständliche Änderungen als riesige Pull Requests.

Gut:

```text
Login-Button korrigieren
Board-Grundlayout erstellen
Contacts-Seite vorbereiten
README ergänzen
```

Nicht gut:

```text
Alles auf einmal ändern
```

## 6. Vor dem Merge kurz prüfen

Vor dem Merge prüfen wir:

```text
Sind die richtigen Dateien geändert?
Gibt es Konflikte?
Funktioniert die Seite noch?
Ist die Änderung verständlich?
```

## 7. Nach dem Merge Branch löschen

Wenn ein Pull Request gemerged wurde, wird der zugehörige Branch gelöscht.

Danach wieder auf `main` wechseln und synchronisieren.

## Merksatz

```text
Erst abstimmen, dann ändern.
Erst Branch, dann Commit.
Erst Pull Request, dann Merge.
```
