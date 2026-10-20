<?php
namespace MP\Rezerwacje;

use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Kalendarz Google i Arkusze Google przez konto usługi (bez logowania klienta i bez weryfikacji aplikacji).
 * Klient udostępnia swój kalendarz adresowi konta usługi z uprawnieniem „Wprowadzanie zmian w wydarzeniach”.
 * Konto usługi nie zaprasza gości (to wymaga Google Workspace), więc klient dostaje od nas e-mail z plikiem .ics.
 */
final class Google {

	const KALENDARZ = 'https://www.googleapis.com/calendar/v3';
	const ARKUSZE   = 'https://sheets.googleapis.com/v4/spreadsheets';
	const ZAKRES    = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/spreadsheets';

	/** Klucz konta usługi: stała MP_REZERWACJE_GOOGLE_KLUCZ (JSON albo ścieżka do pliku) albo opcja z panelu. */
	public static function klucz(): ?array {
		$surowy = defined( 'MP_REZERWACJE_GOOGLE_KLUCZ' ) ? (string) constant( 'MP_REZERWACJE_GOOGLE_KLUCZ' ) : (string) get_option( Ustawienia::KLUCZ, '' );
		if ( '' !== $surowy && ! str_starts_with( ltrim( $surowy ), '{' ) && is_readable( $surowy ) ) {
			$surowy = (string) file_get_contents( $surowy );
		}
		$klucz = json_decode( $surowy, true );
		return ( is_array( $klucz ) && ! empty( $klucz['client_email'] ) && ! empty( $klucz['private_key'] ) ) ? $klucz : null;
	}

	/** Opis problemu z wklejonym kluczem albo null, gdy klucz wygląda dobrze. */
	public static function sprawdz_klucz( string $json ): ?string {
		$klucz = json_decode( $json, true );
		if ( ! is_array( $klucz ) ) {
			return 'To nie jest plik JSON. Wklej całą zawartość pobranego pliku klucza.';
		}
		if ( 'service_account' !== ( $klucz['type'] ?? '' ) || empty( $klucz['client_email'] ) || empty( $klucz['private_key'] ) ) {
			return 'To nie jest klucz konta usługi (brak client_email albo private_key).';
		}
		if ( ! openssl_pkey_get_private( $klucz['private_key'] ) ) {
			return 'Klucz prywatny w pliku jest uszkodzony.';
		}
		return null;
	}

	public static function kalendarz(): string {
		return (string) Ustawienia::get( 'google.kalendarz' );
	}

	public static function polaczony(): bool {
		return null !== self::klucz() && '' !== self::kalendarz();
	}

	public static function arkusz_wlaczony(): bool {
		return null !== self::klucz() && '' !== (string) Ustawienia::get( 'google.arkusz' );
	}

	/** Czyści zapamiętany token i zajętość (po zmianie ustawień). */
	public static function wyczysc_pamiec(): void {
		$klucz = self::klucz();
		if ( $klucz ) {
			delete_transient( self::klucz_tokenu( $klucz ) );
		}
		delete_transient( 'mp_rez_fb_blad' );
		update_option( 'mp_rezerwacje_google_pamiec', time(), false );
	}

	/* ---------- Kalendarz ---------- */

