# Filmy dla klientów: 3 playlisty na YouTube

Plan z 23.10 (punkt 10 w `firma/STAN-PRAC.md`). Scenariusze pisze Claude, nagrywa Mateusz. Playlista 1 od 28.10: `na-start.html`.
Playlisty 2 i 3 nagrywamy przy oddaniu pierwszej strony, na prawdziwej stronie klienta.
Zasada z notatki: na początku klient robi tylko to, co konieczne. Resztę, która ułatwia życie, robi, kiedy chce.

| Playlista | Kiedy klient ją dostaje | Ile filmów |
|---|---|---|
| **1. Na start** (wymagane) | e-mail „Zaczynam”, po podpisaniu umowy | 7 |
| **2. Ułatwienia** (dobrowolne) | e-mail przy odbiorze strony | 4 |
| **3. Obsługa strony** | instrukcja po publikacji | 5 |

Wspólne dla wszystkich filmów:
- długość 1–3 minuty, jeden film = jedna czynność; nagranie ekranu z głosem, bez muzyki;
- film „niepubliczny” (dostęp przez link), playlisty też niepubliczne;
- na początku jedno zdanie: co zrobimy i ile to trwa; na końcu: co mi wysłać albo co się stanie dalej;
- dane z ekranu (e-maile, numery kont, hasła, ID kalendarza) zamazane albo z konta testowego;
- tytuł zaczyna się od numeru, np. „1.5 · Kalendarz Google, krok 2: udostępnienie kalendarza (2 min)”; w opisie lista kroków z filmu
  i link do formularza materiałów;
- zanim nagrasz: sprawdź, czy ekrany w LH.pl i Google wyglądają tak samo jak w scenariuszu. Nazwy przycisków się zmieniają.

---

## Playlista 1 · Na start (wymagane)

Od 28.10 scenariusze z tekstem lektora, opisami na YouTube i e-mailem „Zaczynam” są w `firma/filmy/na-start.html`.
To źródło Dokumentu Google „Scenariusze · filmy „Na start” dla klienta”:
https://docs.google.com/document/d/1fTPPnvBJsqpBCwWUM8UJ0oPc_23EP1ip3u2BnwbfEPE/edit (zmiany wprowadzaj w obu miejscach).

| Film | Dla kogo |
|---|---|
| 1.1 · Start: co robisz Ty, a co ja (1,5 min) | każdy klient |
| 1.2 · Domena i hosting w LH.pl (3 min) | klient bez domeny i hostingu |
| 1.3 · Dostęp dla mnie w LH.pl, bez hasła (2 min) | każdy klient z hostingiem w LH.pl |
| 1.4 · Kalendarz Google, krok 1: projekt i dostęp dla mnie (3 min) | klient, który chce rezerwacje w Kalendarzu Google |
| 1.5 · Kalendarz Google, krok 2: udostępnienie kalendarza (2 min) | ten sam klient, po e-mailu z adresem konta usługi |
| 1.6 · Stały link do spotkań online (2 min) | klient ze spotkaniami online, bez własnego linku |
| 1.7 · Zdjęcie do strony telefonem (2 min) | klient, który zrobi zdjęcie sam |

Zmiany względem wersji z 26.10:
- nowy film 1.4: projekt Google Cloud na koncie klienta i rola „Edytujący” dla Mateusza (wariant A z README wtyczki
  MP Rezerwacje), żeby połączenie z kalendarzem nie zależało od konta Mateusza;
- nowe filmy 1.6 i 1.7, bo formularze je obiecują („Zrobię stały link Google Meet według Twojego filmu”,
  „Zrobię zdjęcie telefonem według Twojej instrukcji”);
- bez filmu o arkuszu rezerwacji (dodatek, nie ma jeszcze arkusza-wzoru) i bez filmu o formularzu materiałów
  (formularz prowadzi sam, najważniejsze zdania są w filmie 1.1);
- bez identyfikatora kalendarza: przy głównym kalendarzu to Gmail klienta z formularza ustawień kalendarza;
- link Meet z całodniowego wydarzenia co roku oznaczonego jako „Wolny”: według pomocy Google link wygasa, gdy nie ma
  przyszłych terminów i nikt go nie używa przez rok, a „Wolny” nie blokuje terminów w kalendarzu rezerwacji.

### Gdy klient ma Google Workspace (bez filmu)

Organizacje Google Workspace założone po maju 2024 mają domyślnie włączone zasady, które blokują klucze kont usługi
i dodawanie osób spoza domeny, więc film 1.4 może się nie udać. Wtedy:
- projekt Google Cloud na prywatnym koncie Gmail klienta, a w kalendarzu firmowym tylko udostępnienie z filmu 1.5;
- albo wariant B (projekt na koncie Mateusza, klient robi tylko film 1.5);
- albo administrator Workspace wyłącza te dwie zasady dla jednego projektu. Ustalasz to z klientem indywidualnie.

### Gdy hasło jest naprawdę potrzebne (bez filmu, akapit w e-mailu)

