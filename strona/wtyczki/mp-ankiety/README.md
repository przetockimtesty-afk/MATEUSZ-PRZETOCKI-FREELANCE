# MP Ankiety

Wtyczka WordPress: ankiety i formularze w krokach, w stylu strony. Działa u każdego klienta tak samo,
różnią się tylko pytania (definicja w bloku) i kolory z motywu.

- Blok **„Ankieta”** (`mp/ankieta`): jeden krok naraz, pasek postępu, pytania zależne od wcześniejszych
  odpowiedzi, odpowiedzi zapamiętane w przeglądarce (powrót po odświeżeniu), ekran „Dziękuję” z przyciskiem.
- Zapis w tabeli `{prefiks}mp_ankiety`, panel **Ankiety** (lista, podgląd, wyszukiwanie, CSV, usuwanie).
- E-mail do właściciela z odpowiedziami (Odpowiedz = do osoby, która wypełniła) i opcjonalne potwierdzenie
  z kopią odpowiedzi. Wysyłka po odpowiedzi dla przeglądarki, więc wolny SMTP nie blokuje ankiety.
- Opcjonalnie: kopia odpowiedzi do **automatu** (np. Google Apps Script) z podpisem HMAC.
- Ankiety „tylko z linku”: przełącznik **„Ukryj tę stronę przed Google”** (noindex i brak w mapie strony).
- RODO: eksport i usuwanie danych na żądanie (Narzędzia WordPressa), usuwanie odpowiedzi po N dniach (domyślnie 365),
  propozycja tekstu do polityki prywatności.
- Pomiar: po wysłaniu `dataLayer.push({event: 'mp_ankieta_wyslana'})` zawsze, a zdarzenie GA4 (`gtag`) i piksela Meta
  (`fbq`) tylko wtedy, gdy definicja ma `zdarzenia` i skrypty są na stronie (czyli po zgodzie na ciasteczka).
- Zabezpieczenia: pułapka na boty, minimum 2,5 s na stronie, najwyżej 10 ankiet na godzinę z jednego IP
  (filtr `mp_ankiety_limit_ip`), ponowne wysłanie tego samego formularza nie robi duplikatu, serwer sprawdza
  odpowiedzi z tą samą logiką widoczności co przeglądarka (odpowiedzi na ukryte pytania są pomijane).

Wymaga WordPressa 6.5+ i PHP 8.1+. Bez bibliotek i kroku budowania.

## Instalacja u klienta

1. Spakuj katalog `mp-ankiety` do ZIP (w ZIP-ie ma być folder `mp-ankiety/`), wgraj w **Wtyczki → Dodaj → Wyślij**, włącz.
2. **Ankiety → Ustawienia**: adres na powiadomienia, nazwa nadawcy, podpis, ile dni przechowywać odpowiedzi.
   Adres nadawcy i SMTP ustawia osobna wtyczka (np. WP Mail SMTP).
3. Na stronie dodaj blok **„Ankieta”** i wklej definicję (JSON) w panelu bocznym „Pytania”.
   Na stronie Mateusza definicje są w `strona/wordpress/ankiety.js`, a wstawia je `zbuduj.js`.
4. Przejdź ankietę na telefonie, sprawdź e-mail i wpis w panelu.

## Definicja ankiety

```json
{
  "id": "wycena",
  "nazwa": "Wycena strony",
  "czas": "ok. 5 minut",
  "wstep": "Tekst nad pierwszym krokiem (opcjonalnie).",
  "wyslij": "Wyślij odpowiedzi",
  "prywatnosc": "Zasady opisuję w {polityka}.",
  "pola": { "email": "EMAIL", "nazwa": "FIRMA" },
  "automat": true,
  "zdarzenia": { "ga4": "generate_lead", "meta": "Lead" },
  "dziekuje": { "naglowek": "Dziękuję!", "tekst": "Odpowiem na {email}.", "przycisk": "Umów rozmowę", "adres": "/rozmowa/" },
  "potwierdzenie": { "temat": "Dziękuję za odpowiedzi", "tekst": "…", "kopia": true },
  "kroki": [
    { "tytul": "Twoja praca", "opis": "…", "gdy": { "BRANZA": ["doradca"] }, "pytania": [ … ] }
  ]
}
```

