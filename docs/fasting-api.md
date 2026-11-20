# Fasting Timer API v1 Specification

Dokumentacja techniczna interfejsu REST/JSON backendu **Timer IQ** dla aplikacji natywnej **Fasting Timer (Android)**.

- **Wersja API:** `v1`
- **Data wdrożenia schematu:** 20.11.2026
- **Baza danych / Auth:** Supabase (współdzielony projekt z Timer IQ)
- **Format danych:** JSON, daty w formacie ISO 8601 UTC (np. `2026-11-20T08:15:00.000Z`)

---

## 1. Architektura i Bezpieczeństwo

### 1.1. Konfiguracja bazowego adresu
Adres bazowy API:
```text
https://<TWOJA_DOMENA_TIMERIQ>/api/v1/fasting
```
*Uwaga dla klienta Android:* Domena nie jest wpisywana na stałe w kodzie źródłowym, lecz przekazywana w konfiguracji aplikacji (np. `BuildConfig.API_BASE_URL`).

### 1.2. Uwierzytelnianie (Supabase Auth)
Każde zapytanie do zasobów użytkownika musi zawierać nagłówek autoryzacyjny z tokenem JWT uzyskanym po zalogowaniu w Supabase Auth:
```http
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
Accept: application/json
```

**Zasady bezpieczeństwa serwera:**
1. Identyfikator użytkownika (`user.id`) jest **zawsze pobierany z sieciowo zweryfikowanego tokenu JWT** (`supabase.auth.getUser(token)`). Nigdy nie ufa się wartości `user_id` z ciała żądania ani parametrów query.
2. Zapytania do bazy danych są wykonywane przez per-request instancję klienta Supabase z przekazanym tokenem JWT użytkownika w nagłówkach (`Authorization: Bearer <jwt>`). Dzięki temu **Row Level Security (RLS)** jest aktywne i weryfikuje każde zapytanie w Postgresie (`(SELECT auth.uid()) = user_id`).
3. Klucz `service_role` **nigdy nie jest używany** do zwykłych operacji CRUD użytkownika i nigdy nie może trafić do aplikacji mobilnej.
4. Wszystkie odpowiedzi zawierające dane użytkownika mają nagłówek:
   ```http
   Cache-Control: no-store
   ```
5. Błędy serwera nie ujawniają stack trace'ów, haseł ani struktur wewnętrznych.

### 1.3. Ograniczenia i limity
- Maksymalny rozmiar pojedynczego żądania HTTP: **512 KiB** (nagłówek `413 Payload Too Large` przy przekroczeniu).
- Maksymalna liczba mutacji w pojedynczym wywołaniu `/sync`: **100**.
- Ścisła walidacja pól (Zod `.strict()`) — pola nieznane zwracają kod `422 Unprocessable Entity`.

---

## 2. Standard Odpowiedzi i Obsługa Błędów

### Format sukcesu
```json
{
  "data": { ... }
}
```
W przypadku list / kolekcji:
```json
{
  "data": [ ... ]
}
```

### Format błędu
Zgodny, ujednolicony format dla wszystkich kodów błędów:
```json
{
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Czytelny dla programisty opis błędu",
    "details": null
  }
}
```

### Kody błędów HTTP
| Kod HTTP | Kod API (`error.code`) | Znaczenie |
|---|---|---|
| `400` | `BAD_REQUEST` | Niepoprawny format JSON w ciele żądania |
| `401` | `UNAUTHORIZED` | Brak nagłówka `Authorization`, brak schematu `Bearer` lub token wygasł / jest nieprawidłowy |
| `403` | `FORBIDDEN` | Brak uprawnień do zasobu |
| `404` | `NOT_FOUND` | Żądany rekord nie istnieje, nie należy do użytkownika lub został usunięty (`deleted_at IS NOT NULL`) |
| `409` | `CONFLICT` | Konflikt wersji optymistycznej (`base_revision` nie zgadza się z aktualnym stanem w bazie) |
| `409` | `ACTIVE_SESSION_CONFLICT` | Próba rozpoczęcia drugiego aktywnego postu (dozwolony jest tylko jeden aktywny post na konto) |
| `413` | `PAYLOAD_TOO_LARGE` | Rozmiar ciała żądania przekracza 512 KiB |
| `422` | `VALIDATION_ERROR` | Błąd walidacji schematu Zod (np. zły zakres wagi, nieznane pole, data końca przed początkiem) |
| `422` | `CHECK_VIOLATION` | Naruszenie ograniczenia integralności bazy danych |
| `500` | `INTERNAL_SERVER_ERROR` | Nieoczekiwany błąd serwera (zamaskowany, bez wycieku danych) |
| `503` | `SERVER_NOT_CONFIGURED` | Brak zmiennych środowiskowych Supabase na serwerze |

