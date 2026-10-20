<?php
namespace MP\Rezerwacje;

defined( 'ABSPATH' ) || exit;

/**
 * Wszystkie ustawienia w jednej opcji `mp_rezerwacje`. Klucz konta usługi Google osobno
 * (opcja `mp_rezerwacje_google_klucz` albo stała MP_REZERWACJE_GOOGLE_KLUCZ w wp-config.php).
 */
final class Ustawienia {

	const OPCJA = 'mp_rezerwacje';
	const KLUCZ = 'mp_rezerwacje_google_klucz';
	const FORMY = array( 'online', 'na-miejscu', 'telefon' );
	const TYPY  = array(
		'tekst' => 'Krótka odpowiedź',
		'dlugi' => 'Dłuższa odpowiedź',
		'wybor' => 'Wybór jednej opcji (przyciski)',
		'lista' => 'Lista rozwijana',
	);

	/** Sekcje, które formularz panelu zastępuje w całości (lista może się skrócić). */
	const LISTY = array( 'wizyty', 'pytania', 'godziny' );

	private static ?array $cache = null;

	public static function domyslne(): array {
		return array(
			'branza'  => '',
			'osoba'   => array(
				'imie'    => '',
				'opis'    => '',
				'zdjecie' => 0,
			),
			'wizyty'  => array(
				array(
					'id'    => 'konsultacja',
					'nazwa' => 'Konsultacja',
					'czas'  => 30,
					'formy' => array( 'online', 'na-miejscu' ),
					'opis'  => '',
				),
			),
			'miejsce' => array(
				'etykieta' => 'W biurze',
				'adres'    => '',
				'online'   => '',
			),
			'godziny' => array(
				1 => '09:00-17:00',
				2 => '09:00-17:00',
				3 => '09:00-17:00',
				4 => '09:00-17:00',
				5 => '09:00-15:00',
				6 => '',
				7 => '',
			),
			'wyjatki' => '',
			'swieta'  => true,
			'zasady'  => array(
				'krok'         => 30,
				'przerwa'      => 15,
				'wyprzedzenie' => 12,
				'okno'         => 30,
				'limit'        => 0,
				'zmiany'       => 24,
			),
			'telefon' => 'opcjonalny',
			'pytania' => array(),
			'teksty'  => array(
				'naglowek'  => 'Umów konsultację',
				'zapowiedz' => '',
				'przycisk'  => 'Umawiam termin',
				'sukces'    => 'Potwierdzenie i szczegóły są już w Twojej skrzynce.',
				'zgoda'     => 'Zgadzam się na przetwarzanie moich danych w celu umówienia i obsługi spotkania. Więcej w {polityka}.',
				'polityka'  => '',
			),
			'maile'   => array(
				'do'                  => '',
				'nadawca'             => '',
				'przypomnienie'       => 24,
				'potwierdzenie'       => 'Dziękuję za rezerwację. Poniżej są szczegóły spotkania.',
				'przypomnienie_tekst' => 'Przypominam o naszym spotkaniu.',
				'podpis'              => '',
			),
			'google'  => array(
				'kalendarz' => '',
				'zajetosc'  => array(),
				'opis'      => 'pelny',
				'arkusz'    => '',
				'zakladka'  => 'Rezerwacje',
			),
			'wyglad'  => array(
				'glowny'  => '',
				'akcent'  => '',
				'tlo'     => '',
				'promien' => '',
			),
			'rodo'    => array(
				'przechowywanie'           => 365,
				'usun_przy_odinstalowaniu' => false,
			),
		);
	}

	/** Ustawienia zapisane w bazie uzupełnione domyślnymi. Filtr `mp_rezerwacje_ustawienia` pozwala zmienić je w kodzie. */
	public static function wszystkie(): array {
		if ( null === self::$cache ) {
			self::$cache = apply_filters( 'mp_rezerwacje_ustawienia', self::scal( self::domyslne(), self::zapisane() ) );
		}
		return self::$cache;
	}

