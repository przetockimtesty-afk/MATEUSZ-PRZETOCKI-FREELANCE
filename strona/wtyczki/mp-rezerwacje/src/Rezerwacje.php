<?php
namespace MP\Rezerwacje;

use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Rezerwacja od początku do końca: sprawdzenie danych, zapis bez podwójnych terminów,
 * Kalendarz i Arkusz Google, e-maile, zmiana terminu, odwołanie i przypomnienia.
 */
final class Rezerwacje {

	const BLOKADA = 'mp_rezerwacje_blokada';

	/** Nowe rezerwacje do dokończenia po wysłaniu odpowiedzi HTTP. */
	private static array $w_tle = array();

	/** Nowa rezerwacja z formularza. Zwraca podsumowanie dla przeglądarki albo WP_Error. */
	public static function utworz( array $dane ) {
		$wizyta = Ustawienia::wizyta( self::tekst_z( $dane, 'wizyta' ) );
		if ( ! $wizyta ) {
			return self::blad( 'wizyta', 'Wybierz rodzaj spotkania.', 400 );
		}
		if ( '' !== trim( self::tekst_z( $dane, 'www' ) ) ) {
			return self::blad( 'spam', 'Nie udało się zapisać rezerwacji. Odśwież stronę i spróbuj ponownie.', 400 );
		}
		// Ten sam formularz wysłany drugi raz (zerwane połączenie, podwójne kliknięcie) dostaje tę samą rezerwację.
		$klucz = self::klucz( self::tekst_z( $dane, 'klucz' ) );
		$jest  = $klucz ? Baza::po_kluczu( $klucz ) : null;
		if ( $jest ) {
			return self::podsumowanie( $jest );
		}
		$start = Czas::z_iso( self::tekst_z( $dane, 'start' ) );
		if ( ! $start ) {
			return self::blad( 'termin', 'Wybierz termin w kalendarzu.', 400 );
		}

		$pola  = array();
		$imie  = Ustawienia::tekst( self::tekst_z( $dane, 'imie' ), 120 );
		$email = sanitize_email( self::tekst_z( $dane, 'email' ) );
		if ( mb_strlen( $imie ) < 2 ) {
			$pola['imie'] = 'Podaj imię i nazwisko.';
		}
		if ( ! is_email( $email ) ) {
			$pola['email'] = 'Sprawdź adres e-mail.';
		}

		$forma = self::tekst_z( $dane, 'forma' );
		if ( ! in_array( $forma, $wizyta['formy'], true ) ) {
			if ( 1 === count( $wizyta['formy'] ) ) {
				$forma = $wizyta['formy'][0];
			} else {
				$pola['forma'] = 'Wybierz, jak chcesz się spotkać.';
			}
		}

		$tryb    = 'telefon' === $forma ? 'wymagany' : (string) Ustawienia::get( 'telefon' );
		$telefon = self::telefon( self::tekst_z( $dane, 'telefon' ) );
		if ( 'ukryty' === $tryb ) {
			$telefon = '';
		} elseif ( false === $telefon ) {
			$pola['telefon'] = 'Sprawdź numer telefonu.';
		} elseif ( 'wymagany' === $tryb && '' === $telefon ) {
			$pola['telefon'] = 'Podaj numer telefonu.';
		}

		$odpowiedzi = array();
		$wyslane    = is_array( $dane['odpowiedzi'] ?? null ) ? $dane['odpowiedzi'] : array();
		foreach ( Ustawienia::pytania() as $p ) {
			$wartosc = is_scalar( $wyslane[ $p['id'] ] ?? null ) ? (string) $wyslane[ $p['id'] ] : '';
			$wartosc = 'dlugi' === $p['typ'] ? mb_substr( trim( sanitize_textarea_field( $wartosc ) ), 0, 2000 ) : mb_substr( trim( sanitize_text_field( $wartosc ) ), 0, 300 );
			$wartosc = wp_specialchars_decode( $wartosc, ENT_QUOTES ); // „<10%” zamiast „&lt;10%”; wszędzie przy wyświetlaniu jest escapowanie.
			if ( $p['opcje'] && '' !== $wartosc && ! in_array( $wartosc, $p['opcje'], true ) ) {
				$wartosc = '';
			}
			if ( '' === $wartosc ) {
				if ( $p['wymagane'] ) {
					$pola[ 'p_' . $p['id'] ] = 'To pytanie jest wymagane.';
				}
				continue;
			}
			$odpowiedzi[] = array(
				'id'       => $p['id'],
				'etykieta' => $p['etykieta'],
				'wartosc'  => $wartosc,
			);
		}

		if ( empty( $dane['zgoda'] ) ) {
			$pola['zgoda'] = 'Bez tej zgody nie mogę przyjąć rezerwacji.';
		}
		if ( $pola ) {
			return new WP_Error(
				'pola',
				'Popraw zaznaczone pola.',
				array(
					'status' => 400,
					'pola'   => $pola,
				)
			);
		}
		if ( ! self::limit_adresu( false ) ) {
			return self::blad( 'limit', 'Z tego adresu wysłano już kilka rezerwacji. Spróbuj za godzinę.', 429 );
		}

		$zrodlo = wp_validate_redirect( esc_url_raw( self::tekst_z( $dane, 'strona' ) ), '' );
		if ( ! self::zablokuj() ) {
			return self::blad( 'zajety', 'Serwer jest chwilę zajęty. Spróbuj ponownie za kilka sekund.', 503 );
		}
		try {
			$jest = $klucz ? Baza::po_kluczu( $klucz ) : null;
			if ( $jest ) {
				return self::podsumowanie( $jest );
			}
			if ( ! Dostepnosc::czy_wolny( $wizyta, $start ) ) {
				return self::blad( 'termin_zajety', 'Ktoś właśnie zajął ten termin. Wybierz, proszę, inny.', 409 );
			}
			$id = Baza::dodaj(
				array_filter( array( 'klucz' => $klucz ) ) + array(
					'w_tle'      => 'nowa',
					'wizyta'     => $wizyta['id'],
					'poczatek'   => Czas::do_bazy( $start ),
					'koniec'     => Czas::do_bazy( $start->modify( '+' . (int) $wizyta['czas'] . ' minutes' ) ),
					'imie'       => $imie,
					'email'      => $email,
					'telefon'    => (string) $telefon,
					'forma'      => $forma,
					'odpowiedzi' => $odpowiedzi,
					'zrodlo'     => mb_substr( $zrodlo, 0, 255 ),
				)
			);
		} finally {
			self::odblokuj();
		}
		if ( ! $id ) {
			Dziennik::zapisz( 'Zapis rezerwacji w bazie: ' . ( Baza::ostatni_blad() ?: 'nieznany błąd' ) );
			return self::blad( 'baza', 'Nie udało się zapisać rezerwacji. Spróbuj ponownie.', 500 );
		}
		self::limit_adresu( true );
		self::w_tle( $id );

		return self::podsumowanie( Baza::po_id( $id ) );
	}

