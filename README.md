# EventHub

Aplikacja webowa do tworzenia wydarzeń i zarządzania zapisami uczestników.

## Technologie

**Frontend:** React 18, TypeScript, Tailwind CSS, Vite, React Router  
**Backend:** Node.js, Express, TypeScript, Prisma ORM  
**Baza danych:** SQLite (plik lokalny, bez dodatkowej instalacji)

## Uruchomienie lokalne

### Wymagania

- Node.js >= 18
- npm >= 9

### Kroki

```bash
# 1. Sklonuj repozytorium
git clone <url-repozytorium>
cd eventhub

# 2. Zainstaluj zależności root
npm install

# 3. Zainstaluj zależności klienta
cd client && npm install && cd ..

# 4. Zainstaluj zależności serwera i przygotuj bazę
cd server && npm install
npx prisma migrate dev --name init
npm run seed
cd ..

# 5. Uruchom aplikację
npm run dev
```

Aplikacja dostępna pod:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

### Dane logowania

| Rola | Email | Hasło |
|------|-------|-------|
| Administrator | admin@eventhub.pl | admin123 |

Konto uczestnika należy zarejestrować przez formularz rejestracji.

## Struktura projektu

```
eventhub/
├── client/          # React + TypeScript + Tailwind (Vite)
│   └── src/
│       ├── components/
│       ├── context/
│       ├── lib/
│       └── pages/
├── server/          # Express + TypeScript + Prisma
│   ├── prisma/      # schema.prisma, seed.ts, dev.db
│   ├── src/
│   │   ├── lib/
│   │   ├── middleware/
│   │   └── routes/
│   └── uploads/     # przesłane obrazki
├── docs/            # dokumentacja i specyfikacje
└── README.md
```
