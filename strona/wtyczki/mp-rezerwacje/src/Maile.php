<?php
namespace MP\Rezerwacje;

defined( 'ABSPATH' ) || exit;

/**
 * E-maile do klienta (potwierdzenie z plikiem .ics, przypomnienie, zmiana, odwołanie)
 * i do właściciela (nowa rezerwacja, zmiana, odwołanie). Wysyłka przez wp_mail().
 */
final class Maile {

	/**
	 * Wiadomość do klienta.
	 *
	 * @param string $rodzaj potwierdzenie | przypomnienie | zmiana | odwolanie
	 * @param string $powod  Powód odwołania (gdy odwołuje właściciel).
	 */
	public static function do_klienta( array $rez, string $rodzaj, string $powod = '' ): bool {
		if ( ! is_email( $rez['email'] ) ) {
			return false;
		}
		$od      = Czas::z_bazy( $rez['poczatek'] );
		$wizyta  = self::nazwa_wizyty( $rez );
		$kiedy   = Czas::kiedy( $od );
		$imie    = trim( strtok( $rez['imie'], ' ' ) ?: '' );
		$link    = Rezerwacje::link_zarzadzania( $rez );
		$moze    = Rezerwacje::mozna_zmieniac( $rez );
		$teksty  = array(
			'imie'   => $imie,
			'wizyta' => $wizyta,
			'kiedy'  => $kiedy,
			'termin' => Czas::termin( $od, Czas::z_bazy( $rez['koniec'] ) ),
		);
		$m       = array(
			'przyciski' => array(),
			'po'        => '',
		);
		$ics     = '';

		switch ( $rodzaj ) {
			case 'przypomnienie':
				$m['temat']     = "Przypomnienie: {$wizyta} {$kiedy}";
				$m['naglowek']  = 'Do zobaczenia ' . $kiedy;
				$m['wstep']     = (string) Ustawienia::get( 'maile.przypomnienie_tekst' );
				$m['przyciski'] = array( array( 'Dodaj do Kalendarza Google', Rezerwacje::link_google( $rez ), false ) );
				if ( $moze ) {
					$m['po'] = 'Jeśli coś się zmieniło, możesz <a href="' . esc_url( $link ) . '">zmienić termin albo odwołać spotkanie</a>.';
				}
				break;

			case 'zmiana':
				$m['temat']     = "Nowy termin: {$wizyta}, " . Czas::data_krotka( $od ) . ', ' . Czas::godzina( $od );
				$m['naglowek']  = 'Nowy termin: ' . $kiedy;
				$m['wstep']     = 'Termin spotkania został zmieniony. Poprzedni termin jest już nieaktualny.';
				$m['przyciski'] = array( array( 'Dodaj do Kalendarza Google', Rezerwacje::link_google( $rez ), true ) );
				$m['po']        = 'Plik .ics w załączniku zaktualizuje termin w Twoim kalendarzu. Zmienić go jeszcze raz albo odwołać możesz <a href="' . esc_url( $link ) . '">tutaj</a>.';
				$ics            = self::ics( $rez );
				break;

			case 'odwolanie':
				$m['temat']     = "Odwołane: {$wizyta}, " . Czas::data_krotka( $od ) . ', ' . Czas::godzina( $od );
				$m['naglowek']  = 'Spotkanie odwołane';
				$m['wstep']     = 'klient' === $rez['odwolal'] ? 'Potwierdzam odwołanie spotkania. Jeśli zechcesz, umów się w innym terminie.' : 'Niestety muszę odwołać nasze spotkanie.' . ( '' !== $powod ? "\n\n" . $powod : '' ) . "\n\nPrzepraszam za kłopot. Wybierz, proszę, inny termin.";
				$m['przyciski'] = array( array( 'Umów nowy termin', $rez['zrodlo'] ?: home_url( '/' ), true ) );
				$ics            = self::ics( $rez, 'CANCEL' );
				break;

			default:
				$m['temat']     = "Potwierdzenie: {$wizyta}, " . Czas::data_krotka( $od ) . ', ' . Czas::godzina( $od );
				$m['naglowek']  = 'Do zobaczenia ' . $kiedy;
				$m['wstep']     = (string) Ustawienia::get( 'maile.potwierdzenie' );
				$m['przyciski'] = array( array( 'Dodaj do Kalendarza Google', Rezerwacje::link_google( $rez ), true ) );
				$m['po']        = 'W załączniku jest plik .ics do każdego kalendarza (Apple, Outlook).';
				if ( $moze ) {
					$m['po'] .= ' Gdy coś się zmieni, możesz <a href="' . esc_url( $link ) . '">zmienić termin albo odwołać spotkanie</a>.';
				}
				$ics = self::ics( $rez );
		}

		$m['wstep']      = ( $imie ? "Dzień dobry, {$imie}!\n\n" : "Dzień dobry!\n\n" ) . self::wstaw( $m['wstep'], $teksty );
		$m['szczegoly']  = self::szczegoly( $rez, false );
		$m['podpis']     = (string) ( Ustawienia::get( 'maile.podpis' ) ?: Ustawienia::nazwa_wlasciciela() );
		$m['stopka']     = 'Ta wiadomość dotyczy spotkania umówionego na stronie ' . wp_parse_url( home_url(), PHP_URL_HOST ) . '.';
		$naglowki        = array( 'Reply-To: ' . Ustawienia::adresy_wlasciciela()[0] );

		return self::wyslij( $rez['email'], $m, $naglowki, $ics );
	}