	/** Zajęte przedziały [od, do] (znaczniki czasu) ze wszystkich sprawdzanych kalendarzy. */
	public static function zajetosc( int $od, int $do, bool $swieze = false ) {
		$kalendarze = array_values( array_unique( array_filter( array_merge( array( self::kalendarz() ), (array) Ustawienia::get( 'google.zajetosc' ) ) ) ) );
		$pamiec     = 'mp_rez_fb_' . md5( implode( '|', $kalendarze ) . "|$od|$do|" . get_option( 'mp_rezerwacje_google_pamiec' ) );
		if ( ! $swieze ) {
			$zapamietane = get_transient( $pamiec );
			if ( is_array( $zapamietane ) ) {
				return $zapamietane;
			}
			// Po błędzie przez minutę nie pytamy Google przy każdym odświeżeniu kalendarza.
			if ( get_transient( 'mp_rez_fb_blad' ) ) {
				return new WP_Error( 'google_przerwa', 'Google nie odpowiadał przed chwilą, sprawdzam ponownie za minutę.' );
			}
		}

		$zajete = array();
		for ( $a = $od; $a < $do; $a += 30 * DAY_IN_SECONDS ) {
			$odp = self::zapytanie(
				'POST',
				self::KALENDARZ . '/freeBusy',
				array(
					'timeMin' => gmdate( 'c', $a ),
					'timeMax' => gmdate( 'c', min( $do, $a + 30 * DAY_IN_SECONDS ) ),
					'items'   => array_map( fn( $id ) => array( 'id' => $id ), $kalendarze ),
				)
			);
			if ( is_wp_error( $odp ) ) {
				set_transient( 'mp_rez_fb_blad', 1, MINUTE_IN_SECONDS );
				return $odp;
			}
			foreach ( (array) ( $odp['calendars'] ?? array() ) as $id => $kalendarz ) {
				if ( ! empty( $kalendarz['errors'] ) ) {
					$opis = sprintf( 'brak dostępu do kalendarza %s (%s). Kalendarz musi być udostępniony adresowi %s.', $id, $kalendarz['errors'][0]['reason'] ?? 'błąd', self::klucz()['client_email'] ?? 'konta usługi' );
					// Dodatkowy kalendarz pomijamy; bez głównego zajętość z Google jest niepełna, więc to błąd całości.
					if ( 0 !== strcasecmp( (string) $id, self::kalendarz() ) ) {
						Dziennik::zapisz( 'Zajętość z Google: ' . $opis . ' Pomijam ten kalendarz.' );
						continue;
					}
					set_transient( 'mp_rez_fb_blad', 1, MINUTE_IN_SECONDS );
					return new WP_Error( 'google_dostep', $opis );
				}
				foreach ( (array) ( $kalendarz['busy'] ?? array() ) as $przedzial ) {
					$zajete[] = array( (int) strtotime( $przedzial['start'] ), (int) strtotime( $przedzial['end'] ) );
				}
			}
		}
		set_transient( $pamiec, $zajete, 90 );
		return $zajete;
	}

	/**
	 * Dodaje spotkanie do kalendarza, zwraca id wydarzenia. Id jest stałe dla rezerwacji, więc gdy pierwsza próba
	 * przekroczyła czas, a Google i tak zapisał wydarzenie, ponowienie dostaje 409 i tylko poprawia to wydarzenie.
	 */
	public static function dodaj_wydarzenie( array $rez ) {
		$id  = self::id_wydarzenia( $rez );
		$odp = self::zapytanie( 'POST', self::adres_wydarzen(), array( 'id' => $id ) + self::wydarzenie( $rez ) );
		if ( is_wp_error( $odp ) && 409 === ( $odp->get_error_data()['kod'] ?? 0 ) ) {
			$odp = self::zapytanie( 'PATCH', self::adres_wydarzen( $id ), self::wydarzenie( $rez ) + array( 'status' => 'confirmed' ) );
		}
		return is_wp_error( $odp ) ? $odp : (string) ( $odp['id'] ?? $id );
	}

	/** Id w alfabecie base32hex (litery a–v i cyfry), jak wymaga Google: „mp”, numer rezerwacji i początek tokenu. */
	private static function id_wydarzenia( array $rez ): string {
		return 'mp' . str_pad( (string) (int) $rez['id'], 6, '0', STR_PAD_LEFT ) . substr( (string) $rez['token'], 0, 20 );
	}

	public static function zmien_wydarzenie( array $rez ) {
		if ( '' === $rez['google_id'] ) {
			return self::dodaj_wydarzenie( $rez );
		}
		$odp = self::zapytanie( 'PATCH', self::adres_wydarzen( $rez['google_id'] ), self::wydarzenie( $rez ) );
		return is_wp_error( $odp ) ? $odp : (string) ( $odp['id'] ?? $rez['google_id'] );
	}

	/** Po usunięciu danych osobowych zostawia w kalendarzu tylko rodzaj spotkania (RODO). */
	public static function anonimizuj_wydarzenie( array $rez ) {
		if ( '' === $rez['google_id'] ) {
			return true;
		}
		$odp = self::zapytanie(
			'PATCH',
			self::adres_wydarzen( $rez['google_id'] ),
			array(
				'summary'     => Rezerwacje::wizyta_rezerwacji( $rez )['nazwa'] . ' (dane klienta usunięte)',
				'description' => '',
			)
		);
		if ( is_wp_error( $odp ) && in_array( $odp->get_error_data()['kod'] ?? 0, array( 404, 410 ), true ) ) {
			return true;
		}
		return is_wp_error( $odp ) ? $odp : true;
	}