---

## 3. Modele Danych

### 3.1. `fasting_settings`
Ustawienia użytkownika. Identyfikatorem jest `user_id` zalogowanego użytkownika.
```typescript
interface FastingSettings {
  user_id: string; // UUID
  goal_hours: 12 | 14 | 16 | 18 | 20; // Domyślnie 16
  profile_age: number | null; // 18 - 100
  profile_sex: 'male' | 'female' | null;
  height_cm: number | null; // 120.0 - 230.0
  auto_weight_scan: boolean; // Domyślnie true
  theme: 'forest' | 'sunset' | 'night' | 'amoled' | 'ocean' | 'violet'; // Domyślnie forest
  timezone: string; // Domyślnie 'Europe/Warsaw'
  pomodoro_preferences: Record<string, unknown>; // JSON <= 16 KB
  interval_preferences: Record<string, unknown>; // JSON <= 16 KB
  revision: number; // Sterowana przez serwer
  updated_at: string; // ISO 8601 UTC
}
```

### 3.2. `fasting_sessions`
Sesje postu przerywanego.
```typescript
interface FastingSession {
  id: string; // UUID wygenerowane stabilnie przez klienta
  user_id: string; // UUID
  started_at: string; // ISO 8601 UTC
  ended_at: string | null; // null dla postu aktywnego; data zakończenia dla completed/cancelled
  goal_hours: 12 | 14 | 16 | 18 | 20;
  status: 'active' | 'completed' | 'cancelled';
  estimated_kcal: number | null; // >= 0
  deleted_at: string | null; // Tombstone usuwania
  revision: number;
  created_at: string;
  updated_at: string;
}
```
*Ograniczenie unikalności:* Tylko jeden wiersz per `user_id` z `status = 'active'` oraz `deleted_at IS NULL`.

### 3.3. `fasting_weight_entries`
Historia pomiarów wagi ciała (bez zdjęć, bez surowych tokenów zewnętrznych).
```typescript
interface FastingWeightEntry {
  id: string; // UUID wygenerowane stabilnie przez klienta
  user_id: string;
  measured_at: string; // ISO 8601 UTC
  weight_kg: number; // 30.00 - 350.00
  source: 'manual' | 'xiaomi' | 'health_connect';
  external_ref_hash: string | null; // Opcjonalny skrót SHA-256 (64 znaki hex)
  deleted_at: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
}
```

### 3.4. `fasting_pomodoro_segments`
Rzeczywiste przedziały skupienia (również niepełne sesje).
```typescript
interface FastingPomodoroSegment {
  id: string; // UUID
  user_id: string;
  started_at: string; // ISO 8601 UTC
  ended_at: string; // ISO 8601 UTC (ended_at > started_at)
  preset: 'classic' | 'custom' | 'focusOnly';
  deleted_at: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
}
```

### 3.5. `fasting_interval_sessions`
Zakończone / przerwane programy treningowe interwałowe.
```typescript
interface FastingIntervalSession {
  id: string; // UUID
  user_id: string;
  started_at: string;
  ended_at: string;
  status: 'completed' | 'cancelled';
  preset: 'hiit' | 'tabata' | 'strength' | 'treadmill' | 'custom';
  rounds: number; // 1 - 100
  sets: number; // 1 - 30
  work_ms: number; // >= 0
  configuration: Record<string, unknown>; // JSON <= 16 KB
  deleted_at: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
}
```

### 3.6. `fasting_interval_segments`
Rzeczywisty czas aktywności fizycznej (przydatny do statystyk nawet przy resecie).
```typescript
interface FastingIntervalSegment {
  id: string; // UUID
  user_id: string;
  started_at: string;
  ended_at: string; // ended_at > started_at
  preset: 'hiit' | 'tabata' | 'strength' | 'treadmill' | 'custom';
  deleted_at: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
}
```

### 3.7. `fasting_change_log`
Dziennik zmian do synchronizacji przyrostowej (append-only, generowany przez wyzwalacz bazy).
```typescript
interface FastingChangeLogItem {
  seq: string; // UWAGA: BigInt przekazywany jako STRING w JSON
  entity: 'fasting_settings' | 'fasting_sessions' | 'fasting_weight_entries' | 'fasting_pomodoro_segments' | 'fasting_interval_sessions' | 'fasting_interval_segments';
  id: string;
  revision: number;
  deleted: boolean;
  data: Record<string, unknown>;
}
```

