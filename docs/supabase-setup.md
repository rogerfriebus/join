# Supabase-Setup (Cloud)

Dieses Dokument beschreibt, wie Join die Supabase **Cloud** nutzt. In diesem
Sprint wird Supabase nur **strukturell vorbereitet** – es werden noch keine
echten Keys eingerichtet.

## Grundregeln

- Join nutzt **Supabase Cloud**. Es wird **nichts selbst installiert**.
- **Keine Secrets ins Repository.** Keine echten Keys, Passwörter oder Tokens
  committen, keine `.env`-Dateien mit echten Werten.
- Zugangsdaten (Project URL, anon key) werden lokal/über die Umgebung gehalten
  und später über die Angular-`environment`-Konfiguration eingebunden.
- **Gast-Login und eingeloggte User nutzen laut Kursvorgabe denselben
  Datenbestand.**

## Tabellenentwurf `contacts`

| Spalte       | Typ         | Constraints              |
| ------------ | ----------- | ------------------------ |
| `id`         | `uuid`      | Primary Key, `default gen_random_uuid()` |
| `name`       | `text`      | `not null`               |
| `email`      | `text`      | `not null`               |
| `phone`      | `text`      | `not null`               |
| `color`      | `text`      | `null`                   |
| `initials`   | `text`      | `null`                   |
| `created_at` | `timestamp` | Standard: `now()`        |
| `updated_at` | `timestamp` | Standard: `now()`        |

Das Frontend-Modell dazu liegt unter `src/app/core/models/contact.model.ts`
(camelCase: `color` / `initials` / `createdAt` / `updatedAt`).

### Beispiel-SQL

Beispiel ohne echte Daten und ohne Secrets:

```sql
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  color text,
  initials text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

## Aktueller Stand

Aktuell arbeitet die App mit Mock-/Dummy-Daten im `ContactService`. Die echte
Supabase-Anbindung erfolgt erst in einer späteren Aufgabe:
**Orange 4B – Supabase Cloud anbinden**.

## Dummy-Daten

- Für die Sprint-Abgabe mindestens **10 seriöse Kontakte** anlegen.
- Aktuell liegen 12 Mock-Kontakte im Service `src/app/core/services/contact.service.ts`.
- Diese Mock-Daten werden später durch echte Supabase-Daten ersetzt.
- Echte personenbezogene Daten dürfen **nicht** als Demo-Daten verwendet werden.

## Secret-Regeln

**Nicht ins Repository:**

- Supabase URL mit echtem Projektwert
- Supabase Anon Key
- Supabase Service Role Key
- `.env`-Dateien mit echten Werten
- Screenshots mit sichtbaren Keys

**Erlaubt:**

- Platzhalter
- Beispielnamen ohne echte personenbezogene Daten
- technische Dokumentation ohne echte Keys

## Lokale Konfiguration (später, Orange 4B)

Für Orange 4B muss festgelegt werden, wie die lokale Konfiguration erfolgt.
Mögliche Varianten:

- Angular-`environment`-Dateien mit Platzhaltern
- lokale, **nicht** getrackte Environment-Datei
- Konfiguration über die Deployment-Umgebung

In Sprint 1 gilt: **Keine echten Supabase-Zugangsdaten ins Repo.**

## Nächste Schritte (noch nicht in diesem Sprint)

1. Supabase-Projekt in der Cloud anlegen (durch das Team koordiniert).
2. Tabelle `contacts` laut obigem Entwurf erstellen.
3. Project URL und anon key **außerhalb des Repos** bereitstellen
   (Angular-`environment`, nicht eingecheckt).
4. `ContactService` von Mock-Daten auf Supabase-Aufrufe umstellen.
5. Row Level Security / Policies laut Kursvorgabe prüfen.

## Verantwortlichkeit

**Owner für Supabase-Setup:** Roger

Offene Fragen:

- Wer legt das Supabase-Projekt final an?
- Wer erhält Zugriff?
- Welche URL/Anon-Key-Konfiguration wird lokal genutzt?
- Welche Row-Level-Security-Regeln werden benötigt?
- Nutzen Gast-Login und User denselben Datenbestand?