	public static function usun_wydarzenie( array $rez ) {
		if ( '' === $rez['google_id'] ) {
			return true;
		}
		$odp = self::zapytanie( 'DELETE', self::adres_wydarzen( $rez['google_id'] ) );
		if ( is_wp_error( $odp ) && in_array( $odp->get_error_data()['kod'] ?? 0, array( 404, 410 ), true ) ) {
			return true;
		}
		return is_wp_error( $odp ) ? $odp : true;
	}

	private static function adres_wydarzen( string $id = '' ): string {
		return self::KALENDARZ . '/calendars/' . rawurlencode( self::kalendarz() ) . '/events' . ( $id ? '/' . rawurlencode( $id ) : '' );
	}

	private static function wydarzenie( array $rez ): array {
		$nazwa   = Rezerwacje::wizyta_rezerwacji( $rez )['nazwa'];
		$panel   = admin_url( 'admin.php?page=mp-rezerwacje' );
		$miejsce = 'online' === $rez['forma'] ? (string) Ustawienia::get( 'miejsce.online' ) : ( 'na-miejscu' === $rez['forma'] ? (string) Ustawienia::get( 'miejsce.adres' ) : '' );

		if ( 'minimalny' === Ustawienia::get( 'google.opis' ) ) {
			$tytul = $nazwa . ' (rezerwacja ze strony)';
			$opis  = "Szczegóły w panelu WordPress: {$panel}";
		} else {
			$tytul = $nazwa . ': ' . $rez['imie'];
			$linie = array(
				'Rezerwacja ze strony ' . wp_parse_url( home_url(), PHP_URL_HOST ),
				'',
				'Forma: ' . Ustawienia::forma_opis( $rez['forma'], $rez['telefon'] ),
				'E-mail: ' . $rez['email'],
			);
			if ( $rez['telefon'] ) {
				$linie[] = 'Telefon: ' . $rez['telefon'];
			}
			if ( $rez['odpowiedzi'] ) {
				$linie[] = '';
				foreach ( $rez['odpowiedzi'] as $o ) {
					$linie[] = $o['etykieta'] . ': ' . $o['wartosc'];
				}
			}
			$linie[] = '';
			$linie[] = "Panel: {$panel}";
			$opis    = implode( "\n", $linie );
		}

		// Google przyjmuje tylko nazwy stref (Europe/Warsaw); przy strefie „UTC+1” wystarcza przesunięcie w dacie.
		$strefa = str_contains( wp_timezone_string(), '/' ) ? array( 'timeZone' => wp_timezone_string() ) : array();
		return array(
			'summary'            => $tytul,
			'description'        => $opis,
			'location'           => $miejsce,
			'start'              => array( 'dateTime' => Czas::z_bazy( $rez['poczatek'] )->format( 'c' ) ) + $strefa,
			'end'                => array( 'dateTime' => Czas::z_bazy( $rez['koniec'] )->format( 'c' ) ) + $strefa,
			'extendedProperties' => array( 'private' => array( 'mp_rezerwacja' => (string) $rez['id'] ) ),
			'source'             => array(
				'title' => get_bloginfo( 'name' ),
				'url'   => home_url( '/' ),
			),
		);
	}

	/* ---------- Arkusz ---------- */

	/** Dopisuje wiersz do arkusza: nowa rezerwacja, zmiana terminu albo odwołanie. */
	public static function dopisz_do_arkusza( array $rez, string $zdarzenie ) {
		$od     = Czas::z_bazy( $rez['poczatek'] );
		$wiersz = array(
			Czas::teraz()->format( 'Y-m-d H:i' ),
			array(
				'nowa'     => 'Nowa',
				'zmiana'   => 'Zmiana terminu',
				'odwolana' => 'Odwołana',
			)[ $zdarzenie ] ?? $zdarzenie,
			$od->format( 'Y-m-d H:i' ),
			Rezerwacje::wizyta_rezerwacji( $rez )['nazwa'],
			$rez['imie'],
			$rez['email'],
			$rez['telefon'],
			Ustawienia::formy()[ $rez['forma'] ]['etykieta'] ?? $rez['forma'],
			'#' . $rez['id'],
		);
		$odpowiedzi = array_column( $rez['odpowiedzi'], 'wartosc', 'id' );
		foreach ( Ustawienia::pytania() as $pytanie ) {
			$wiersz[] = $odpowiedzi[ $pytanie['id'] ] ?? '';
		}
		return self::dopisz_wiersz( $wiersz );
	}