	/**
	 * Wiadomość do właściciela.
	 *
	 * @param string $rodzaj nowa | zmiana | odwolana
	 */
	public static function do_wlasciciela( array $rez, string $rodzaj, string $dodatek = '' ): bool {
		$od     = Czas::z_bazy( $rez['poczatek'] );
		$wizyta = self::nazwa_wizyty( $rez );
		$kiedy  = Czas::data_krotka( $od ) . ' ' . Czas::godzina( $od );
		$m      = array(
			'przyciski' => array( array( 'Otwórz rezerwacje', admin_url( 'admin.php?page=mp-rezerwacje' ), true ) ),
			'po'        => 'Odpowiedź na tę wiadomość trafi prosto do klienta.',
		);
		$ics    = '';

		switch ( $rodzaj ) {
			case 'zmiana':
				$m['temat']    = "Zmiana terminu: {$rez['imie']}, teraz {$kiedy}";
				$m['naglowek'] = 'Klient zmienił termin';
				$m['wstep']    = $dodatek;
				break;
			case 'odwolana':
				$m['temat']    = "Odwołana rezerwacja: {$kiedy}, {$rez['imie']}";
				$m['naglowek'] = 'Klient odwołał spotkanie';
				$m['wstep']    = $dodatek ? "Powód podany przez klienta:\n" . $dodatek : 'Termin jest znowu wolny w kalendarzu na stronie.';
				break;
			default:
				$m['temat']    = "Nowa rezerwacja: {$kiedy}, {$rez['imie']}";
				$m['naglowek'] = 'Nowa rezerwacja: ' . $wizyta;
				$m['wstep']    = Google::polaczony() ? 'Spotkanie jest już w Kalendarzu Google.' : 'Plik .ics w załączniku doda spotkanie do Twojego kalendarza.';
				if ( ! Google::polaczony() ) {
					$ics = self::ics( $rez, 'PUBLISH', true );
				}
		}
		if ( 'potwierdzona' === $rez['status'] && '' !== $rez['google_blad'] ) {
			$m['wstep'] .= "\n\nUwaga: nie udało się zapisać spotkania w Kalendarzu Google (" . $rez['google_blad'] . '). Wpisz je ręcznie albo ponów zapis w panelu.';
		}
		$m['szczegoly'] = self::szczegoly( $rez, true );
		$m['podpis']    = '';
		$m['stopka']    = 'Powiadomienie z wtyczki MP Rezerwacje na stronie ' . wp_parse_url( home_url(), PHP_URL_HOST ) . '.';

		$odpowiedz = is_email( $rez['email'] ) ? array( 'Reply-To: ' . str_replace( array( ',', ';', '<', '>', '"' ), '', $rez['imie'] ) . ' <' . $rez['email'] . '>' ) : array();
		$wynik     = true;
		foreach ( Ustawienia::adresy_wlasciciela() as $adres ) {
			$wynik = self::wyslij( $adres, $m, $odpowiedz, $ics ) && $wynik;
		}
		return $wynik;
	}