---

## 4. Szczegółowy Wykaz Endpointów

### 4.1. Health Check
Sprawdzenie dostępności modułu fasting (publiczne).
- **Metoda:** `GET`
- **Ścieżka:** `/health`
- **Odpowiedź 200:**
```json
{
  "ok": true,
  "api": "fasting",
  "version": 1
}
```

---

### 4.2. Ustawienia (`/settings`)

#### `GET /settings`
Pobiera ustawienia użytkownika. Jeśli rekord jeszcze nie istnieje w bazie, zwraca wartości domyślne.
- **Odpowiedź 200:**
```json
{
  "data": {
    "user_id": "92f703e8-5ee4-4be6-a19e-e8b9ca2e1181",
    "goal_hours": 16,
    "profile_age": 30,
    "profile_sex": "male",
    "height_cm": 180.0,
    "auto_weight_scan": true,
    "theme": "forest",
    "timezone": "Europe/Warsaw",
    "pomodoro_preferences": { "work_min": 25, "break_min": 5 },
    "interval_preferences": {},
    "revision": 1,
    "updated_at": "2026-11-20T08:00:00.000Z"
  }
}
```

#### `PUT /settings`
Tworzy lub aktualizuje ustawienia użytkownika z optymistyczną kontrolą wersji.
- **Żądanie:**
```json
{
  "base_revision": 1,
  "theme": "amoled",
  "goal_hours": 18
}
```
- **Zasada działania i odporność offline:**
  - Jeśli użytkownik nie ma jeszcze wiersza w tabeli `fasting_settings` w bazie, serwer **automatycznie inicjalizuje rekord** wartościami domyślnymi połączonymi z przesłanymi danymi (nie zwraca błędu 404).
  - Dla istniejących rekordów serwer weryfikuje `base_revision`. W przypadku niezgodności z bieżącą rewizją serwera zwracany jest kod `409 Conflict` z aktualnym stanem `current_data`.
  - Pole `base_revision` jest opcjonalne (domyślnie `0`).
- **Odpowiedź 200:**
```json
{
  "data": {
    "user_id": "92f703e8-5ee4-4be6-a19e-e8b9ca2e1181",
    "goal_hours": 18,
    "theme": "amoled",
    "revision": 2,
    "updated_at": "2026-11-20T08:10:00.000Z"
  }
}
```

---

### 4.3. Sesje Postu (`/sessions`)

#### `GET /sessions?limit=50&cursor=...`
Lista sesji posortowana malejąco po `started_at`.
- **Parametry:**
  - `limit`: opcjonalny (1 - 100, domyślnie 50)
  - `cursor`: opcjonalny (wartość `started_at` do stronicowania kluczowego)
- **Odpowiedź 200:**
```json
{
  "data": [
    {
      "id": "e43b1712-4217-48f8-8a21-93c4e7240c20",
      "user_id": "92f703e8-5ee4-4be6-a19e-e8b9ca2e1181",
      "started_at": "2026-11-20T08:00:00.000Z",
      "ended_at": null,
      "goal_hours": 16,
      "status": "active",
      "estimated_kcal": null,
      "deleted_at": null,
      "revision": 1,
      "created_at": "2026-11-20T08:00:00.000Z",
      "updated_at": "2026-11-20T08:00:00.000Z"
    }
  ]
}
```

#### `POST /sessions`
Utworzenie nowej sesji z identyfikatorem wygenerowanym przez klienta (UUID v4).
- **Żądanie:**
```json
{
  "id": "e43b1712-4217-48f8-8a21-93c4e7240c20",
  "started_at": "2026-11-20T08:00:00.000Z",
  "goal_hours": 16,
  "status": "active"
}
```
- **Odpowiedź 201:** Zwraca utworzoną sesję z `revision: 1`.
- **Konflikt (409):** Jeśli użytkownik ma już aktywny post, zwraca `ACTIVE_SESSION_CONFLICT`:
```json
{
  "error": {
    "code": "ACTIVE_SESSION_CONFLICT",
    "message": "An active fasting session already exists for this account"
  }
}
```

#### `GET /sessions/:id`
Pobranie pojedynczej sesji.

#### `PATCH /sessions/:id`
Zakończenie lub modyfikacja sesji. Wymaga `base_revision`.
- **Żądanie:**
```json
{
  "base_revision": 1,
  "status": "completed",
  "ended_at": "2026-11-20T24:00:00.000Z",
  "estimated_kcal": 420.5
}
```
- **Odpowiedź 200:** Zwraca zaktualizowaną sesję z `revision: 2`.