	/** Wartość po ścieżce, np. get( 'zasady.krok' ). */
	public static function get( string $sciezka ) {
		$wartosc = self::wszystkie();
		foreach ( explode( '.', $sciezka ) as $klucz ) {
			if ( ! is_array( $wartosc ) || ! array_key_exists( $klucz, $wartosc ) ) {
				return null;
			}
			$wartosc = $wartosc[ $klucz ];
		}
		return $wartosc;
	}

	public static function zapisane(): array {
		$zapisane = get_option( self::OPCJA, array() );
		return is_array( $zapisane ) ? $zapisane : array();
	}

	/** Zapisane ustawienia uzupełnione domyślnymi, bez zmian z filtrów (do formularzy panelu). */
	public static function do_edycji(): array {
		return self::scal( self::domyslne(), self::zapisane() );
	}

	public static function zapisz( array $ustawienia ): void {
		update_option( self::OPCJA, $ustawienia );
		self::$cache = null;
	}

	/** Zmiany z formularza panelu albo z importu nałożone na obecne ustawienia; listy (i sekcje z LISTY) zastępowane w całości. */
	public static function nadpisz( array $obecne, array $zmiany, int $poziom = 0 ): array {
		foreach ( $zmiany as $klucz => $wartosc ) {
			$lista = ( 0 === $poziom && in_array( $klucz, self::LISTY, true ) ) || ( is_array( $wartosc ) && array_is_list( $wartosc ) );
			if ( ! $lista && is_array( $wartosc ) && isset( $obecne[ $klucz ] ) && is_array( $obecne[ $klucz ] ) ) {
				$obecne[ $klucz ] = self::nadpisz( $obecne[ $klucz ], $wartosc, $poziom + 1 );
			} else {
				$obecne[ $klucz ] = $wartosc;
			}
		}
		return $obecne;
	}