	/** Gdy arkusz jest pusty, wpisuje wiersz nagłówków. */
	public static function przygotuj_arkusz() {
		$odp = self::zapytanie( 'GET', self::ARKUSZE . '/' . rawurlencode( (string) Ustawienia::get( 'google.arkusz' ) ) . '/values/' . rawurlencode( self::zakres( 'A1:B1' ) ) );
		if ( is_wp_error( $odp ) ) {
			return $odp;
		}
		if ( ! empty( $odp['values'] ) ) {
			return 'Arkusz ma już nagłówki.';
		}
		$naglowki = array_merge( array( 'Zapisano', 'Zdarzenie', 'Termin', 'Spotkanie', 'Imię i nazwisko', 'E-mail', 'Telefon', 'Forma', 'Nr' ), array_column( Ustawienia::pytania(), 'etykieta' ) );
		$wynik    = self::dopisz_wiersz( $naglowki );
		return is_wp_error( $wynik ) ? $wynik : 'Dopisałem wiersz nagłówków.';
	}

	private static function dopisz_wiersz( array $wiersz ) {
		$adres = self::ARKUSZE . '/' . rawurlencode( (string) Ustawienia::get( 'google.arkusz' ) ) . '/values/' . rawurlencode( self::zakres( 'A1' ) ) . ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS';
		$odp   = self::zapytanie( 'POST', $adres, array( 'values' => array( array_map( 'strval', $wiersz ) ) ) );
		return is_wp_error( $odp ) ? $odp : true;
	}

	private static function zakres( string $komorki ): string {
		return "'" . str_replace( "'", "''", (string) Ustawienia::get( 'google.zakladka' ) ) . "'!" . $komorki;
	}

	/* ---------- Test połączenia z panelu ---------- */

	/** Lista sprawdzeń: [['nazwa' => …, 'ok' => bool, 'opis' => …], …]. */
	public static function test(): array {
		$wyniki = array();
		$dodaj  = function ( string $nazwa, $wynik, string $ok ) use ( &$wyniki ) {
			$wyniki[] = array(
				'nazwa' => $nazwa,
				'ok'    => ! is_wp_error( $wynik ),
				'opis'  => is_wp_error( $wynik ) ? $wynik->get_error_message() : $ok,
			);
			return ! is_wp_error( $wynik );
		};

		$klucz = self::klucz();
		if ( ! $dodaj( 'Klucz konta usługi', $klucz ? true : new WP_Error( 'brak', 'Brak klucza. Wklej plik JSON klucza konta usługi.' ), $klucz['client_email'] ?? '' ) ) {
			return $wyniki;
		}
		self::wyczysc_pamiec();
		if ( ! $dodaj( 'Logowanie do Google', self::token(), 'Działa.' ) ) {
			return $wyniki;
		}

		if ( '' === self::kalendarz() ) {
			$dodaj( 'Kalendarz', new WP_Error( 'brak', 'Wpisz adres kalendarza (zwykle adres Gmail klienta) i zapisz.' ), '' );
		} else {
			$zajetosc = self::zajetosc( time(), time() + 7 * DAY_IN_SECONDS, true );
			if ( $dodaj( 'Odczyt zajętości', $zajetosc, is_array( $zajetosc ) ? sprintf( 'Działa. Zajętych bloków w najbliższych 7 dniach: %d.', count( $zajetosc ) ) : '' ) ) {
				$start = Czas::dzis()->modify( '+400 days' )->setTime( 3, 0 );
				$id    = self::zapytanie(
					'POST',
					self::adres_wydarzen(),
					array(
						'summary' => 'Test połączenia (MP Rezerwacje)',
						'start'   => array( 'dateTime' => $start->format( 'c' ) ),
						'end'     => array( 'dateTime' => $start->modify( '+15 minutes' )->format( 'c' ) ),
					)
				);
				if ( ! is_wp_error( $id ) ) {
					self::zapytanie( 'DELETE', self::adres_wydarzen( (string) ( $id['id'] ?? '' ) ) );
				}
				$dodaj( 'Zapis wydarzeń', $id, 'Działa (testowe wydarzenie dodane i od razu usunięte).' );
			}
		}

		if ( '' !== (string) Ustawienia::get( 'google.arkusz' ) ) {
			$arkusz = self::przygotuj_arkusz();
			$dodaj( 'Arkusz Google', $arkusz, is_string( $arkusz ) ? $arkusz : 'Działa.' );
		}
		if ( ! in_array( false, array_column( $wyniki, 'ok' ), true ) ) {
			update_option( 'mp_rezerwacje_google_ok', time(), false ); // starsze problemy z dziennika przestają być ostrzeżeniem
		}
		return $wyniki;
	}

