# EventHub — Instrukcja Użytkownika

Niniejsza instrukcja opisuje krok po kroku jak korzystać z aplikacji EventHub — zarówno jako uczestnik wydarzeń, jak i jako administrator.

---

## Część 1: Uczestnik

### 1.1 Przeglądanie wydarzeń (bez logowania)

Po otwarciu strony `http://localhost:5173` zobaczysz stronę główną z listą nadchodzących wydarzeń.

**Strona główna** zawiera:
- Sekcję powitalną (hero) z przyciskiem „Przeglądaj wydarzenia"
- Listę najbliższych wydarzeń w formie kart

Każda karta pokazuje:
- Nazwę wydarzenia
- Datę i miejsce
- Liczbę wolnych miejsc
- Zdjęcie (jeśli dodane przez administratora)

Kliknij kartę lub przycisk „Szczegóły", aby zobaczyć pełny opis wydarzenia.

---

### 1.2 Wyszukiwanie wydarzeń

Przejdź do zakładki **„Wydarzenia"** w górnym menu.

Na stronie listy wydarzeń dostępne są filtry:
- **Wyszukaj po tytule** — wpisz fragment nazwy wydarzenia
- **Filtruj po dacie** — wybierz konkretny dzień

Wyniki aktualizują się automatycznie po wpisaniu tekstu lub wybraniu daty.

---

### 1.3 Rejestracja konta uczestnika

Aby zapisać się na wydarzenie, musisz posiadać konto.

1. Kliknij **„Zarejestruj się"** w górnym menu
2. Wypełnij formularz:
   - Imię i nazwisko
   - Adres email
   - Hasło (min. 6 znaków)
3. Kliknij **„Zarejestruj się"**
4. Po pomyślnej rejestracji zostaniesz automatycznie zalogowany i przekierowany na stronę główną

---

### 1.4 Logowanie

Jeśli masz już konto:

1. Kliknij **„Zaloguj się"** w górnym menu
2. Wpisz email i hasło
3. Kliknij **„Zaloguj się"**

Po zalogowaniu w menu pojawi się opcja **„Moje zapisy"** oraz przycisk **„Wyloguj"**.

---

### 1.5 Zapisanie się na wydarzenie

1. Przejdź na stronę szczegółów wybranego wydarzenia (kliknij kartę)
2. Jeśli jesteś zalogowany i są wolne miejsca, zobaczysz przycisk **„Zapisz się"**
3. Kliknij przycisk — zapis następuje natychmiast
4. Przycisk zmieni się na **„Jesteś zapisany"**

> Jeśli nie jesteś zalogowany, zobaczysz link „Zaloguj się, aby się zapisać".  
> Jeśli brak wolnych miejsc, przycisk będzie nieaktywny z komunikatem „Brak wolnych miejsc".

---

### 1.6 Przeglądanie i anulowanie swoich zapisów

1. Kliknij **„Moje zapisy"** w górnym menu
2. Zobaczysz listę wszystkich wydarzeń, na które jesteś zapisany
3. Przy każdym wydarzeniu jest przycisk **„Wypisz się"**
4. Po kliknięciu zapis zostanie anulowany — wydarzenie zniknie z listy

---

### 1.7 Wylogowanie

Kliknij przycisk **„Wyloguj"** w górnym menu. Zostaniesz wylogowany i przekierowany na stronę główną.

---

## Część 2: Administrator

Panel administracyjny służy do zarządzania treścią serwisu — tworzenia, edycji i usuwania wydarzeń.

### 2.1 Logowanie do panelu

1. Przejdź pod adres `http://localhost:5173/admin/login`
2. Wpisz dane administratora:
   - **Email:** `admin@eventhub.pl`
   - **Hasło:** `admin123`
3. Kliknij **„Zaloguj się"**
4. Zostaniesz przekierowany do panelu zarządzania wydarzeniami

> Panel admina jest całkowicie oddzielony od kont uczestników. Nie można zalogować się do panelu danymi uczestnika.

