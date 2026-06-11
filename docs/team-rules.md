# Team-Regeln für das Join-Projekt

Join ist ein **Angular-Projekt** (SPA). Diese Regeln helfen uns, im Team sauber
zusammenzuarbeiten und Merge-Konflikte zu vermeiden.

## Angular und Branches

Angular hilft uns, die Arbeit besser aufzuteilen, weil Funktionen in
Komponenten, Seiten, Services und Layout-Bereiche getrennt werden können.

Trotzdem arbeiten wir weiterhin mit Branches.

Warum?

- `main` bleibt unsere stabile gemeinsame Version.
- Ein Feature-Branch schützt `main` vor unfertigen Änderungen.
- Pull Requests machen Änderungen sichtbar und prüfbar.
- Auch in Angular gibt es gemeinsame Dateien, die mehrere Teammitglieder
  betreffen können.

Kurz gesagt: **Angular trennt die Arbeit fachlich, Git-Branches schützen `main`
organisatorisch.** Das eine ersetzt das andere nicht.

Die Aussage „Wenn wir mit Angular arbeiten, brauchen wir keine Branches, weil
jeder in seinem eigenen Bereich arbeitet" ist nur halb richtig: Die fachliche
Aufteilung über Komponenten stimmt – sie macht Branches und Pull Requests aber
nicht überflüssig.

Beispiele für gemeinsame Dateien:

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

## 1. Nicht direkt auf `main` arbeiten

`main` ist unsere stabile gemeinsame Projektversion. Neue Änderungen werden
immer zuerst in einem eigenen Feature-Branch vorbereitet.

## 2. Branch-Namen beschreiben Aufgaben

Branch-Namen enthalten **keine Personennamen**.

Gut:

```text
feature/contacts
feature/contacts-detail
feature/layout-shell
chore/angular-project-setup
docs/update-readme
```

Nicht gut:

```text
feature/contacts-marko
feature/board-kevin
feature/login-roger
```

Wer an welcher Aufgabe arbeitet, klären wir über Absprache oder
`docs/task-split.md`, nicht über den Branch-Namen.

## 3. Feature-Branches und getrennte Bereiche

Jeder Aufgabenbereich hat eigene Komponenten/Ordner unter `src/app/`.

Beispiele:

```text
Contacts:   src/app/pages/contacts/
Board:      src/app/pages/board/
Add Task:   src/app/pages/add-task/
Summary:    src/app/pages/summary/
Layout:     src/app/layout/ (header, navbar, footer, shell)
```

So vermeiden wir, dass mehrere Personen gleichzeitig dieselbe Datei ändern.

## 4. Gemeinsame Dateien nur nach Absprache ändern

Diese Dateien betreffen das ganze Projekt und werden nur **koordiniert**
geändert:

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

Besonders `package.json`, `package-lock.json` und `angular.json` bitte nur nach
Absprache anfassen – sonst gibt es schnell Konflikte bei Dependencies und Build.

## 5. Kleine Pull Requests statt großer Sammeländerungen

Lieber kleine, verständliche Änderungen als riesige Pull Requests.

## 6. Vor dem Merge kurz prüfen

```text
Sind die richtigen Dateien geändert?
Läuft der Build (npm run build)?
Gibt es Konflikte?
Ist die Änderung verständlich beschrieben?
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
