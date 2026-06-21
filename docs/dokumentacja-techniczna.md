# EventHub — Dokumentacja Techniczna

## 1. Opis projektu

EventHub to aplikacja webowa umożliwiająca przeglądanie wydarzeń, rejestrację uczestników oraz zarządzanie wydarzeniami przez administratora. Aplikacja składa się z interfejsu użytkownika (SPA) oraz REST API.

---

## 2. Architektura rozwiązania

Projekt zbudowany jest jako **monorepo** zawierające dwa niezależne moduły:

```
eventhub/
├── client/   # Aplikacja frontendowa (React SPA)
└── server/   # Serwer backendowy (Express REST API)
```

### Schemat komunikacji

```
Przeglądarka (port 5173)
        │
        │  HTTP/JSON (fetch + JWT Bearer token)
        ▼
Serwer Express (port 3001)
        │
        │  Prisma ORM
        ▼
   SQLite (dev.db)
```

Podczas developmentu Vite proxy przekierowuje żądania `/api/*` z portu 5173 na 3001, dzięki czemu frontend i backend działają pod jednym origin.

### Frontend

| Technologia | Wersja | Rola |
|---|---|---|
| React | 18 | Biblioteka UI |
| TypeScript | 5 | Typowanie statyczne |
| Tailwind CSS | 3 | Style / RWD |
| Vite | 6 | Bundler i dev server |
| React Router | 7 | Routing SPA |

Struktura katalogów `client/src/`:

```
components/    # Navbar, EventCard, PrivateRoute, AdminRoute
context/       # AuthContext — globalny stan auth (token, user, role)
lib/           # apiFetch — wrapper na fetch z obsługą JWT i błędów
pages/         # Strony publiczne i panel admina
```

### Backend

| Technologia | Wersja | Rola |
|---|---|---|
| Node.js | ≥18 | Środowisko uruchomieniowe |
| Express | 5 | Framework HTTP |
| TypeScript | 5 | Typowanie statyczne |
| Prisma | 7 | ORM / migracje |
| SQLite (better-sqlite3) | — | Baza danych |
| bcrypt | 5 | Haszowanie haseł |
| jsonwebtoken | 9 | Generowanie i weryfikacja JWT |
| zod | 4 | Walidacja danych wejściowych |
| multer | 2 | Upload plików |

Struktura katalogów `server/src/`:

```
lib/           # prisma.ts (singleton klienta), jwt.ts (sign/verify)
middleware/    # auth.ts — requireUser, requireAdmin
routes/        # auth.ts, events.ts, registrations.ts, admin.ts
index.ts       # Punkt wejścia, montowanie middleware i routerów
```

---

## 3. Struktura bazy danych

Baza SQLite zarządzana przez Prisma ORM. Schemat w `server/prisma/schema.prisma`.

### Tabela `User`

| Kolumna | Typ | Opis |
|---|---|---|
| id | INT PK | Autoincrement |
| email | TEXT UNIQUE | Adres email uczestnika |
| passwordHash | TEXT | Hash bcrypt (10 rund) |
| name | TEXT | Imię i nazwisko |
| createdAt | DATETIME | Data rejestracji |

### Tabela `Event`

| Kolumna | Typ | Opis |
|---|---|---|
| id | INT PK | Autoincrement |
| title | TEXT | Nazwa wydarzenia |
| description | TEXT | Opis |
| location | TEXT | Miejsce |
| date | DATETIME | Data i godzina |
| capacity | INT | Maksymalna liczba uczestników |
| imageUrl | TEXT? | Ścieżka do zdjęcia (opcjonalne) |
| createdAt | DATETIME | Data utworzenia |

### Tabela `Registration`

| Kolumna | Typ | Opis |
|---|---|---|
| id | INT PK | Autoincrement |
| userId | INT FK→User | Uczestnik |
| eventId | INT FK→Event | Wydarzenie |
| createdAt | DATETIME | Data zapisu |

Ograniczenie: `UNIQUE(userId, eventId)` — jeden uczestnik nie może zapisać się dwa razy na to samo wydarzenie.

### Tabela `Admin`

| Kolumna | Typ | Opis |
|---|---|---|
| id | INT PK | Autoincrement |
| email | TEXT UNIQUE | Email administratora |
| passwordHash | TEXT | Hash bcrypt |

Konto admina tworzone przez seed (`npm run seed`).

### Diagram relacji

```
User ──< Registration >── Event
Admin (niezależna tabela)
```

---

## 4. API Endpoints

### Publiczne (bez autoryzacji)

| Metoda | Ścieżka | Opis |
|---|---|---|
| POST | /api/auth/register | Rejestracja uczestnika |
| POST | /api/auth/login | Logowanie uczestnika, zwraca JWT |
| GET | /api/events | Lista wydarzeń (parametry: `search`, `date`) |
| GET | /api/events/:id | Szczegóły wydarzenia |

### Chronione uczestnikiem (`Authorization: Bearer <token>`)

| Metoda | Ścieżka | Opis |
|---|---|---|
| POST | /api/events/:id/register | Zapis na wydarzenie |
| DELETE | /api/events/:id/register | Wypisanie się |
| GET | /api/me/registrations | Moje zapisy |

### Panel admina (`Authorization: Bearer <admin-token>`)

| Metoda | Ścieżka | Opis |
|---|---|---|
| POST | /api/admin/login | Logowanie admina |
| GET | /api/admin/events | Lista wydarzeń z liczbą uczestników |
| POST | /api/admin/events | Tworzenie wydarzenia |
| PUT | /api/admin/events/:id | Edycja wydarzenia |
| DELETE | /api/admin/events/:id | Usunięcie wydarzenia |
| GET | /api/admin/events/:id/participants | Lista uczestników |
| POST | /api/admin/events/:id/image | Upload zdjęcia (multipart/form-data) |

---

## 5. Bezpieczeństwo

- **Hasła** przechowywane jako hashe bcrypt (10 rund saltowania)
- **JWT** z osobnymi sekretami dla uczestników i admina, ważność 24h
- **CORS** ograniczony do `http://localhost:5173`
- **Upload plików** — tylko `image/*`, max 5 MB, losowa nazwa pliku (bez oryginału)
- **Walidacja** wszystkich danych wejściowych przez Zod na każdym endpointcie
- **Middleware** `requireUser` i `requireAdmin` weryfikują token przed każdym chronionym endpointem

---

## 6. Uruchomienie lokalne

Szczegółowa instrukcja w pliku `README.md` w głównym katalogu projektu.

Wymagania: Node.js ≥ 18, npm ≥ 9.

```bash
git clone https://github.com/kacwojdev/eventhub
cd eventhub
npm install
cd client && npm install && cd ..
cd server && npm install && npx prisma migrate dev --name init && npm run seed && cd ..
npm run dev
```