	/**
	 * Plik iCalendar (RFC 5545) z tym samym UID przy zmianach, żeby kalendarz klienta podmienił wpis.
	 * Wersja dla właściciela ma w opisie dane klienta zamiast linku do zmiany terminu.
	 */
	public static function ics( array $rez, string $metoda = 'PUBLISH', bool $dla_wlasciciela = false ): string {
		$host    = (string) wp_parse_url( home_url(), PHP_URL_HOST );
		$miejsce = 'online' === $rez['forma'] ? (string) Ustawienia::get( 'miejsce.online' ) : ( 'na-miejscu' === $rez['forma'] ? (string) Ustawienia::get( 'miejsce.adres' ) : '' );
		$opis    = Ustawienia::forma_opis( $rez['forma'], $dla_wlasciciela ? '' : $rez['telefon'] );
		if ( $dla_wlasciciela ) {
			$opis .= "\n\n" . $rez['imie'] . "\n" . $rez['email'] . ( $rez['telefon'] ? "\n" . $rez['telefon'] : '' );
			foreach ( $rez['odpowiedzi'] as $o ) {
				$opis .= "\n" . $o['etykieta'] . ': ' . $o['wartosc'];
			}
		} elseif ( 'CANCEL' !== $metoda && Rezerwacje::mozna_zmieniac( $rez ) ) {
			$opis .= "\n\nZmiana terminu albo odwołanie: " . Rezerwacje::link_zarzadzania( $rez );
		}
		$tytul = self::nazwa_wizyty( $rez ) . ': ' . ( $dla_wlasciciela ? $rez['imie'] : Ustawienia::nazwa_wlasciciela() );
		$wlasciciel = Ustawienia::adresy_wlasciciela()[0];
		$linie      = array(
			'BEGIN:VCALENDAR',
			'VERSION:2.0',
			'PRODID:-//MP Rezerwacje//PL',
			'CALSCALE:GREGORIAN',
			'METHOD:' . $metoda,
			'BEGIN:VEVENT',
			'UID:rezerwacja-' . $rez['id'] . '-' . substr( $rez['token'], 0, 8 ) . '@' . $host,
			'SEQUENCE:' . ( (int) $rez['sekwencja'] + ( 'CANCEL' === $metoda ? 1 : 0 ) ),
			'DTSTAMP:' . gmdate( 'Ymd\THis\Z' ),
			'DTSTART:' . gmdate( 'Ymd\THis\Z', strtotime( $rez['poczatek'] . ' UTC' ) ),
			'DTEND:' . gmdate( 'Ymd\THis\Z', strtotime( $rez['koniec'] . ' UTC' ) ),
			'SUMMARY:' . self::ics_tekst( $tytul ),
			'DESCRIPTION:' . self::ics_tekst( $opis ),
			'LOCATION:' . self::ics_tekst( $miejsce ),
			'ORGANIZER;CN=' . self::ics_tekst( Ustawienia::nazwa_wlasciciela() ) . ':mailto:' . $wlasciciel,
			'STATUS:' . ( 'CANCEL' === $metoda ? 'CANCELLED' : 'CONFIRMED' ),
		);
		if ( 'CANCEL' !== $metoda ) {
			array_push( $linie, 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' . self::ics_tekst( self::nazwa_wizyty( $rez ) ), 'TRIGGER:-PT1H', 'END:VALARM' );
		}
		array_push( $linie, 'END:VEVENT', 'END:VCALENDAR' );
		return implode( "\r\n", array_map( array( self::class, 'zawin' ), $linie ) ) . "\r\n";
	}

	/** Testowe potwierdzenie z przykładowymi danymi (przycisk w panelu). */
	public static function test( string $adres ): bool {
		$start = Czas::dzis()->modify( '+3 days' )->setTime( 10, 0 );
		$wiz   = Ustawienia::wizyta();
		$rez   = array(
			'id'          => 0,
			'token'       => str_repeat( '0', 32 ),
			'status'      => 'potwierdzona',
			'wizyta'      => $wiz['id'],
			'poczatek'    => Czas::do_bazy( $start ),
			'koniec'      => Czas::do_bazy( $start->modify( '+' . $wiz['czas'] . ' minutes' ) ),
			'imie'        => 'Jan Testowy',
			'email'       => $adres,
			'telefon'     => '600 000 000',
			'forma'       => $wiz['formy'][0],
			'odpowiedzi'  => array_map(
				fn( $p ) => array(
					'id'       => $p['id'],
					'etykieta' => $p['etykieta'],
					'wartosc'  => $p['opcje'][0] ?? 'Przykładowa odpowiedź',
				),
				Ustawienia::pytania()
			),
			'zrodlo'      => home_url( '/' ),
			'google_id'   => '',
			'google_blad' => '',
			'odwolal'     => '',
			'sekwencja'   => 0,
		);
		return self::do_klienta( $rez, 'potwierdzenie' );
	}

	/* ---------- Pomocnicze ---------- */

	/** Wiersze tabeli szczegółów: [etykieta, wartość w HTML]. */
	private static function szczegoly( array $rez, bool $dla_wlasciciela ): array {
		$od      = Czas::z_bazy( $rez['poczatek'] );
		$do      = Czas::z_bazy( $rez['koniec'] );
		$wiersze = array(
			array( 'Termin', esc_html( Czas::wielka( Czas::termin( $od, $do ) ) ) ),
			array( 'Spotkanie', esc_html( self::nazwa_wizyty( $rez ) . ', ' . Czas::dlugosc( (int) round( ( $do->getTimestamp() - $od->getTimestamp() ) / 60 ) ) ) ),
			array( 'Forma', make_clickable( esc_html( Ustawienia::forma_opis( $rez['forma'], $dla_wlasciciela ? '' : $rez['telefon'] ) ) ) ),
		);
		if ( $dla_wlasciciela ) {
			$wiersze[] = array( 'Klient', esc_html( $rez['imie'] ) );
			$wiersze[] = array( 'E-mail', '<a href="mailto:' . esc_attr( $rez['email'] ) . '">' . esc_html( $rez['email'] ) . '</a>' );
			if ( $rez['telefon'] ) {
				$wiersze[] = array( 'Telefon', '<a href="tel:' . esc_attr( preg_replace( '/[^\d+]/', '', $rez['telefon'] ) ) . '">' . esc_html( $rez['telefon'] ) . '</a>' );
			}
		}
		foreach ( $rez['odpowiedzi'] as $o ) {
			$wiersze[] = array( esc_html( $o['etykieta'] ), nl2br( esc_html( $o['wartosc'] ) ) );
		}
		return $wiersze;
	}

	private static function wyslij( string $do, array $m, array $naglowki, string $ics = '' ): bool {
		$m['zajawka']    = wp_strip_all_tags( strtok( $m['wstep'], "\n" ) ?: $m['naglowek'] );
		$m['kolor']      = (string) ( Ustawienia::get( 'wyglad.glowny' ) ?: '#161514' );
		$m['na_kolorze'] = Front::kontrast( $m['kolor'] );
		$html            = self::szablon( $m );
		$tekst           = self::tekst( $m );

		$naglowki[] = 'Content-Type: text/html; charset=UTF-8';
		$nadawca    = (string) ( Ustawienia::get( 'maile.nadawca' ) ?: Ustawienia::nazwa_wlasciciela() );
		$nazwa      = fn() => $nadawca;
		$alt        = function ( $phpmailer ) use ( $tekst ) {
			$phpmailer->AltBody = $tekst; // phpcs:ignore WordPress.NamingConventions.ValidVariableName
		};

		$zalaczniki = array();
		$katalog    = '';
		if ( '' !== $ics ) {
			$katalog = trailingslashit( get_temp_dir() ) . 'mp-rez-' . wp_generate_password( 12, false );
			if ( wp_mkdir_p( $katalog ) && false !== file_put_contents( $katalog . '/termin.ics', $ics ) ) {
				$zalaczniki[] = $katalog . '/termin.ics';
			}
		}

		add_filter( 'wp_mail_from_name', $nazwa );
		add_action( 'phpmailer_init', $alt );
		$wynik = wp_mail( $do, $m['temat'], $html, $naglowki, $zalaczniki );
		remove_filter( 'wp_mail_from_name', $nazwa );
		remove_action( 'phpmailer_init', $alt );

		if ( $katalog ) {
			wp_delete_file( $katalog . '/termin.ics' );
			@rmdir( $katalog ); // phpcs:ignore WordPress.PHP.NoSilencedErrors
		}
		if ( ! $wynik ) {
			Dziennik::zapisz( "Nie udało się wysłać e-maila „{$m['temat']}” do {$do}." );
		}
		return (bool) $wynik;
	}

	private static function szablon( array $m ): string {
		ob_start();
		include dirname( PLIK ) . '/szablony/mail.php';
		return (string) ob_get_clean();
	}

	/** Wersja tekstowa tej samej wiadomości (dla programów pocztowych bez HTML). */
	private static function tekst( array $m ): string {
		$linie = array( $m['naglowek'], '', $m['wstep'], '' );
		foreach ( $m['szczegoly'] as list( $etykieta, $wartosc ) ) {
			$linie[] = wp_strip_all_tags( $etykieta ) . ': ' . wp_specialchars_decode( wp_strip_all_tags( $wartosc ), ENT_QUOTES );
		}
		$linie[] = '';
		foreach ( $m['przyciski'] as list( $napis, $adres ) ) {
			$linie[] = $napis . ': ' . $adres;
		}
		if ( $m['po'] ) {
			$linie[] = wp_strip_all_tags( preg_replace( '/<a href="([^"]+)">([^<]+)<\/a>/', '$2 ($1)', $m['po'] ) );
		}
		if ( $m['podpis'] ) {
			array_push( $linie, '', $m['podpis'] );
		}
		return implode( "\n", $linie );
	}

	private static function nazwa_wizyty( array $rez ): string {
		return (string) ( Ustawienia::wizyta( $rez['wizyta'] )['nazwa'] ?? Czas::wielka( str_replace( '-', ' ', $rez['wizyta'] ) ) );
	}

	/** {imie}, {wizyta}, {kiedy}, {termin} w tekstach z ustawień. */
	private static function wstaw( string $tekst, array $wartosci ): string {
		foreach ( $wartosci as $klucz => $wartosc ) {
			$tekst = str_replace( '{' . $klucz . '}', $wartosc, $tekst );
		}
		return $tekst;
	}

	private static function ics_tekst( string $tekst ): string {
		return str_replace( array( '\\', ';', ',', "\r\n", "\n" ), array( '\\\\', '\;', '\,', '\n', '\n' ), $tekst );
	}

	/** Linie dłuższe niż 75 bajtów zawijane bez rozcinania polskich znaków. */
	private static function zawin( string $linia ): string {
		if ( strlen( $linia ) <= 75 ) {
			return $linia;
		}
		$wynik  = '';
		$biezac = '';
		foreach ( mb_str_split( $linia ) as $znak ) {
			$limit = '' === $wynik ? 75 : 74;
			if ( strlen( $biezac . $znak ) > $limit ) {
				$wynik .= ( '' === $wynik ? '' : "\r\n " ) . $biezac;
				$biezac = '';
			}
			$biezac .= $znak;
		}
		return $wynik . "\r\n " . $biezac;
	}
}
