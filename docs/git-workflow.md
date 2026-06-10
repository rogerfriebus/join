
# Git-Workflow für das Join-Projekt

Diese Anleitung beschreibt, wie wir im Team mit GitHub und VS Code arbeiten.
Join ist ein Angular-Projekt; der hier beschriebene VS-Code-Workflow bleibt
unverändert gültig.

Ziel ist: Wir vermeiden Chaos, überschreiben uns nicht gegenseitig und übernehmen Änderungen kontrolliert in die gemeinsame Projektversion.

## Grundregel

Wir arbeiten nicht direkt auf `main`.

`main` ist unsere stabile gemeinsame Version. Neue Änderungen werden zuerst in einem eigenen Branch vorbereitet und danach per Pull Request in `main` übernommen.

## Standardablauf in VS Code

### 1. Auf `main` starten

Unten links in VS Code muss `main` stehen.

Falls dort ein anderer Branch steht, zuerst auf `main` wechseln.

Danach `main` synchronisieren, damit der aktuelle Stand von GitHub lokal vorhanden ist.

### 2. Neuen Branch erstellen

Für jede Aufgabe wird ein eigener Branch erstellt.

Beispiele:

```text
feature/login
feature/summary
feature/board
feature/add-task
feature/contacts
docs/update-git-workflow
```

Branch-Namen beschreiben die Aufgabe, nicht die Person.

Gut:

```text
feature/contacts
```

Nicht gut:

```text
feature/contacts-marko
```

### 3. Dateien ändern

Danach werden die passenden Dateien bearbeitet.

Beispiele:

```text
src/app/pages/board/
```

oder:

```text
src/app/pages/contacts/
```

Wichtig: Gemeinsame Dateien (z. B. `package.json`, `package-lock.json`,
`angular.json`, `src/app/app.routes.ts`) werden nur nach Absprache geändert.

### 4. Änderung committen

In VS Code links auf „Quellcodeverwaltung“ gehen.

Dort sieht man die geänderten Dateien.

Eine kurze Commit-Nachricht eintragen, zum Beispiel:

```text
Update login button text
```

Dann auf `Commit` klicken.

### 5. Branch veröffentlichen

Nach dem Commit auf `Branch veröffentlichen` oder `Sync Changes` klicken.

Damit wird der Branch zu GitHub hochgeladen.

### 6. Pull Request erstellen

In VS Code über „GitHub Pull Requests“ einen Pull Request erstellen.

Die Richtung muss sein:

```text
feature/... → main
```

Also: Der Feature-Branch wird in `main` übernommen.

### 7. Pull Request prüfen

Vor dem Merge prüfen:

* Stimmt die Richtung `feature/... → main`?
* Sind nur die erwarteten Dateien geändert?
* Gibt es keine Konflikte?
* Ist die Änderung verständlich beschrieben?

### 8. Pull Request mergen

Wenn alles passt, wird der Pull Request gemerged.

Danach ist die Änderung offiziell in `main`.

### 9. Branch löschen

Nach dem Merge kann der Branch gelöscht werden.

Dabei können sowohl der lokale Branch als auch der Remote-Branch auf GitHub gelöscht werden.

### 10. Zurück auf `main`

Nach dem Merge wieder auf `main` wechseln und synchronisieren.

Danach ist der eigene lokale Stand wieder sauber.

## Merksatz

```text
main ist die stabile gemeinsame Version.
feature/... ist ein Arbeitszweig für eine konkrete Aufgabe.
Änderungen kommen über Pull Request zurück nach main.
```