	/**
	 * Porządkuje całe ustawienia: przycina teksty, pilnuje zakresów liczb i słowników.
	 * Błędny zapis godzin wraca do poprzedniej wartości, a opis problemu trafia do $bledy.
	 */
	public static function normalizuj( array $u, array &$bledy = array(), ?array $poprzednie = null ): array {
		$d          = self::domyslne();
		$poprzednie = self::scal( $d, $poprzednie ?? self::zapisane() );
		$u          = self::scal( $d, $u );
		$w          = array();

		$w['branza'] = sanitize_key( (string) $u['branza'] );
		$w['osoba']  = array(
			'imie'    => self::tekst( $u['osoba']['imie'], 80 ),
			'opis'    => self::tekst( $u['osoba']['opis'], 120 ),
			'zdjecie' => absint( $u['osoba']['zdjecie'] ),
		);

		$w['wizyty'] = array();
		$idy         = array();
		foreach ( (array) $u['wizyty'] as $wizyta ) {
			if ( ! is_array( $wizyta ) ) {
				continue;
			}
			$nazwa = self::tekst( $wizyta['nazwa'] ?? '', 80 );
			if ( '' === $nazwa ) {
				continue;
			}
			$formy = array_values( array_intersect( self::FORMY, (array) ( $wizyta['formy'] ?? array() ) ) );
			if ( ! $formy ) {
				$formy   = array( 'online' );
				$bledy[] = "Spotkanie „{$nazwa}” nie miało zaznaczonej formy, ustawiłem online.";
			}
			$w['wizyty'][] = array(
				'id'    => self::unikalny( substr( sanitize_key( $wizyta['id'] ?? '' ) ?: sanitize_title( $nazwa ), 0, 60 ), $idy, 'wizyta' ),
				'nazwa' => $nazwa,
				'czas'  => self::liczba( $wizyta['czas'] ?? 30, 5, 480, 30 ),
				'formy' => $formy,
				'opis'  => self::tekst( $wizyta['opis'] ?? '', 200 ),
			);
		}
		if ( ! $w['wizyty'] ) {
			$w['wizyty'] = $poprzednie['wizyty'] ?: $d['wizyty'];
			$bledy[]     = 'Musi zostać co najmniej jeden rodzaj spotkania.';
		}

		$w['miejsce'] = array(
			'etykieta' => self::tekst( $u['miejsce']['etykieta'], 40 ) ?: 'Na miejscu',
			'adres'    => self::tekst( $u['miejsce']['adres'], 200 ),
			'online'   => esc_url_raw( trim( (string) $u['miejsce']['online'] ) ),
		);

		$w['godziny'] = array();
		for ( $dzien = 1; $dzien <= 7; $dzien++ ) {
			$tekst      = (string) ( $u['godziny'][ $dzien ] ?? '' );
			$przedzialy = Czas::przedzialy( $tekst );
			if ( null === $przedzialy ) {
				$bledy[]                = Czas::wielka( Czas::DNI[ $dzien ] ) . ": nie rozumiem „{$tekst}”. Wpisz np. 9:00-17:00 albo 9:00-12:00, 13:00-17:00.";
				$w['godziny'][ $dzien ] = (string) ( $poprzednie['godziny'][ $dzien ] ?? '' );
			} else {
				$w['godziny'][ $dzien ] = Czas::przedzialy_tekst( $przedzialy );
			}
		}

		$w['wyjatki'] = mb_substr( sanitize_textarea_field( (string) $u['wyjatki'] ), 0, 5000 );
		foreach ( Czas::wyjatki( $w['wyjatki'] )['bledy'] as $linia ) {
			$bledy[] = "Wyjątki: nie rozumiem linii „{$linia}”, pomijam ją.";
		}
		$w['swieta'] = self::tak( $u['swieta'] );

		$z           = $u['zasady'];
		$w['zasady'] = array(
			'krok'         => self::liczba( $z['krok'], 5, 240, 30 ),
			'przerwa'      => self::liczba( $z['przerwa'], 0, 240, 15 ),
			'wyprzedzenie' => self::liczba( $z['wyprzedzenie'], 0, 720, 12 ),
			'okno'         => self::liczba( $z['okno'], 1, 365, 30 ),
			'limit'        => self::liczba( $z['limit'], 0, 50, 0 ),
			'zmiany'       => self::liczba( $z['zmiany'], 0, 168, 24 ),
		);

		$w['telefon'] = in_array( $u['telefon'], array( 'wymagany', 'opcjonalny', 'ukryty' ), true ) ? $u['telefon'] : 'opcjonalny';

		$w['pytania'] = array();
		$idy          = array( 'imie', 'email', 'telefon', 'forma', 'zgoda' );
		foreach ( (array) $u['pytania'] as $pytanie ) {
			if ( ! is_array( $pytanie ) ) {
				continue;
			}
			$etykieta = self::tekst( $pytanie['etykieta'] ?? '', 150 );
			if ( '' === $etykieta ) {
				continue;
			}
			$typ   = array_key_exists( $pytanie['typ'] ?? '', self::TYPY ) ? $pytanie['typ'] : 'tekst';
			$opcje = is_array( $pytanie['opcje'] ?? null ) ? $pytanie['opcje'] : preg_split( '/\R|\|/', (string) ( $pytanie['opcje'] ?? '' ) );
			$opcje = array_slice( array_values( array_unique( array_filter( array_map( fn( $o ) => self::tekst( $o, 100 ), $opcje ) ) ) ), 0, 12 );
			if ( in_array( $typ, array( 'wybor', 'lista' ), true ) && count( $opcje ) < 2 ) {
				$bledy[] = "Pytanie „{$etykieta}” potrzebuje co najmniej dwóch opcji (po jednej w linii), zmieniłem je na krótką odpowiedź.";
				$typ     = 'tekst';
			}
			$w['pytania'][] = array(
				'id'         => self::unikalny( substr( sanitize_key( $pytanie['id'] ?? '' ) ?: sanitize_title( $etykieta ), 0, 40 ), $idy, 'pytanie' ),
				'etykieta'   => $etykieta,
				'typ'        => $typ,
				'opcje'      => in_array( $typ, array( 'wybor', 'lista' ), true ) ? $opcje : array(),
				'wymagane'   => self::tak( $pytanie['wymagane'] ?? false ),
				'podpowiedz' => self::tekst( $pytanie['podpowiedz'] ?? '', 150 ),
			);
			if ( count( $w['pytania'] ) >= 10 ) {
				break;
			}
		}

		$t           = $u['teksty'];
		$w['teksty'] = array(
			'naglowek'  => self::tekst( $t['naglowek'], 80 ) ?: $d['teksty']['naglowek'],
			'zapowiedz' => self::tekst( $t['zapowiedz'], 160 ),
			'przycisk'  => self::tekst( $t['przycisk'], 40 ) ?: $d['teksty']['przycisk'],
			'sukces'    => self::tekst( $t['sukces'], 300 ),
			'zgoda'     => self::tekst( $t['zgoda'], 400 ) ?: $d['teksty']['zgoda'],
			'polityka'  => esc_url_raw( trim( (string) $t['polityka'] ) ),
		);

		$m          = $u['maile'];
		$adresy     = array_filter( array_map( 'trim', explode( ',', (string) $m['do'] ) ) );
		$poprawne   = array_filter( $adresy, 'is_email' );
		$w['maile'] = array(
			'do'                  => implode( ', ', $poprawne ),
			'nadawca'             => self::tekst( $m['nadawca'], 80 ),
			'przypomnienie'       => self::liczba( $m['przypomnienie'], 0, 168, 24 ),
			'potwierdzenie'       => self::akapit( $m['potwierdzenie'], 1000 ),
			'przypomnienie_tekst' => self::akapit( $m['przypomnienie_tekst'], 1000 ),
			'podpis'              => self::akapit( $m['podpis'], 300 ),
		);
		if ( count( $poprawne ) < count( $adresy ) ) {
			$bledy[] = 'Pominąłem niepoprawne adresy e-mail do powiadomień.';
		}

		$g           = $u['google'];
		$zajetosc    = is_array( $g['zajetosc'] ) ? $g['zajetosc'] : preg_split( '/[\s,]+/', (string) $g['zajetosc'] );
		$w['google'] = array(
			'kalendarz' => self::tekst( $g['kalendarz'], 200 ),
			'zajetosc'  => array_slice( array_values( array_unique( array_filter( array_map( fn( $k ) => self::tekst( $k, 200 ), $zajetosc ) ) ) ), 0, 10 ),
			'opis'      => 'minimalny' === $g['opis'] ? 'minimalny' : 'pelny',
			'arkusz'    => preg_match( '#/spreadsheets/d/([a-zA-Z0-9_-]+)#', (string) $g['arkusz'], $a ) ? $a[1] : preg_replace( '/[^a-zA-Z0-9_-]/', '', (string) $g['arkusz'] ),
			'zakladka'  => self::tekst( $g['zakladka'], 100 ) ?: 'Rezerwacje',
		);

		$wy          = $u['wyglad'];
		$w['wyglad'] = array(
			'glowny'  => (string) sanitize_hex_color( (string) $wy['glowny'] ),
			'akcent'  => (string) sanitize_hex_color( (string) $wy['akcent'] ),
			'tlo'     => (string) sanitize_hex_color( (string) $wy['tlo'] ),
			'promien' => '' === trim( (string) $wy['promien'] ) ? '' : self::liczba( $wy['promien'], 0, 40, 24 ),
		);

		$w['rodo'] = array(
			'przechowywanie'           => 0 === (int) $u['rodo']['przechowywanie'] ? 0 : self::liczba( $u['rodo']['przechowywanie'], 30, 3650, 365 ),
			'usun_przy_odinstalowaniu' => self::tak( $u['rodo']['usun_przy_odinstalowaniu'] ),
		);

		return $w;
	}