„Haseł nie wysyłaj e-mailem ani SMS-em. Jeśli jakaś usługa nie ma uprawnień dla drugiej osoby, wyślij hasło
linkiem jednorazowym (np. Bitwarden Send), który wygasa po otwarciu. Po mojej pracy zmień to hasło.”

---

## Playlista 2 · Ułatwienia (dobrowolne)

### 2.1 · Poczta z domeny w Gmailu (3 minuty)

**Cel:** wiadomości z `kontakt@twojafirma.pl` trafiają do prywatnego Gmaila, a odpowiedzi idą z adresu firmowego.

1. Mówisz: „Od 2026 roku Gmail na komputerze nie pobiera już poczty z innych kont (POP3). Są dwa proste sposoby.”
2. **Sposób A, przekierowanie:** panel poczty w LH.pl → przekierowanie na adres Gmail.
   Potem Gmail → Ustawienia → Konta → **„Wyślij pocztę jako”** → adres firmowy, serwer SMTP z LH.pl
   (dane SMTP w opisie filmu) → kod weryfikacyjny z wiadomości.
3. **Sposób B, aplikacja Gmail na telefonie:** „Dodaj konto” → „Inne” → IMAP → dane z LH.pl.
4. Na koniec: „Wyślij próbną wiadomość z prywatnego e-maila na firmowy i odpowiedz na nią.
   Sprawdź, czy odpowiedź przyszła z adresu firmowego.”

### 2.2 · Powiadomienia o rezerwacjach na telefonie (1 minuta)

1. Aplikacja Kalendarz Google → kalendarz z rezerwacjami widoczny → powiadomienia włączone.
2. Mówisz: „Nowa rezerwacja to nowe wydarzenie w Twoim kalendarzu i e-mail z odpowiedziami klienta.”

### 2.3 · Profil Firmy w Google (2 minuty, tylko pakiety z profilem)

1. Gdzie widać profil, jak dodać zdjęcia i godziny, gdzie są opinie.
2. Mówisz: „Link do rezerwacji w profilu prowadzi do Twojej strony, więc klient umawia się bez telefonu.”

### 2.4 · Prośba o opinię: kod QR i SMS (1 minuta, pakiet „Pełny start”)

1. Karta z kodem QR, gotowy SMS i e-mail.
2. Mówisz: „Najlepszy moment to dzień po pierwszym spotkaniu, gdy klient jest zadowolony.”

---

## Playlista 3 · Obsługa strony (po publikacji)

### 3.1 · Jak zmienić tekst albo zdjęcie (2 minuty)

1. Logowanie do WordPressa → Strony → strona → kliknięcie w tekst i zmiana → „Zapisz”.
2. Zdjęcie: kliknięcie w obraz → „Zastąp” → plik z komputera.
3. Mówisz: „Zmieniaj teksty i zdjęcia śmiało. Układu sekcji lepiej nie przesuwaj. Napisz, zrobię to w ramach wsparcia.”

### 3.2 · Godziny, przerwy i urlopy w kalendarzu (2 minuty)

1. Rezerwacje → Ustawienia → godziny, przerwy, dni wolne, wyprzedzenie rezerwacji.
2. Mówisz: „Urlop wpisz tutaj albo dodaj w Kalendarzu Google wydarzenie »Zajęty«. Kalendarz rezerwacji go uszanuje.”

### 3.3 · Rezerwacje: lista, zmiana terminu, odwołanie, usuwanie (2 minuty)

1. Panel Rezerwacje: lista, szczegóły i odpowiedzi klienta.
2. Zmiana terminu i odwołanie (klient dostaje e-mail).
3. Usuwanie zaznaczonych (np. testowych), które zeruje liczniki.

### 3.4 · Odpowiedzi z formularzy (1 minuta)

1. Panel Ankiety: lista, podgląd, „Odpowiedz” (wiadomość idzie do osoby, która wypełniła), eksport CSV.
2. Mówisz: „Kopia każdej odpowiedzi przychodzi też na Twój e-mail.”

### 3.5 · Co robię ja w ramach 30 dni wsparcia (1 minuta)

1. Mówisz: „Przez 30 dni odpowiadam na pytania i poprawiam drobiazgi. W 14. dniu poproszę Cię o opinię,
   w 30. wyślę podsumowanie z liczbami rezerwacji. Potem drobne zmiany wyceniam przed pracą.”

---

## Nagranie: ściąga dla Mateusza

- OBS albo nagrywanie ekranu w systemie, 1080p, mikrofon blisko, ciche pomieszczenie.
- Kursor: włącz podświetlenie kliknięć.
- Każdy film najpierw „na sucho”, potem jedno nagranie. Drobne pomyłki zostaw, liczy się czytelność.
- W opisie: lista kroków, linki (formularz, arkusz, LH.pl z oznaczeniem „link polecający”), data nagrania.
- Gdy zmieni się ekran w LH.pl albo Google: nagraj tylko ten jeden film od nowa.
