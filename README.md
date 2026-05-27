# EventHub

EventHub to aplikacja webowa służąca do tworzenia wydarzeń oraz zarządzania zapisami uczestników. Projekt powstaje w ramach przedmiotu Techniki Internetowe.

## Cel projektu

Celem projektu jest stworzenie prostego systemu, który ułatwia organizowanie wydarzeń, takich jak spotkania, warsztaty, szkolenia lub wydarzenia studenckie. Aplikacja pozwala użytkownikom przeglądać dostępne wydarzenia i zapisywać się na nie, a organizatorom tworzyć wydarzenia oraz zarządzać listą uczestników.

## Główne funkcje

- rejestracja i logowanie użytkowników,
- przeglądanie listy wydarzeń,
- filtrowanie wydarzeń,
- podgląd szczegółów wydarzenia,
- zapisywanie się na wydarzenia,
- tworzenie i edycja wydarzeń przez organizatora,
- panel organizatora z listą uczestników.

## Technologie

Projekt zostanie wykonany z użyciem następujących technologii:

### Frontend

- React
- TypeScript
- React Router
- Fetch API
- CSS / Tailwind CSS

### Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM

### Baza danych

- PostgreSQL

## Architektura projektu

Aplikacja będzie składać się z trzech głównych części:

1. **Frontend** — aplikacja SPA napisana w React, odpowiedzialna za interfejs użytkownika.
2. **Backend** — serwer Express.js udostępniający REST API.
3. **Baza danych** — PostgreSQL przechowujący dane użytkowników, wydarzeń oraz zapisów.

Frontend komunikuje się z backendem za pomocą zapytań HTTP do REST API. Backend obsługuje logikę aplikacji, walidację danych, autoryzację użytkowników oraz komunikację z bazą danych.

## Struktura Projektu

```text
eventhub/
├── client/          # frontend React + TypeScript
├── server/          # backend Express + TypeScript
├── README.md
└── package.json
```