---

### 2.2 Lista wydarzeń

Po zalogowaniu zobaczysz tabelę z wszystkimi wydarzeniami. Każdy wiersz zawiera:
- Tytuł wydarzenia
- Datę
- Miejscowość / lokalizację
- Liczbę zapisanych uczestników i pojemność (np. `12 / 50`)
- Przyciski akcji: **Uczestnicy**, **Edytuj**, **Usuń**

---

### 2.3 Tworzenie nowego wydarzenia

1. Kliknij przycisk **„+ Nowe wydarzenie"** (prawy górny róg tabeli)
2. Wypełnij formularz:
   - **Tytuł** — nazwa wydarzenia
   - **Lokalizacja** — miejsce (np. „Sala 101, Wydział Informatyki")
   - **Opis** — szczegółowy opis
   - **Data i godzina** — wybierz z kalendarza
   - **Pojemność** — maksymalna liczba uczestników
   - **Zdjęcie** — opcjonalnie dodaj obraz (jpg, png, webp — max 5 MB)
3. Kliknij **„Zapisz"**

Wydarzenie natychmiast pojawi się na liście oraz w publicznym widoku aplikacji.

---

### 2.4 Edycja wydarzenia

1. W tabeli wydarzeń kliknij **„Edytuj"** przy wybranym wydarzeniu
2. Formularz zostanie wypełniony aktualnymi danymi
3. Zmień dowolne pola (możesz też zmienić zdjęcie — wybierz nowy plik)
4. Kliknij **„Zapisz"**

---

### 2.5 Upload / zmiana zdjęcia

Zdjęcie można dodać zarówno podczas tworzenia, jak i edycji wydarzenia:

1. W formularzu kliknij pole **„Zdjęcie"**
2. Wybierz plik graficzny z dysku (jpg, png, gif, webp — maks. 5 MB)
3. Kliknij **„Zapisz"** — zdjęcie zostanie przesłane automatycznie

Przy edycji istniejące zdjęcie jest widoczne nad polem wyboru pliku. Wybór nowego pliku zastępuje stare zdjęcie.

---

### 2.6 Usuwanie wydarzenia

1. W tabeli wydarzeń kliknij **„Usuń"** przy wybranym wydarzeniu
2. Pojawi się okno potwierdzenia — kliknij **OK**
3. Wydarzenie zostanie usunięte wraz ze wszystkimi zapisami uczestników

> Tej operacji nie można cofnąć.

---

### 2.7 Przeglądanie listy uczestników

1. W tabeli wydarzeń kliknij **„Uczestnicy"** przy wybranym wydarzeniu
2. Zobaczysz tabelę z:
   - Imieniem i nazwiskiem uczestnika
   - Adresem email
   - Datą zapisu
3. Kliknij **„← Powrót"** aby wrócić do listy wydarzeń

---

### 2.8 Wylogowanie z panelu

Kliknij przycisk **„Wyloguj"** na dole lewego paska bocznego.

---

## Część 3: Często zadawane pytania

**Nie pamiętam hasła — co zrobić?**  
Aplikacja nie posiada funkcji resetowania hasła. Skontaktuj się z administratorem systemu.

**Zapisałem się na wydarzenie przez pomyłkę — jak się wypisać?**  
Przejdź do „Moje zapisy" i kliknij „Wypisz się" przy danym wydarzeniu.

**Wydarzenie jest pełne — czy mogę trafić na listę rezerwową?**  
Nie — aplikacja nie obsługuje listy rezerwowej. Jeśli pojawi się wolne miejsce (ktoś się wypisze), przycisk zapisu stanie się aktywny.

**Gdzie są przechowywane dane?**  
Dane przechowywane są lokalnie w pliku bazy danych SQLite (`server/prisma/dev.db`). Aplikacja działa wyłącznie lokalnie i nie wysyła danych do żadnego zewnętrznego serwisu.
