# EventHub — Design Spec

**Date:** 2026-06-20  
**Project:** EventHub — aplikacja do zarządzania wydarzeniami  
**Stack:** React + TypeScript + Tailwind CSS (frontend), Express + TypeScript + Prisma + SQLite (backend)

---

## 1. Architektura ogólna

Monorepo z dwoma folderami:

```
eventhub/
├── client/       # React + TypeScript + Tailwind CSS (Vite)
├── server/       # Express + TypeScript + Prisma + SQLite
├── package.json  # root scripts: dev, build
└── README.md
```

- Frontend: port `5173` (Vite dev server)
- Backend: port `3001` (Express)
- Lokalnie oba procesy startują jedną komendą `npm run dev` przez `concurrently`
- Produkcja: Vite buduje statyczne pliki, Express je serwuje

---

## 2. Model danych (SQLite via Prisma)

### User
| Pole | Typ | Uwagi |
|------|-----|-------|
| id | Int (PK) | autoincrement |
| email | String | unique |
| passwordHash | String | bcrypt |
| name | String | |
| createdAt | DateTime | |

### Event
| Pole | Typ | Uwagi |
|------|-----|-------|
| id | Int (PK) | autoincrement |
| title | String | |
| description | String | |
| location | String | |
| date | DateTime | |
| capacity | Int | max liczba uczestników |
| imageUrl | String? | opcjonalne |
| createdAt | DateTime | |

### Registration
| Pole | Typ | Uwagi |
|------|-----|-------|
| id | Int (PK) | autoincrement |
| userId | Int | FK → User |
| eventId | Int | FK → Event |
| createdAt | DateTime | |

Constraint: unique `(userId, eventId)` — jeden użytkownik nie zapisuje się dwa razy.

### Admin
| Pole | Typ | Uwagi |
|------|-----|-------|
| id | Int (PK) | autoincrement |
| email | String | unique |
| passwordHash | String | bcrypt |

Seedowany przy pierwszym uruchomieniu (`npm run seed`). Jeden rekord.

---

## 3. API Endpoints

### Publiczne (bez auth)
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| POST | `/api/auth/register` | Rejestracja uczestnika |
| POST | `/api/auth/login` | Logowanie uczestnika, zwraca JWT |
| GET | `/api/events` | Lista wydarzeń (filtrowanie: tytuł, data) |
| GET | `/api/events/:id` | Szczegóły wydarzenia |

### Chronione uczestnikiem (JWT)
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| POST | `/api/events/:id/register` | Zapis na wydarzenie |
| DELETE | `/api/events/:id/register` | Wypisanie się |
| GET | `/api/me/registrations` | Moje zapisy |

### Panel admina (JWT z rolą `admin`)
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| POST | `/api/admin/login` | Logowanie admina |
| GET | `/api/admin/events` | Lista wydarzeń z liczbą uczestników |
| POST | `/api/admin/events` | Tworzenie wydarzenia |
| PUT | `/api/admin/events/:id` | Edycja wydarzenia |
| DELETE | `/api/admin/events/:id` | Usunięcie wydarzenia |
| GET | `/api/admin/events/:id/participants` | Lista uczestników |
| POST | `/api/admin/events/:id/image` | Upload obrazka (multer) |

JWT trzymany w `localStorage`, wysyłany w nagłówku `Authorization: Bearer <token>`.

---

## 4. Frontend — trasy i komponenty

### Publiczne (bez logowania)
| Trasa | Opis |
|-------|------|
| `/` | Strona główna: hero section + lista nadchodzących wydarzeń |
| `/events` | Pełna lista wydarzeń z filtrowaniem (tytuł, data) |
| `/events/:id` | Szczegóły wydarzenia + przycisk zapisu |
| `/login` | Logowanie uczestnika |
| `/register` | Rejestracja uczestnika |

### Chronione uczestnikiem
| Trasa | Opis |
|-------|------|
| `/my-registrations` | Moje zapisy z możliwością wypisania się |

### Panel admina
| Trasa | Opis |
|-------|------|
| `/admin/login` | Osobna strona logowania admina |
| `/admin/events` | Tabela wydarzeń z akcjami edytuj/usuń |
| `/admin/events/new` | Formularz tworzenia wydarzenia |
| `/admin/events/:id/edit` | Formularz edycji + upload obrazka |
| `/admin/events/:id/participants` | Lista zapisanych uczestników |

### Nawigacja i UX
- Górne menu: lista wydarzeń, logowanie/rejestracja (lub "Wyloguj" gdy zalogowany)
- Panel admina: osobny sidebar
- Responsywność: Tailwind breakpointy (`sm`, `md`, `lg`), na mobile menu hamburger, karty w jednej kolumnie
- Stan globalny: React Context dla auth (zalogowany, rola, token)
- Dane: lokalny stan komponentów + `fetch` bezpośrednio

---

## 5. Obsługa błędów i bezpieczeństwo

### Backend
- Walidacja wejścia: `zod` na każdym endpoincie (400 z opisem błędu przy nieprawidłowych danych)
- Hasła: `bcrypt` (salt rounds: 10)
- JWT: wygaśnięcie 24h, osobne sekrety dla uczestnika i admina
- Upload obrazków: tylko `image/*`, max 5MB, przechowywane w `server/uploads/`
- CORS: tylko `localhost:5173`

### Frontend
- Chronione trasy przez `PrivateRoute` — redirect na login jeśli brak tokenu
- Token usuwany z `localStorage` przy wylogowaniu
- Formularz zapisu blokowany gdy `registrations.length >= capacity`

### Baza danych
- Prisma waliduje typy na poziomie schematu
- Unique constraint `(userId, eventId)` zapobiega duplikatom

---

## 6. Uruchomienie lokalne

```bash
git clone <repo>
cd eventhub
npm install
cd server && npx prisma migrate dev && npm run seed && cd ..
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001  
Admin login: dane z seed (email: admin@eventhub.pl, hasło: admin123)