	/* ---------- Wygodne odczyty ---------- */

	public static function wizyty(): array {
		$wizyty = self::get( 'wizyty' );
		return is_array( $wizyty ) && $wizyty ? array_values( $wizyty ) : self::domyslne()['wizyty'];
	}

	/** Spotkanie o danym id, a bez id pierwsze z listy. */
	public static function wizyta( string $id = '' ): ?array {
		foreach ( self::wizyty() as $wizyta ) {
			if ( '' === $id || $wizyta['id'] === $id ) {
				return $wizyta;
			}
		}
		return null;
	}

	public static function pytania(): array {
		return array_values( (array) self::get( 'pytania' ) );
	}

	/** Adresy, na które idą powiadomienia o rezerwacjach (domyślnie e-mail administratora). */
	public static function adresy_wlasciciela(): array {
		$adresy = array_filter( array_map( 'trim', explode( ',', (string) self::get( 'maile.do' ) ) ), 'is_email' );
		return $adresy ? array_values( $adresy ) : array( (string) get_option( 'admin_email' ) );
	}

	public static function nazwa_wlasciciela(): string {
		return (string) ( self::get( 'osoba.imie' ) ?: wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ) );
	}

	public static function polityka(): string {
		return (string) ( self::get( 'teksty.polityka' ) ?: get_privacy_policy_url() );
	}

	/** Etykiety form spotkania. */
	public static function formy(): array {
		return array(
			'online'     => array(
				'etykieta' => 'Online',
				'ikona'    => 'wideo',
			),
			'na-miejscu' => array(
				'etykieta' => (string) ( self::get( 'miejsce.etykieta' ) ?: 'Na miejscu' ),
				'ikona'    => 'pinezka',
			),
			'telefon'    => array(
				'etykieta' => 'Telefonicznie',
				'ikona'    => 'telefon',
			),
		);
	}

	/** Forma spotkania z konkretami: „Online: link”, „W biurze: adres”, „Telefonicznie, zadzwonię na …”. */
	public static function forma_opis( string $forma, string $telefon = '' ): string {
		$miejsce = (array) self::get( 'miejsce' );
		switch ( $forma ) {
			case 'online':
				return $miejsce['online'] ? 'Online: ' . $miejsce['online'] : 'Online, link przyjdzie przed spotkaniem';
			case 'na-miejscu':
				return ( $miejsce['etykieta'] ?: 'Na miejscu' ) . ( $miejsce['adres'] ? ': ' . $miejsce['adres'] : '' );
			case 'telefon':
				return 'Telefonicznie' . ( $telefon ? ', zadzwonię na ' . $telefon : '' );
		}
		return $forma;
	}

	/** Linijka pod nagłówkiem kalendarza: „30 minut · online albo w biurze”. */
	public static function opis_wizyty( array $wizyta ): string {
		return Czas::dlugosc( (int) $wizyta['czas'] ) . ' · ' . self::formy_tekst( $wizyta );
	}

	/** „online albo w biurze”, „online, w biurze albo telefonicznie”. */
	public static function formy_tekst( array $wizyta ): string {
		$formy    = self::formy();
		$nazwy    = array_map( fn( $f ) => mb_strtolower( $formy[ $f ]['etykieta'] ?? $f ), $wizyta['formy'] );
		$ostatnia = (string) array_pop( $nazwy );
		return $nazwy ? implode( ', ', $nazwy ) . ' albo ' . $ostatnia : $ostatnia;
	}

	/* ---------- Branże, eksport i import ---------- */

	/** Gotowe zestawy z katalogu branze/ (filtr `mp_rezerwacje_branze` dodaje własne). */
	public static function branze(): array {
		$wynik = array();
		foreach ( glob( dirname( PLIK ) . '/branze/*.json' ) ?: array() as $plik ) {
			$dane = json_decode( (string) file_get_contents( $plik ), true );
			if ( is_array( $dane ) && ! empty( $dane['ustawienia'] ) ) {
				$wynik[ basename( $plik, '.json' ) ] = $dane;
			}
		}
		return apply_filters( 'mp_rezerwacje_branze', $wynik );
	}

	/**
	 * Wczytuje zestaw branży: spotkania, pytania, godziny, zasady i teksty. Najpierw wracają one do wartości
	 * domyślnych, żeby nic nie zostało z poprzedniej branży. Dane osoby, adres, Google i wygląd zostają.
	 */
	public static function zastosuj_branze( string $slug, array &$bledy = array() ): bool {
		$branze = self::branze();
		if ( empty( $branze[ $slug ]['ustawienia'] ) ) {
			return false;
		}
		$d     = self::domyslne();
		$baza  = self::do_edycji();
		$baza  = array_merge( $baza, array_intersect_key( $d, array_flip( array( 'wizyty', 'pytania', 'godziny', 'zasady', 'telefon' ) ) ) );
		$baza['teksty'] = array_merge( $baza['teksty'], array_diff_key( $d['teksty'], array( 'polityka' => 1 ) ) );
		$baza['maile']  = array_merge( $baza['maile'], array_intersect_key( $d['maile'], array_flip( array( 'potwierdzenie', 'przypomnienie_tekst' ) ) ) );
		$baza['miejsce']['etykieta'] = $d['miejsce']['etykieta'];

		$nowe           = self::nadpisz( $baza, $branze[ $slug ]['ustawienia'] );
		$nowe['branza'] = $slug;
		self::zapisz( self::normalizuj( $nowe, $bledy ) );
		return true;
	}

	public static function eksport(): string {
		$dane = self::scal( self::domyslne(), self::zapisane() );
		return (string) wp_json_encode(
			array(
				'wtyczka'    => 'mp-rezerwacje',
				'wersja'     => WERSJA,
				'ustawienia' => $dane,
			),
			JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
		);
	}

	public static function import( string $json, array &$bledy = array() ): bool {
		$dane = json_decode( $json, true );
		if ( ! is_array( $dane ) ) {
			$bledy[] = 'To nie jest poprawny plik JSON z ustawieniami.';
			return false;
		}
		$ustawienia = $dane['ustawienia'] ?? $dane;
		if ( ! is_array( $ustawienia ) || ! array_intersect( array_keys( $ustawienia ), array_keys( self::domyslne() ) ) ) {
			$bledy[] = 'W pliku nie ma ustawień wtyczki MP Rezerwacje.';
			return false;
		}
		self::zapisz( self::normalizuj( self::nadpisz( self::scal( self::domyslne(), self::zapisane() ), $ustawienia ), $bledy ) );
		return true;
	}

	/* ---------- Pomocnicze ---------- */

	/** Domyślne uzupełnione zapisanymi; słowniki scalane w głąb, listy brane w całości. */
	private static function scal( array $domyslne, array $zapisane ): array {
		foreach ( $domyslne as $klucz => $wartosc ) {
			if ( ! array_key_exists( $klucz, $zapisane ) ) {
				$zapisane[ $klucz ] = $wartosc;
			} elseif ( is_array( $wartosc ) && $wartosc && ! array_is_list( $wartosc ) ) {
				$zapisane[ $klucz ] = is_array( $zapisane[ $klucz ] ) ? self::scal( $wartosc, $zapisane[ $klucz ] ) : $wartosc;
			}
		}
		return $zapisane;
	}

	/**
	 * Tekst bez znaczników. sanitize_text_field() zapisuje samotne „<” jako „&lt;”, więc odkodowujemy encje:
	 * teksty i tak są escapowane przy każdym wyświetleniu, a „<10%” ma zostać „<10%”.
	 */
	public static function tekst( $wartosc, int $max ): string {
		return mb_substr( trim( wp_specialchars_decode( sanitize_text_field( is_scalar( $wartosc ) ? (string) $wartosc : '' ), ENT_QUOTES ) ), 0, $max );
	}

	private static function akapit( $wartosc, int $max ): string {
		return mb_substr( trim( wp_specialchars_decode( sanitize_textarea_field( is_scalar( $wartosc ) ? (string) $wartosc : '' ), ENT_QUOTES ) ), 0, $max );
	}

	private static function liczba( $wartosc, int $min, int $max, int $domyslna ): int {
		return is_numeric( $wartosc ) ? max( $min, min( $max, (int) $wartosc ) ) : $domyslna;
	}

	private static function tak( $wartosc ): bool {
		return in_array( $wartosc, array( true, 1, '1', 'tak', 'on', 'true' ), true );
	}

	private static function unikalny( string $id, array &$zajete, string $zapas ): string {
		$id   = $id ?: $zapas;
		$baza = $id;
		for ( $i = 2; in_array( $id, $zajete, true ); $i++ ) {
			$id = $baza . '-' . $i;
		}
		$zajete[] = $id;
		return $id;
	}
}
