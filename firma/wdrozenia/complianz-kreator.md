# Complianz: kreator krok po kroku (mateuszprzetocki.pl)

Ściąga do przejścia raz, ok. 10 minut. Odpowiedzi sprawdzone 25.10.2026 na kopii strony z tą samą wersją wtyczki (Complianz 7.5.6, wersja darmowa). U klienta pytania są te same, zmieniają się dane z kroku 3 i usługi z kroku 7.

Wtyczka jest już włączona. Dopóki nie klikniesz „Zakończ” w ostatnim kroku, baneru nie ma i nic nie jest blokowane. Dlatego piksel Meta i GA4 (PixelYourSite) włączam dopiero, gdy skończysz kreator.

Zasada w całym kreatorze: po każdym kroku **Zapisz i kontynuuj**. Pola z napisem **Ulepsz** są płatne, pomijasz je.

## 1. Okno „Witamy w Complianz” (przy pierwszym otwarciu)

- Wpisz swój e-mail (kontakt@…) i kliknij **Kontynuuj**. To rejestracja darmowego skanu strony. Jeśli wyświetli się zgoda na newsletter Complianz, możesz ją zostawić pustą.
- Na skrzynkę przyjdzie e-mail od Complianz z linkiem potwierdzającym. Kliknij go (od razu albo przy kroku 6).
- Jeśli okno zamknie się przez „No, Thanks”, nic się nie stało: rejestrację zrobisz w kroku 6 przyciskiem **Start**.

## 2. Ogólne → Odwiedzający

- Przepisy: **Unia Europejska (RODO)**.
- Użytkownicy z Niemiec, Austrii, Belgii, Hiszpanii: **Nie**.
- Logowanie do części strony: **Nie**.

## 3. Ogólne → Dokumenty

- Polityka ciasteczek: **Wygenerowano z Complianz**. Strona na nią już jest: „Polityka cookies” (`/polityka-cookies/`).
- Oświadczenie o prywatności: **Istniejąca strona** → wybierz **Polityka prywatności**.
- Imprint: **Żaden**.
- Zastrzeżenia: **Żaden**.

## 4. Ogólne → Informacje o witrynie

- Właściciel: **Mateusz Przetocki**.
- Adres: ten sam co w polityce prywatności (ulica z numerem, kod pocztowy, Kraków).
- Kraj: **Polska**.
- E-mail w sprawach prywatności: kontakt@…
- Telefon: zostaw puste.

Te dane trafiają do punktu „Dane kontaktowe” w polityce cookies.

## 5. Ogólne → Bezpieczeństwo i zgoda

- Records of Consent i formularz żądania danych: płatne, pomiń.
- „Respektuj Nie śledź (Do not track)”: **Tak**.

## 6. Zgoda → Website Scan

- Jeśli widzisz „Cookie Scan Unavailable”: **Start** → Twój e-mail → link z e-maila od Complianz.
- Potem **Skanuj**. Teraz skan nie znajdzie piksela ani GA4, bo jeszcze ich nie ma. Drugi skan zrobisz po moim sygnale (punkt „Po kreatorze” na dole).
- **Kontynuuj**.

## 7. Zgoda → Statystyka i Statistics configuration

- Statystyki: **Tak, z Google Analytics**.
- „Czy chcesz, żeby Complianz dodał Google Analytics?”: **Nie**. GA4 dodaje PixelYourSite, a Complianz tylko go blokuje do czasu zgody.
- Pozostałe pola na tym ekranie (Consent Mode, Google Tag) zostaw puste albo płatne.

## 8. Zgoda → Usługi

- Consent per Service: **Nie**.
- Zewnętrzne serwisy: **Nie**.
- Osadzone treści z social mediów, przyciski, piksel: **Tak** → zaznacz **Facebook**.
- Skrypty do celów reklamowych: **Tak** → framework: **Nie używaj dodatkowego frameworka**.
- Amazon Consent Signal: **Nie**.
- Komentarze WordPressa: **Nie**.

## 9. Zgoda → Wtyczki i Cookiedatabase.org

- Wtyczki: tylko **Zapisz i kontynuuj** (Complianz sam rozpoznał PixelYourSite).
- Cookiedatabase.org: jeśli jest przycisk **Start**, to ta sama rejestracja co w kroku 6. Język **pl**, **Synchronizuj**, potem **Kontynuuj**. Synchronizacja dopisuje polskie opisy ciasteczek do polityki cookies.

## 10. Dokumenty

- Dokumenty: przy „Polityka plików cookies” powinien być znaczek ✓ (strona już istnieje). **Nie klikaj „Utwórz brakujące strony”**, bo powstałby duplikat. Jeśli zamiast ✓ jest ✗, napisz do mnie.
- Link do menu: „Nie znaleziono menu”. To w porządku, linki są już w stopce. **Zapisz i kontynuuj**.

## 11. Zakończ

- Show Consent Banner: **Tak**.
- Włącz blokadę plików cookie i skryptów: **Tak**.
- **Zakończ**.

Od tej chwili na stronie jest baner z przyciskami „Akceptuję”, „Odmów” i „Zobacz preferencje”, a w stopce działa link „Ustawienia cookies”. Kolory baneru są już ustawione w CSS strony (czarne przyciski, „Odmów” wygląda tak samo jak „Akceptuję”), więc w „Baner zgody → Kolory” niczego nie zmieniaj.

## Po kreatorze

1. Napisz mi, że skończone. Włączam PixelYourSite z pikselem Meta i GA4 i sprawdzam w oknie prywatnym, że przed zgodą nic się nie ładuje, a po „Akceptuję” ładuje się piksel i GA4.
2. Gdy dam znać: Complianz → Kreator → **Website Scan** → **Skanuj**, potem **Cookiedatabase.org** → **Synchronizuj** → przejdź do końca i **Zakończ**. Wtedy w polityce cookies pojawi się lista ciasteczek Google i Meta.

## Dobrze wiedzieć

- GA4 i piksel ładują się dopiero po zgodzie na marketing (Complianz blokuje cały PixelYourSite jako marketing). Statystyki będą więc liczyć tylko osoby, które klikną „Akceptuję”. Tak jest najbezpieczniej prawnie.
- Tekst na banerze zmienisz w „Baner zgody → Texts”. Propozycja krótszej wersji:
  „Używam Google Analytics i piksela Meta, żeby wiedzieć, które strony i reklamy działają. Włączą się tylko, jeśli się zgodzisz. Ankieta i kalendarz działają bez nich.”
