# Git-Workflow für Join

## Grundregel

`main` ist die stabile gemeinsame Version. Auf `main` wird nicht direkt gearbeitet.

## Branches

Branch-Namen beschreiben Aufgabe oder Bereich, nicht die Person.

Gute Beispiele:

```txt
feature/project-setup
feature/login
feature/summary
feature/board
feature/add-task
feature/contacts
feature/responsive-layout
```

Schlechte Beispiele:

```txt
feature/roger
feature/contacts-marko
feature/kevin-board
```

## Täglicher Ablauf

```bash
git checkout main
git pull origin main
git checkout -b feature/board
```

Nach Änderungen:

```bash
git status
git add .
git commit -m "Add board layout"
git push -u origin feature/board
```

Danach auf GitHub einen Pull Request nach `main` erstellen.

## Vor jeder Arbeit

```bash
git checkout main
git pull origin main
```

## Wenn ein Feature fertig ist

1. Push auf GitHub.
2. Pull Request öffnen.
3. Team prüft kurz.
4. Merge nach `main`.
5. Feature-Branch löschen.

## Konfliktarme Regel

Gemeinsame Dateien nur nach Absprache ändern:

- `css/global.css`
- `css/layout.css`
- `js/storage.js`
- `js/main.js`
- `README.md`