	/**
	 * Kalendarz Google i e-maile nowej rezerwacji idą po wysłaniu odpowiedzi do przeglądarki (PHP-FPM, LiteSpeed),
	 * a gdzie się nie da, przez WP-Cron uruchomiony w tle. Klient od razu widzi „Do zobaczenia”,
	 * nawet gdy serwer poczty odpowiada wolno.
	 */
	private static function w_tle( int $id ): void {
		wp_schedule_single_event( time(), 'mp_rezerwacje_w_tle', array( $id ) );
		if ( ! self::$w_tle ) {
			add_action( 'shutdown', array( self::class, 'po_odpowiedzi' ), 0 );
		}
		self::$w_tle[] = $id;
	}

	public static function po_odpowiedzi(): void {
		if ( function_exists( 'fastcgi_finish_request' ) ) {
			fastcgi_finish_request();
		} elseif ( function_exists( 'litespeed_finish_request' ) ) {
			litespeed_finish_request();
		} else {
			spawn_cron();
			return;
		}
		ignore_user_abort( true );
		foreach ( self::$w_tle as $id ) {
			self::dokoncz_nowa( $id );
		}
	}

	/** Zadanie w tle nowej rezerwacji: Kalendarz i Arkusz Google, potwierdzenie dla klienta, powiadomienie. */
	public static function dokoncz_nowa( $id ): void {
		$id      = (int) $id;
		$blokada = 'mp_rezerwacje_w_tle_' . $id;
		if ( ! add_option( $blokada, time(), '', false ) ) {
			if ( time() - (int) get_option( $blokada ) < 5 * MINUTE_IN_SECONDS ) {
				return;
			}
			update_option( $blokada, time(), false );
		}
		try {
			$rez = Baza::po_id( $id );
			if ( ! $rez || 'nowa' !== $rez['w_tle'] ) {
				return;
			}
			// Znacznik znika przed wysyłką: gdyby proces przerwał się w połowie, e-maile nie pójdą drugi raz.
			Baza::zmien( $id, array( 'w_tle' => '' ) );
			if ( 'potwierdzona' === $rez['status'] ) {
				if ( '' === $rez['google_id'] ) {
					$rez = self::do_google( $rez, 'nowa' );
				}
				Maile::do_klienta( $rez, 'potwierdzenie' );
				Maile::do_wlasciciela( $rez, 'nowa' );
			}
			do_action( 'mp_rezerwacje_nowa', $rez );
		} finally {
			delete_option( $blokada );
		}
	}