#### `DELETE /sessions/:id`
Soft-delete (ustawienie `deleted_at`).
- **Żądanie:**
```json
{
  "base_revision": 2
}
```
- **Odpowiedź 200:**
```json
{
  "data": {
    "id": "e43b1712-4217-48f8-8a21-93c4e7240c20",
    "deleted": true,
    "revision": 3
  }
}
```

---

### 4.4. Pomiary Wagi (`/weights`)

#### `GET /weights?limit=50&cursor=...`
Lista wpisów posortowana malejąco po `measured_at`.

#### `POST /weights`
Dodanie pomiaru wagi (bez zdjęć!).
- **Żądanie:**
```json
{
  "id": "76ace6ed-f15c-493c-a4c6-5f0531e5bbdb",
  "measured_at": "2026-11-20T07:10:00.000Z",
  "weight_kg": 145.8,
  "source": "xiaomi"
}
```
- **Odpowiedź 201:**
```json
{
  "data": {
    "id": "76ace6ed-f15c-493c-a4c6-5f0531e5bbdb",
    "user_id": "92f703e8-5ee4-4be6-a19e-e8b9ca2e1181",
    "measured_at": "2026-11-20T07:10:00.000Z",
    "weight_kg": 145.8,
    "source": "xiaomi",
    "external_ref_hash": null,
    "deleted_at": null,
    "revision": 1,
    "created_at": "2026-11-20T07:10:05.000Z",
    "updated_at": "2026-11-20T07:10:05.000Z"
  }
}
```

#### `PATCH /weights/:id`
- **Żądanie:**
```json
{
  "base_revision": 1,
  "weight_kg": 145.6
}
```
- **Odpowiedź 200:** Zwraca zaktualizowany pomiar z `revision: 2`.

#### `DELETE /weights/:id`
- **Żądanie:**
```json
{
  "base_revision": 2
}
```
- **Odpowiedź 200:** Soft-delete ze statusem sukcesu i nową rewizją.

---

### 4.5. Pomodoro i Interwały
Identyczny spójny interfejs CRUD dla segmentów Pomodoro i programów interwałowych:
- `GET/POST /pomodoro/segments` oraz `GET/PATCH/DELETE /pomodoro/segments/:id`
- `GET/POST /intervals/sessions` oraz `GET/PATCH/DELETE /intervals/sessions/:id`
- `GET/POST /intervals/segments` oraz `GET/PATCH/DELETE /intervals/segments/:id`

---

### 4.6. Synchronizacja Offline-First (`/sync`)

#### `POST /sync` (Wysyłanie zmian lokalnych)
Wysyła paczkę operacji offline z telefonu na serwer. Maksymalnie 100 operacji w partii.
- **Żądanie:**
```json
{
  "mutations": [
    {
      "entity": "fasting_weight_entries",
      "id": "76ace6ed-f15c-493c-a4c6-5f0531e5bbdb",
      "base_revision": 0,
      "operation": "create",
      "data": {
        "measured_at": "2026-11-20T07:10:00.000Z",
        "weight_kg": 145.8,
        "source": "xiaomi"
      }
    },
    {
      "entity": "fasting_settings",
      "id": "92f703e8-5ee4-4be6-a19e-e8b9ca2e1181",
      "base_revision": 2,
      "operation": "update",
      "data": {
        "theme": "amoled"
      }
    },
    {
      "entity": "fasting_sessions",
      "id": "e43b1712-4217-48f8-8a21-93c4e7240c20",
      "base_revision": 1,
      "operation": "delete"
    }
  ]
}
```

- **Odpowiedź 200:** Raport statusu dla **każdej** mutacji:
```json
{
  "results": [
    {
      "id": "76ace6ed-f15c-493c-a4c6-5f0531e5bbdb",
      "status": "applied",
      "revision": 1
    },
    {
      "id": "92f703e8-5ee4-4be6-a19e-e8b9ca2e1181",
      "status": "conflict",
      "current_revision": 3,
      "current_data": {
        "user_id": "92f703e8-5ee4-4be6-a19e-e8b9ca2e1181",
        "theme": "violet",
        "revision": 3
      }
    },
    {
      "id": "e43b1712-4217-48f8-8a21-93c4e7240c20",
      "status": "applied",
      "revision": 2
    }
  ]
}
```

**Statusy mutacji:**
- `applied`: Operacja została pomyślnie zapisana, zwraca nową `revision`.
- `already_applied`: Identyczny rekord lub usunięcie zostało już wcześniej wykonane (idempotencja).
- `conflict`: Niezgodność rewizji (`current_revision != base_revision`) lub próba utworzenia drugiego aktywnego postu. Serwer zwraca `current_revision` i `current_data`.
- `not_found`: Rekord nie istnieje na serwerze przy operacji `update` lub `delete`.
- `validation_error`: Błąd schematu danych pojedynczej mutacji.

