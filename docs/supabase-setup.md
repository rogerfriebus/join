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
| `id`         | `uuid`      | Primary Key              |
| `name`       | `text`      | `not null`               |
| `email`      | `text`      | `not null`               |
| `phone`      | `text`      | `not null`               |
| `created_at` | `timestamp` | Standard: `now()`        |
| `updated_at` | `timestamp` | Standard: `now()`        |

Das Frontend-Modell dazu liegt unter `src/app/core/models/contact.model.ts`
(camelCase: `createdAt` / `updatedAt`).

## Dummy-Daten

- Für die Sprint-Abgabe mindestens **10 seriöse Kontakte** anlegen.
- Aktuell liegen 10 Mock-Kontakte im Service `src/app/core/services/contact.service.ts`.
- Diese Mock-Daten werden später durch echte Supabase-Daten ersetzt.

## Nächste Schritte (noch nicht in diesem Sprint)

1. Supabase-Projekt in der Cloud anlegen (durch das Team koordiniert).
2. Tabelle `contacts` laut obigem Entwurf erstellen.
3. Project URL und anon key **außerhalb des Repos** bereitstellen
   (Angular-`environment`, nicht eingecheckt).
4. `ContactService` von Mock-Daten auf Supabase-Aufrufe umstellen.
5. Row Level Security / Policies laut Kursvorgabe prüfen.