	/** Zadanie co godzinę: nowe rezerwacje, których zadanie w tle się nie wykonało (np. przerwany proces). */
	public static function dokoncz_zalegle(): void {
		foreach ( Baza::czekajace_w_tle( gmdate( 'Y-m-d H:i:s', time() - 2 * MINUTE_IN_SECONDS ) ) as $id ) {
			self::dokoncz_nowa( $id );
		}
	}

	/** Usunięcie z panelu (np. próbnej rezerwacji): bez e-maila do klienta; wydarzenie znika też z Kalendarza Google. */
	public static function usun( array $rez ): bool {
		if ( '' !== $rez['google_id'] && Google::polaczony() ) {
			$wynik = Google::usun_wydarzenie( $rez );
			if ( is_wp_error( $wynik ) ) {
				Dziennik::zapisz( 'Kalendarz Google, usunięta rezerwacja #' . $rez['id'] . ': ' . $wynik->get_error_message() );
			}
		}
		$ok = Baza::usun( $rez['id'] );
		if ( $ok ) {
			do_action( 'mp_rezerwacje_usunieta', $rez );
		}
		return $ok;
	}

	/** Zmiana terminu przez klienta (link z e-maila). */
	public static function zmien_termin( array $rez, string $start_iso ) {
		if ( ! self::mozna_zmieniac( $rez ) ) {
			return self::blad( 'za_pozno', self::powod_blokady( $rez ), 403 );
		}
		$start = Czas::z_iso( $start_iso );
		if ( ! $start ) {
			return self::blad( 'termin', 'Wybierz nowy termin w kalendarzu.', 400 );
		}
		$wizyta = self::wizyta_rezerwacji( $rez );
		$stary  = Czas::termin( Czas::z_bazy( $rez['poczatek'] ), Czas::z_bazy( $rez['koniec'] ) );

		if ( ! self::zablokuj() ) {
			return self::blad( 'zajety', 'Serwer jest chwilę zajęty. Spróbuj ponownie za kilka sekund.', 503 );
		}
		try {
			// Świeży odczyt pod blokadą: właściciel mógł w tej chwili odwołać spotkanie.
			$rez = Baza::po_id( $rez['id'] );
			if ( ! $rez || ! self::mozna_zmieniac( $rez ) ) {
				return self::blad( 'za_pozno', $rez ? self::powod_blokady( $rez ) : 'Nie znaleziono rezerwacji.', 409 );
			}
			if ( ! Dostepnosc::czy_wolny( $wizyta, $start, $rez['id'] ) ) {
				return self::blad( 'termin_zajety', 'Ktoś właśnie zajął ten termin. Wybierz, proszę, inny.', 409 );
			}
			$zmieniona = Baza::zmien(
				$rez['id'],
				array(
					'poczatek'      => Czas::do_bazy( $start ),
					'koniec'        => Czas::do_bazy( $start->modify( '+' . (int) $wizyta['czas'] . ' minutes' ) ),
					'sekwencja'     => $rez['sekwencja'] + 1,
					'przypomnienie' => null,
					'zmieniona'     => gmdate( 'Y-m-d H:i:s' ),
				),
				'potwierdzona'
			);
			if ( ! $zmieniona ) {
				return self::blad( 'status', 'To spotkanie zostało właśnie odwołane.', 409 );
			}
		} finally {
			self::odblokuj();
		}

		$rez = self::do_google( Baza::po_id( $rez['id'] ), 'zmiana' );
		Maile::do_klienta( $rez, 'zmiana' );
		Maile::do_wlasciciela( $rez, 'zmiana', 'Poprzedni termin: ' . $stary . '.' );
		do_action( 'mp_rezerwacje_zmiana', $rez );

		return self::podsumowanie( $rez );
	}