---

#### `GET /sync?cursor=0&limit=100` (Pobieranie przyrostowe zmian)
Pobiera dziennik zmian od wskazanego `cursor` (numer `seq`).
- **Parametry:**
  - `cursor`: string liczby `seq` (początkowo `'0'`)
  - `limit`: 1 - 500 (domyślnie 100)
- **Odpowiedź 200:**
```json
{
  "changes": [
    {
      "seq": "101",
      "entity": "fasting_weight_entries",
      "id": "76ace6ed-f15c-493c-a4c6-5f0531e5bbdb",
      "revision": 1,
      "deleted": false,
      "data": {
        "id": "76ace6ed-f15c-493c-a4c6-5f0531e5bbdb",
        "measured_at": "2026-11-20T07:10:00.000Z",
        "weight_kg": 145.8,
        "source": "xiaomi"
      }
    },
    {
      "seq": "102",
      "entity": "fasting_sessions",
      "id": "e43b1712-4217-48f8-8a21-93c4e7240c20",
      "revision": 2,
      "deleted": true,
      "data": {
        "id": "e43b1712-4217-48f8-8a21-93c4e7240c20",
        "deleted_at": "2026-11-20T08:15:00.000Z"
      }
    }
  ],
  "next_cursor": "102",
  "has_more": false
}
```
*Kluczowe:* Wartość `seq` oraz `next_cursor` są **zawsze stringami** w JSON, co chroni przed utratą precyzji w 64-bitowych liczbach Postgresa.

---

### 4.7. Bootstrap Nowego Urządzenia (`GET /bootstrap`)
Pobiera pełny stan konta dla pierwszego uruchomienia aplikacji na nowym telefonie.
- **Ścieżka:** `/bootstrap`
- **Odpowiedź 200:**
```json
{
  "data": {
    "sync_cursor": "102",
    "settings": { ... },
    "sessions": [ ... ],
    "weights": [ ... ],
    "pomodoro_segments": [ ... ],
    "interval_sessions": [ ... ],
    "interval_segments": [ ... ]
  }
}
```
**Gwarancja spójności:** Serwer pobiera `sync_cursor` (najwyższy `seq` z `fasting_change_log`) **przed** odczytem migawki tabel. Dzięki temu urządzenie po zapisaniu migawki wznawia synchronizację od `sync_cursor`, nie gubiąc żadnych równoległych zmian.

---

## 5. Przewodnik Integracji dla Klienta Android

### 5.1. Logowanie przez Supabase Auth
W aplikacji Android użyj oficjalnego SDK Supabase dla Kotlina:
```kotlin
val supabase = createSupabaseClient(
    supabaseUrl = BuildConfig.SUPABASE_URL,
    supabaseKey = BuildConfig.SUPABASE_ANON_KEY
) {
    install(Auth)
}

// Logowanie użytkownika:
supabase.auth.signInWith(Email) {
    email = userEmail
    password = userPassword
}

// Pobranie tokenu do nagłówka:
val accessToken = supabase.auth.currentAccessTokenOrNull()
```

### 5.2. Cykl synchronizacji offline
1. **Lokalny zapis:** Telefon generuje własne `UUID.randomUUID()` dla każdego nowego rekordu (`session`, `weight`, `segment`) i zapisuje w lokalnej bazie Room z `base_revision = 0` oraz flagą `is_dirty = true`.
2. **Wysłanie do chmury:** Gdy dostępne jest połączenie z Internetem, aplikacja pobiera paczkę do 100 niezesynchronizowanych mutacji i wywołuje `POST /api/v1/fasting/sync`.
3. **Aktualizacja rewizji:** Dla każdego wyniku `applied` telefon aktualizuje lokalną `revision` na serwerową i czyści flagę `is_dirty`.
4. **Rozstrzyganie konfliktów (`conflict`):**
   - Jeśli serwer zwrócił `conflict`, telefon porównuje `current_data` z lokalnymi zmianami (np. nowszy timestamp wygrywa lub interaktywne zapytanie użytkownika) i ponawia próbę z zaktualizowanym `base_revision`.
5. **Pobranie zmian z serwera:** Wywołaj `GET /api/v1/fasting/sync?cursor=<last_saved_cursor>`. Dla każdego wpisu zaaplikuj stan w bazie Room (uwzględniając pole `deleted`). Zapisz nowy `next_cursor`.