- `pola`: które pytania to e-mail i nazwa osoby (lista w panelu, „Odpowiedz”, potwierdzenie).
- `automat`: czy wysyłać kopię do automatu z Ustawień. `zdarzenia`: nazwy zdarzeń GA4 i Meta (puste = bez).
- `dziekuje.tekst` i `potwierdzenie` mogą zawierać `{email}`. Bez `potwierdzenie.temat` potwierdzenia nie ma.
- `{polityka}` w `prywatnosc` zamienia się na link do polityki prywatności.

### Pytanie

```json
{ "id": "BRANZA", "typ": "jeden", "tytul": "Czym się zajmujesz?", "pomoc": "…", "podpowiedz": "…",
  "wymagane": true, "opcje": [ { "w": "doradca", "t": "Doradztwo kredytowe" }, "Etykieta = wartość" ],
  "inne": "Inna branża", "gdy": …, "z_adresu": "branza", "min": 0, "max": 100 }
```

| Typ | Pole | Wartość |
|---|---|---|
| `tekst`, `akapit` | jedna linia (300 zn.), kilka linii (5000 zn.) | tekst |
| `email`, `telefon` | sprawdzany format | tekst |
| `liczba` | „1 200,5” → `1200.5`, `min` (domyślnie 0) i `max` | tekst z liczbą |
| `jeden`, `wiele` | pigułki do wyboru; `inne` dodaje odpowiedź z polem tekstowym; opcja z `"sam": true` wyklucza pozostałe (np. „Nic z tych rzeczy”) | `w` opcji albo lista `w`; `__inne` + wpisany tekst |
| `skala` | 0–10 (albo `min`–`max`) | tekst z liczbą |
| `zgoda` | pole wyboru z treścią zgody w `tytul` | `tak` (treść zgody zapisuje się z odpowiedzią) |
| `info` | sam tekst (`tytul` pogrubiony + `pomoc`), bez odpowiedzi | — |

- `id` pytania: litery, cyfry, `_`. Kilka pytań może mieć to samo `id` z różnymi warunkami
  (np. „INFO” z inną podpowiedzią dla każdej branży); liczy się pierwsze widoczne.
- `z_adresu`: odpowiedź z parametru adresu strony, np. `/wycena/?zrodlo=email` albo `/materialy/?branza=doradca`.

### Warunek „gdy”

`{"POLE": ["wartość", …]}` = pole ma jedną z tych wartości (przy `wiele`: choć jedną). Kilka pól w obiekcie: wszystkie
muszą się zgadzać. Lista obiektów: wystarczy jeden. `"*"` = pole ma jakąkolwiek odpowiedź. Warunek może dotyczyć
tylko pytań, które są wcześniej w ankiecie. Krok bez spełnionego warunku znika razem z pytaniami.

## Automat (np. Google Apps Script)

POST `application/json`: `{"dane": "<JSON jako tekst>", "podpis": "<hex HMAC-SHA256(dane, sekret)>"}`.
`dane` zawiera m.in. `ankieta`, `id`, `utworzona`, `email`, `nazwa`, `odpowiedzi` (lista: `id`, `pytanie`, `krok`, `wartosc`,
`tekst`), `teksty` (`ID` → tekst, przy `wiele` lista etykiet) i `wartosci` (`ID` → wartość). Automat odpowiada
`{"ok": true}`; inaczej odpowiedź dostaje znaczek „Automat: błąd” i jest ponawiana do 3 razy (co godzinę), a w panelu
jest przycisk „Wyślij ponownie do automatu”. Test z Ustawień wysyła `{"test": true}`.
Przekierowania po POST wtyczka nie śledzi sama: wynik pobiera osobnym GET-em bez treści (od 0.1.1), bo Google na GET z treścią odpowiada kodem 400.
Wzorzec po stronie Google: `doPost` w `firma/automatyzacja/Kod.gs`.

## Dla programisty

- `src/Definicja.php`: normalizacja definicji, logika widoczności, sprawdzanie odpowiedzi (lustro `view.js`).
- `src/Odpowiedzi.php`: przyjęcie, zapis, przetwarzanie w tle (`fastcgi_finish_request`/`litespeed_finish_request`,
  inaczej WP-Cron), ponowienia.
- Haki: `mp_ankiety_nowa` (po zapisie: odpowiedź, definicja), filtry `mp_ankiety_limit_ip`, `mp_ankiety_uprawnienie`.
- REST: `POST /wp-json/mp-ankiety/v1/odpowiedzi`, `POST /wp-json/mp-ankiety/v1/automat/test` (administrator).
- Zdarzenie DOM po wysłaniu: `mp:ankieta-wyslana` (`detail.ankieta`).