	/**
	 * Odwołanie przez klienta (link z e-maila) albo właściciela (panel).
	 *
	 * @param string $kto klient | wlasciciel
	 */
	public static function odwolaj( array $rez, string $kto, string $powod = '', bool $powiadom = true ) {
		if ( ! self::zablokuj() ) {
			return self::blad( 'zajety', 'Serwer jest chwilę zajęty. Spróbuj ponownie za kilka sekund.', 503 );
		}
		try {
			$rez = Baza::po_id( $rez['id'] );
			if ( ! $rez || 'potwierdzona' !== $rez['status'] ) {
				return self::blad( 'status', 'To spotkanie jest już odwołane.', 409 );
			}
			if ( 'klient' === $kto && ! self::mozna_zmieniac( $rez ) ) {
				return self::blad( 'za_pozno', self::powod_blokady( $rez ), 403 );
			}
			$odwolana = Baza::zmien(
				$rez['id'],
				array(
					'status'    => 'odwolana',
					'odwolal'   => 'klient' === $kto ? 'klient' : 'wlasciciel',
					'zmieniona' => gmdate( 'Y-m-d H:i:s' ),
				),
				'potwierdzona'
			);
		} finally {
			self::odblokuj();
		}
		if ( ! $odwolana ) {
			return self::blad( 'status', 'To spotkanie jest już odwołane.', 409 );
		}
		$rez   = Baza::po_id( $rez['id'] );
		$powod = mb_substr( trim( sanitize_textarea_field( $powod ) ), 0, 1000 );

		$rez = self::do_google( $rez, 'odwolana' );
		if ( 'klient' === $kto ) {
			Maile::do_klienta( $rez, 'odwolanie' );
			Maile::do_wlasciciela( $rez, 'odwolana', $powod );
		} elseif ( $powiadom ) {
			Maile::do_klienta( $rez, 'odwolanie', $powod );
		}
		do_action( 'mp_rezerwacje_odwolana', $rez, $kto );
		return true;
	}

	/** Klient może sam zmienić albo odwołać spotkanie do X godzin przed jego początkiem. */
	public static function mozna_zmieniac( array $rez ): bool {
		$granica = strtotime( $rez['poczatek'] . ' UTC' ) - (int) Ustawienia::get( 'zasady.zmiany' ) * HOUR_IN_SECONDS;
		return 'potwierdzona' === $rez['status'] && time() < $granica;
	}

	public static function powod_blokady( array $rez ): string {
		if ( 'potwierdzona' !== $rez['status'] ) {
			return 'To spotkanie jest odwołane.';
		}
		if ( strtotime( $rez['koniec'] . ' UTC' ) < time() ) {
			return 'To spotkanie już się odbyło.';
		}
		$godziny = (int) Ustawienia::get( 'zasady.zmiany' );
		return sprintf(
			'Do spotkania zostało mniej niż %d %s, więc nie da się go już zmienić przez stronę. Napisz: %s.',
			$godziny,
			Czas::odmiana( $godziny, 'godzina', 'godziny', 'godzin' ),
			Ustawienia::adresy_wlasciciela()[0]
		);
	}

	/** Dane do ekranu „Do zobaczenia…” i strony zarządzania rezerwacją. */
	public static function podsumowanie( array $rez ): array {
		$od = Czas::z_bazy( $rez['poczatek'] );
		$do = Czas::z_bazy( $rez['koniec'] );
		return array(
			'status'     => $rez['status'],
			'kiedy'      => Czas::kiedy( $od ),
			'termin'     => Czas::wielka( Czas::termin( $od, $do ) ),
			'wizyta'     => self::wizyta_rezerwacji( $rez )['nazwa'] . ', ' . Czas::dlugosc( (int) round( ( $do->getTimestamp() - $od->getTimestamp() ) / 60 ) ),
			'forma'      => 'online' === $rez['forma'] && Ustawienia::get( 'miejsce.online' ) ? 'Online' : Ustawienia::forma_opis( $rez['forma'], $rez['telefon'] ),
			'link'       => 'online' === $rez['forma'] ? (string) Ustawienia::get( 'miejsce.online' ) : '',
			'email'      => $rez['email'],
			'odpowiedzi' => array_map( fn( $o ) => array( $o['etykieta'], $o['wartosc'] ), $rez['odpowiedzi'] ),
			'google'     => self::link_google( $rez ),
			'ics'        => self::link_ics( $rez ),
		);
	}