	/* ---------- Połączenie ---------- */

	/** Token dostępu (JWT podpisany kluczem konta usługi, ważny godzinę). */
	private static function token() {
		$klucz = self::klucz();
		if ( ! $klucz ) {
			return new WP_Error( 'google_klucz', 'brak klucza konta usługi.' );
		}
		$pamiec = self::klucz_tokenu( $klucz );
		$token  = get_transient( $pamiec );
		if ( is_string( $token ) && '' !== $token ) {
			return $token;
		}

		$teraz  = time();
		$adres  = $klucz['token_uri'] ?? 'https://oauth2.googleapis.com/token';
		$czesci = array(
			self::b64( (string) wp_json_encode( array( 'alg' => 'RS256', 'typ' => 'JWT' ) ) ),
			self::b64(
				(string) wp_json_encode(
					array(
						'iss'   => $klucz['client_email'],
						'scope' => self::ZAKRES,
						'aud'   => $adres,
						'iat'   => $teraz,
						'exp'   => $teraz + HOUR_IN_SECONDS,
					)
				)
			),
		);
		if ( ! openssl_sign( implode( '.', $czesci ), $podpis, $klucz['private_key'], OPENSSL_ALGO_SHA256 ) ) {
			return new WP_Error( 'google_podpis', 'nie udało się podpisać zapytania kluczem konta usługi.' );
		}
		$czesci[] = self::b64( $podpis );

		$odp = wp_remote_post(
			$adres,
			array(
				'timeout' => 10,
				'body'    => array(
					'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
					'assertion'  => implode( '.', $czesci ),
				),
			)
		);
		if ( is_wp_error( $odp ) ) {
			return new WP_Error( 'google_siec', 'brak połączenia z Google: ' . $odp->get_error_message() );
		}
		$json = json_decode( wp_remote_retrieve_body( $odp ), true );
		if ( empty( $json['access_token'] ) ) {
			return new WP_Error( 'google_token', 'Google odrzucił klucz: ' . ( $json['error_description'] ?? $json['error'] ?? 'HTTP ' . wp_remote_retrieve_response_code( $odp ) ) );
		}
		set_transient( $pamiec, $json['access_token'], max( 60, (int) ( $json['expires_in'] ?? 3600 ) - 300 ) );
		return $json['access_token'];
	}

	private static function klucz_tokenu( array $klucz ): string {
		return 'mp_rez_token_' . md5( $klucz['client_email'] . $klucz['private_key'] );
	}

	private static function zapytanie( string $metoda, string $adres, ?array $tresc = null ) {
		$token = self::token();
		if ( is_wp_error( $token ) ) {
			return $token;
		}
		$args = array(
			'method'  => $metoda,
			'timeout' => str_ends_with( $adres, '/freeBusy' ) ? 6 : 12,
			'headers' => array(
				'Authorization' => 'Bearer ' . $token,
				'Accept'        => 'application/json',
			),
		);
		if ( null !== $tresc ) {
			$args['headers']['Content-Type'] = 'application/json';
			$args['body']                    = wp_json_encode( $tresc );
		}
		$odp = wp_remote_request( $adres, $args );
		if ( is_wp_error( $odp ) ) {
			return new WP_Error( 'google_siec', 'brak połączenia z Google: ' . $odp->get_error_message() );
		}
		$kod  = (int) wp_remote_retrieve_response_code( $odp );
		$json = json_decode( wp_remote_retrieve_body( $odp ), true );
		if ( $kod >= 300 ) {
			if ( 401 === $kod ) {
				delete_transient( self::klucz_tokenu( (array) self::klucz() ) );
			}
			return new WP_Error( 'google_' . $kod, ( $json['error']['message'] ?? 'HTTP ' . $kod ), array( 'kod' => $kod ) );
		}
		return is_array( $json ) ? $json : array();
	}

	private static function b64( string $dane ): string {
		return rtrim( strtr( base64_encode( $dane ), '+/', '-_' ), '=' );
	}
}