	public static function link_zarzadzania( array $rez ): string {
		return add_query_arg( 'mp_rezerwacja', $rez['token'], home_url( '/' ) );
	}

	public static function link_ics( array $rez ): string {
		return add_query_arg( 'plik', 'ics', self::link_zarzadzania( $rez ) );
	}

	/** Gotowy wpis do dodania w Kalendarzu Google klienta. */
	public static function link_google( array $rez ): string {
		$miejsce = 'online' === $rez['forma'] ? (string) Ustawienia::get( 'miejsce.online' ) : ( 'na-miejscu' === $rez['forma'] ? (string) Ustawienia::get( 'miejsce.adres' ) : '' );
		return add_query_arg(
			array_map(
				'rawurlencode',
				array(
					'action'   => 'TEMPLATE',
					'text'     => self::wizyta_rezerwacji( $rez )['nazwa'] . ': ' . Ustawienia::nazwa_wlasciciela(),
					'dates'    => gmdate( 'Ymd\THis\Z', strtotime( $rez['poczatek'] . ' UTC' ) ) . '/' . gmdate( 'Ymd\THis\Z', strtotime( $rez['koniec'] . ' UTC' ) ),
					'details'  => Ustawienia::forma_opis( $rez['forma'], $rez['telefon'] ),
					'location' => $miejsce,
				)
			),
			'https://calendar.google.com/calendar/render'
		);
	}

	/** Zadanie co godzinę: przypomnienia X godzin przed spotkaniem. */
	public static function wyslij_przypomnienia(): void {
		$godziny = (int) Ustawienia::get( 'maile.przypomnienie' );
		if ( $godziny <= 0 ) {
			return;
		}
		$teraz = time();
		foreach ( Baza::do_przypomnienia( gmdate( 'Y-m-d H:i:s', $teraz ), gmdate( 'Y-m-d H:i:s', $teraz + $godziny * HOUR_IN_SECONDS ) ) as $rez ) {
			// Kto umówił się (albo przełożył spotkanie) już w oknie przypomnienia, ma świeże potwierdzenie.
			$swieze = strtotime( $rez['poczatek'] . ' UTC' ) - strtotime( $rez['zmieniona'] . ' UTC' ) < $godziny * HOUR_IN_SECONDS;
			if ( $swieze || ! is_email( $rez['email'] ) || Maile::do_klienta( $rez, 'przypomnienie' ) ) {
				Baza::zmien( $rez['id'], array( 'przypomnienie' => gmdate( 'Y-m-d H:i:s' ) ) );
			}
		}
	}

	/** Ponowny zapis w Kalendarzu Google spotkań, przy których się nie udało (przycisk w panelu). */
	public static function ponow_google(): int {
		$udane = 0;
		foreach ( Baza::z_bledem_google() as $rez ) {
			$zdarzenie = 'odwolana' === $rez['status'] ? 'odwolana' : ( '' === $rez['google_id'] ? 'nowa' : 'zmiana' );
			$rez       = self::do_google( $rez, $zdarzenie, false );
			if ( '' === $rez['google_blad'] ) {
				++$udane;
			}
		}
		return $udane;
	}

	/* ---------- Pomocnicze ---------- */

	/** Zapis zdarzenia w Kalendarzu i Arkuszu Google. Błąd nie zatrzymuje rezerwacji, tylko trafia do panelu. */
	private static function do_google( array $rez, string $zdarzenie, bool $arkusz = true ): array {
		if ( Google::polaczony() ) {
			if ( 'odwolana' === $zdarzenie ) {
				$wynik  = Google::usun_wydarzenie( $rez );
				$zmiany = array(
					'google_id'   => '',
					'google_blad' => '',
				);
			} else {
				$wynik  = 'nowa' === $zdarzenie ? Google::dodaj_wydarzenie( $rez ) : Google::zmien_wydarzenie( $rez );
				$zmiany = is_wp_error( $wynik ) ? array() : array(
					'google_id'   => (string) $wynik,
					'google_blad' => '',
				);
			}
			if ( is_wp_error( $wynik ) ) {
				$zmiany = array( 'google_blad' => mb_substr( $wynik->get_error_message(), 0, 250 ) );
				Dziennik::zapisz( 'Kalendarz Google, rezerwacja #' . $rez['id'] . ': ' . $wynik->get_error_message() );
			}
			Baza::zmien( $rez['id'], $zmiany );
			$rez = array_merge( $rez, $zmiany );
		}
		if ( $arkusz && Google::arkusz_wlaczony() ) {
			$wynik = Google::dopisz_do_arkusza( $rez, $zdarzenie );
			if ( is_wp_error( $wynik ) ) {
				Dziennik::zapisz( 'Arkusz Google, rezerwacja #' . $rez['id'] . ': ' . $wynik->get_error_message() );
			}
		}
		return $rez;
	}

	/** Spotkanie z ustawień, a gdy ktoś je usunął albo zmienił: odtworzone z samej rezerwacji. */
	public static function wizyta_rezerwacji( array $rez ): array {
		return Ustawienia::wizyta( $rez['wizyta'] ) ?? array(
			'id'    => $rez['wizyta'],
			'nazwa' => Czas::wielka( str_replace( '-', ' ', $rez['wizyta'] ) ),
			'czas'  => (int) round( ( strtotime( $rez['koniec'] . ' UTC' ) - strtotime( $rez['poczatek'] . ' UTC' ) ) / 60 ),
			'formy' => array( $rez['forma'] ),
			'opis'  => '',
		);
	}

	/** Numer telefonu: pusty, poprawny albo false. */
	private static function telefon( string $numer ) {
		$numer = trim( sanitize_text_field( $numer ) );
		if ( '' === $numer ) {
			return '';
		}
		$cyfry = preg_replace( '/\D/', '', $numer );
		if ( strlen( $cyfry ) < 9 || strlen( $cyfry ) > 15 || preg_match( '/[^\d\s()+\-.]/', $numer ) ) {
			return false;
		}
		return mb_substr( $numer, 0, 40 );
	}

	/**
	 * Najwyżej 5 udanych rezerwacji na godzinę z jednego adresu IP (filtr `mp_rezerwacje_limit_ip`).
	 * Bez $zapisz tylko sprawdza, z $zapisz liczy udaną rezerwację.
	 */
	private static function limit_adresu( bool $zapisz ): bool {
		$adres = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
		$klucz = 'mp_rez_ip_' . md5( $adres . wp_salt( 'nonce' ) );
		$ile   = (int) get_transient( $klucz );
		if ( $zapisz ) {
			set_transient( $klucz, $ile + 1, HOUR_IN_SECONDS );
		}
		return $ile < (int) apply_filters( 'mp_rezerwacje_limit_ip', 5 );
	}

	/** Jedna rezerwacja naraz: dwie osoby klikające ten sam termin w tej samej sekundzie nie dostaną go obie. */
	private static function zablokuj(): bool {
		global $wpdb;
		for ( $proba = 0; $proba < 40; $proba++ ) {
			$wpdb->suppress_errors( true );
			$zalozona = $wpdb->query( $wpdb->prepare( "INSERT INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %s, 'no')", self::BLOKADA, (string) time() ) );
			$wpdb->suppress_errors( false );
			if ( $zalozona ) {
				return true;
			}
			$od = (int) $wpdb->get_var( $wpdb->prepare( "SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", self::BLOKADA ) );
			if ( $od && $od < time() - 30 ) {
				self::odblokuj();
				continue;
			}
			usleep( 250000 );
		}
		return false;
	}

	private static function odblokuj(): void {
		global $wpdb;
		$wpdb->delete( $wpdb->options, array( 'option_name' => self::BLOKADA ) );
	}

	/** Klucz formularza z przeglądarki zapisany jako skrót (pusty, gdy go nie ma albo ma zły format). */
	private static function klucz( string $z_przegladarki ): string {
		return preg_match( '/^[A-Za-z0-9-]{16,64}$/', $z_przegladarki ) ? md5( 'rez|' . $z_przegladarki ) : '';
	}

	/** Pole z formularza jako tekst (tablica albo obiekt w miejscu tekstu to pusty tekst). */
	private static function tekst_z( array $dane, string $klucz ): string {
		return is_scalar( $dane[ $klucz ] ?? null ) ? (string) $dane[ $klucz ] : '';
	}

	private static function blad( string $kod, string $tekst, int $status ): WP_Error {
		return new WP_Error( $kod, $tekst, array( 'status' => $status ) );
	}
}
