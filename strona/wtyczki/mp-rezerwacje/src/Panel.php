<?php
namespace MP\Rezerwacje;

defined( 'ABSPATH' ) || exit;

/**
 * Panel w WordPressie: menu „Rezerwacje” z listą spotkań (dla Redaktora i wyżej)
 * i ustawieniami w zakładkach (dla Administratora). Formularze idą przez admin-post.php.
 */
final class Panel {

	const STRONA     = 'mp-rezerwacje';
	const USTAWIENIA = 'mp-rezerwacje-ustawienia';
	const ZAKLADKI   = array(
		'spotkania'     => 'Spotkania',
		'dostepnosc'    => 'Dostępność',
		'formularz'     => 'Formularz',
		'powiadomienia' => 'Powiadomienia',
		'google'        => 'Google',
		'wyglad'        => 'Wygląd',
		'narzedzia'     => 'Narzędzia',
	);
	const WIDOKI     = array(
		'nadchodzace' => 'Nadchodzące',
		'minione'     => 'Minione',
		'odwolane'    => 'Odwołane',
		'wszystkie'   => 'Wszystkie',
	);

	public static function start(): void {
		add_action( 'admin_menu', array( self::class, 'menu' ) );
		add_action( 'admin_enqueue_scripts', array( self::class, 'zasoby' ) );
		add_action( 'admin_post_mp_rez_zapisz', array( self::class, 'zapisz' ) );
		add_action( 'admin_post_mp_rez_akcja', array( self::class, 'akcja' ) );
		add_action( 'wp_dashboard_setup', array( self::class, 'widget' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( PLIK ), array( self::class, 'linki_wtyczki' ) );
	}

	/** Kto widzi listę spotkań (filtr `mp_rezerwacje_uprawnienie`). Ustawienia zawsze manage_options. */
	public static function uprawnienie(): string {
		return (string) apply_filters( 'mp_rezerwacje_uprawnienie', 'edit_pages' );
	}

	public static function menu(): void {
		add_menu_page( 'Rezerwacje', 'Rezerwacje', self::uprawnienie(), self::STRONA, array( self::class, 'lista' ), 'dashicons-calendar-alt', 26 );
		add_submenu_page( self::STRONA, 'Spotkania', 'Spotkania', self::uprawnienie(), self::STRONA, array( self::class, 'lista' ) );
		add_submenu_page( self::STRONA, 'Ustawienia rezerwacji', 'Ustawienia', 'manage_options', self::USTAWIENIA, array( self::class, 'ustawienia' ) );

		// Licznik nowych rezerwacji dopisany po rejestracji, żeby nie zmieniać nazw haków strony.
		$nowe = self::nowe();
		if ( $nowe ) {
			global $menu;
			foreach ( $menu as $i => $pozycja ) {
				if ( self::STRONA === $pozycja[2] ) {
					$menu[ $i ][0] .= ' <span class="awaiting-mod count-' . $nowe . '"><span class="pending-count">' . $nowe . '</span></span>'; // phpcs:ignore WordPress.WP.GlobalVariablesOverride
				}
			}
		}
	}

	public static function linki_wtyczki( array $linki ): array {
		array_unshift( $linki, '<a href="' . esc_url( self::adres_ustawien() ) . '">Ustawienia</a>' );
		return $linki;
	}

	public static function zasoby(): void {
		$strona = sanitize_key( wp_unslash( $_GET['page'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification
		if ( ! in_array( $strona, array( self::STRONA, self::USTAWIENIA ), true ) ) {
			return;
		}
		$katalog = plugin_dir_url( PLIK ) . 'panel/';
		$wersja  = WERSJA . '-' . filemtime( dirname( PLIK ) . '/panel/panel.js' );
		wp_enqueue_style( 'mp-panel', $katalog . 'panel.css', array(), $wersja );
		wp_enqueue_script( 'mp-panel', $katalog . 'panel.js', array( 'jquery', 'wp-color-picker' ), $wersja, true );
		wp_add_inline_script(
			'mp-panel',
			'window.mpPanel = ' . wp_json_encode(
				array(
					'test'  => rest_url( Rest::NS . '/google/test' ),
					'nonce' => wp_create_nonce( 'wp_rest' ),
				)
			) . ';',
			'before'
		);
		if ( self::USTAWIENIA === $strona ) {
			wp_enqueue_media();
			wp_enqueue_style( 'wp-color-picker' );
			// Podgląd w zakładce Wygląd: style kalendarza i zmienne kolorów motywu strony.
			wp_enqueue_style( 'mp-rezerwacja-style' );
			wp_add_inline_style( 'mp-panel', wp_get_global_stylesheet( array( 'variables' ) ) );
		}
	}

	/* ---------- Lista spotkań ---------- */

	public static function lista(): void {
		// phpcs:disable WordPress.Security.NonceVerification
		$widok  = sanitize_key( wp_unslash( $_GET['widok'] ?? 'nadchodzace' ) );
		$widok  = array_key_exists( $widok, self::WIDOKI ) ? $widok : 'nadchodzace';
		$szukaj = sanitize_text_field( wp_unslash( $_GET['s'] ?? '' ) );
		$strona = max( 1, absint( $_GET['paged'] ?? 1 ) );
		// phpcs:enable

		list( $rezerwacje, $razem ) = Baza::lista( $widok, $szukaj, $strona );
		$liczniki                   = array();
		foreach ( array_keys( self::WIDOKI ) as $w ) {
			$liczniki[ $w ] = Baza::policz( $w );
		}
		$statystyki   = self::statystyki();
		$bledy_google = Google::polaczony() ? count( Baza::z_bledem_google() ) : 0;
		$stron        = (int) ceil( $razem / 50 );
		update_user_meta( get_current_user_id(), 'mp_rez_widziane', time() );

		include dirname( PLIK ) . '/panel/lista.php';
	}

	private static function statystyki(): array {
		$teraz = time();
		$dzis  = Czas::dzis();
		$utc   = fn( int $t ) => gmdate( 'Y-m-d H:i:s', $t );
		$mies  = $utc( $teraz - 30 * DAY_IN_SECONDS );
		return array(
			'Dziś'               => Baza::statystyka( 'poczatek', Czas::do_bazy( $dzis ), Czas::do_bazy( $dzis->modify( '+1 day' ) ) ),
			'Najbliższe 7 dni'   => Baza::statystyka( 'poczatek', $utc( $teraz ), $utc( $teraz + 7 * DAY_IN_SECONDS ) ),
			'Nowe w 30 dni'      => Baza::statystyka( 'utworzona', $mies, $utc( $teraz + 1 ) ) + Baza::statystyka( 'utworzona', $mies, $utc( $teraz + 1 ), 'odwolana' ),
			'Odwołane w 30 dni'  => Baza::statystyka( 'zmieniona', $mies, $utc( $teraz + 1 ), 'odwolana' ),
		);
	}

	/** Nowe rezerwacje od ostatniego otwarcia listy przez tego użytkownika. */
	private static function nowe(): int {
		if ( ! current_user_can( self::uprawnienie() ) ) {
			return 0;
		}
		$widziane = (int) get_user_meta( get_current_user_id(), 'mp_rez_widziane', true );
		return Baza::statystyka( 'utworzona', gmdate( 'Y-m-d H:i:s', $widziane ), gmdate( 'Y-m-d H:i:s', time() + 1 ) );
	}

	/** Kolumna „Termin”: godziny i podpis względny („za 2 dni”). */
	public static function kiedy( array $rez ): array {
		$od  = Czas::z_bazy( $rez['poczatek'] );
		$do  = Czas::z_bazy( $rez['koniec'] );
		$t   = $od->getTimestamp();
		$roz = $t > time() ? 'za ' . human_time_diff( time(), $t ) : human_time_diff( $t, time() ) . ' temu';
		return array( Czas::godzina( $od ) . '–' . Czas::godzina( $do ), $roz );
	}

	/* ---------- Ustawienia ---------- */

	public static function ustawienia(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'Brak uprawnień.', 403 );
		}
		$zakladka = sanitize_key( wp_unslash( $_GET['zakladka'] ?? 'spotkania' ) ); // phpcs:ignore WordPress.Security.NonceVerification
		$zakladka = array_key_exists( $zakladka, self::ZAKLADKI ) ? $zakladka : 'spotkania';
		$u        = Ustawienia::do_edycji();
		if ( 'wyglad' === $zakladka && function_exists( 'wp_print_font_faces' ) ) {
			wp_print_font_faces();
		}
		include dirname( PLIK ) . '/panel/ustawienia.php';
	}

	public static function adres_ustawien( string $zakladka = '' ): string {
		return add_query_arg( array_filter( array( 'page' => self::USTAWIENIA, 'zakladka' => $zakladka ) ), admin_url( 'admin.php' ) );
	}

	/** Zapis zakładki ustawień. */
	public static function zapisz(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'Brak uprawnień.', 403 );
		}
		check_admin_referer( 'mp_rez_zapisz' );
		$zakladka = sanitize_key( wp_unslash( $_POST['zakladka'] ?? 'spotkania' ) );
		$zmiany   = isset( $_POST['u'] ) && is_array( $_POST['u'] ) ? wp_unslash( $_POST['u'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- całość przechodzi przez Ustawienia::normalizuj().
		foreach ( (array) wp_unslash( $_POST['listy'] ?? array() ) as $lista ) {
			$lista = sanitize_key( $lista );
			if ( in_array( $lista, Ustawienia::LISTY, true ) && ! isset( $zmiany[ $lista ] ) ) {
				$zmiany[ $lista ] = array();
			}
		}

		$bledy  = array();
		$obecne = Ustawienia::do_edycji();
		Ustawienia::zapisz( Ustawienia::normalizuj( Ustawienia::nadpisz( $obecne, $zmiany ), $bledy, $obecne ) );

		if ( 'google' === $zakladka ) {
			if ( ! empty( $_POST['google_klucz_usun'] ) ) {
				delete_option( Ustawienia::KLUCZ );
			}
			$klucz = trim( (string) wp_unslash( $_POST['google_klucz'] ?? '' ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- JSON klucza sprawdza Google::sprawdz_klucz().
			if ( '' !== $klucz ) {
				$blad = Google::sprawdz_klucz( $klucz );
				if ( $blad ) {
					$bledy[] = 'Klucz Google nie został zapisany: ' . $blad;
				} else {
					update_option( Ustawienia::KLUCZ, $klucz, false );
				}
			}
			Google::wyczysc_pamiec();
		}

		self::komunikat( $bledy ? 'Zapisane. Sprawdź jednak: ' . implode( ' ', $bledy ) : 'Zapisane.', $bledy ? 'warning' : 'success' );
		wp_safe_redirect( self::adres_ustawien( $zakladka ) );
		exit;
	}

	/* ---------- Akcje (odwołanie, CSV, narzędzia) ---------- */

	public static function akcja(): void {
		$akcja = sanitize_key( wp_unslash( $_REQUEST['akcja'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification
		check_admin_referer( 'mp_rez_' . $akcja );
		$powrot = wp_get_referer() ?: admin_url( 'admin.php?page=' . self::STRONA );

		if ( in_array( $akcja, array( 'odwolaj', 'ponow_google', 'csv' ), true ) ) {
			if ( ! current_user_can( self::uprawnienie() ) ) {
				wp_die( 'Brak uprawnień.', 403 );
			}
		} elseif ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'Brak uprawnień.', 403 );
		}

		switch ( $akcja ) {
			case 'odwolaj':
				$rez = Baza::po_id( absint( $_POST['id'] ?? 0 ) );
				if ( ! $rez ) {
					self::komunikat( 'Nie znaleziono tej rezerwacji.', 'error' );
					break;
				}
				$powiadom = ! empty( $_POST['powiadom'] );
				$wynik    = Rezerwacje::odwolaj( $rez, 'wlasciciel', (string) wp_unslash( $_POST['powod'] ?? '' ), $powiadom ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- czyści Rezerwacje::odwolaj().
				self::komunikat( is_wp_error( $wynik ) ? $wynik->get_error_message() : 'Spotkanie odwołane' . ( $powiadom ? ', klient dostał e-mail.' : '.' ), is_wp_error( $wynik ) ? 'error' : 'success' );
				break;

			case 'ponow_google':
				$udane = Rezerwacje::ponow_google();
				$zle   = count( Baza::z_bledem_google() );
				self::komunikat( sprintf( 'Zapisane w Kalendarzu Google: %d. Nadal z błędem: %d.', $udane, $zle ), $zle ? 'warning' : 'success' );
				break;

			case 'csv':
				$widok = sanitize_key( wp_unslash( $_GET['widok'] ?? 'nadchodzace' ) );
				self::csv( array_key_exists( $widok, self::WIDOKI ) ? $widok : 'nadchodzace' );
				exit;

			case 'eksport':
				nocache_headers();
				header( 'Content-Type: application/json; charset=utf-8' );
				header( 'Content-Disposition: attachment; filename="mp-rezerwacje-ustawienia-' . gmdate( 'Y-m-d' ) . '.json"' );
				echo Ustawienia::eksport(); // phpcs:ignore WordPress.Security.EscapeOutput
				exit;

			case 'import':
				$bledy = array();
				$json  = (string) wp_unslash( $_POST['json'] ?? '' ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- JSON przechodzi przez Ustawienia::normalizuj().
				if ( ! empty( $_FILES['plik']['tmp_name'] ) && is_uploaded_file( $_FILES['plik']['tmp_name'] ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
					$json = (string) file_get_contents( $_FILES['plik']['tmp_name'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
				}
				$ok = Ustawienia::import( $json, $bledy );
				self::komunikat( $ok ? 'Ustawienia wczytane.' . ( $bledy ? ' Uwagi: ' . implode( ' ', $bledy ) : '' ) : implode( ' ', $bledy ), $ok ? ( $bledy ? 'warning' : 'success' ) : 'error' );
				break;

			case 'branza':
				$bledy = array();
				$slug  = sanitize_key( wp_unslash( $_POST['branza'] ?? '' ) );
				$ok    = Ustawienia::zastosuj_branze( $slug, $bledy );
				self::komunikat( $ok ? 'Wczytane ustawienia branży: ' . ( Ustawienia::branze()[ $slug ]['nazwa'] ?? $slug ) . '. Sprawdź zakładki Spotkania, Dostępność i Formularz.' : 'Nie znalazłem takiej branży.', $ok ? 'success' : 'error' );
				break;

			case 'test_maila':
				$adres = wp_get_current_user()->user_email;
				$ok    = Maile::test( $adres );
				self::komunikat( $ok ? "Testowe potwierdzenie wysłane na {$adres}." : 'WordPress nie wysłał e-maila. Ustaw wysyłkę przez SMTP (np. wtyczka WP Mail SMTP).', $ok ? 'success' : 'error' );
				break;

			case 'dziennik':
				Dziennik::wyczysc();
				self::komunikat( 'Dziennik wyczyszczony.' );
				break;
		}
		wp_safe_redirect( $powrot );
		exit;
	}

	/** CSV dla Excela: średniki, BOM, formuły zneutralizowane. */
	private static function csv( string $widok ): void {
		list( $rezerwacje ) = Baza::lista( $widok, '', 1, 100000 );
		$formy              = Ustawienia::formy();
		nocache_headers();
		header( 'Content-Type: text/csv; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename="rezerwacje-' . $widok . '-' . gmdate( 'Y-m-d' ) . '.csv"' );
		$wyjscie = fopen( 'php://output', 'w' );
		fwrite( $wyjscie, "\xEF\xBB\xBF" );
		fputcsv( $wyjscie, array( 'Termin', 'Koniec', 'Status', 'Spotkanie', 'Forma', 'Imię i nazwisko', 'E-mail', 'Telefon', 'Odpowiedzi', 'Zapisano', 'Strona' ), ';' );
		foreach ( $rezerwacje as $rez ) {
			$wiersz = array(
				Czas::z_bazy( $rez['poczatek'] )->format( 'Y-m-d H:i' ),
				Czas::z_bazy( $rez['koniec'] )->format( 'H:i' ),
				'odwolana' === $rez['status'] ? 'odwołana' : 'potwierdzona',
				Ustawienia::wizyta( $rez['wizyta'] )['nazwa'] ?? $rez['wizyta'],
				$formy[ $rez['forma'] ]['etykieta'] ?? $rez['forma'],
				$rez['imie'],
				$rez['email'],
				$rez['telefon'],
				implode( '; ', array_map( fn( $o ) => $o['etykieta'] . ': ' . $o['wartosc'], $rez['odpowiedzi'] ) ),
				Czas::z_bazy( $rez['utworzona'] )->format( 'Y-m-d H:i' ),
				$rez['zrodlo'],
			);
			fputcsv( $wyjscie, array_map( fn( $v ) => preg_match( '/^[=+\-@\t\r]/', (string) $v ) ? "'" . $v : (string) $v, $wiersz ), ';' );
		}
		fclose( $wyjscie );
	}

	/* ---------- Kokpit ---------- */

	public static function widget(): void {
		if ( current_user_can( self::uprawnienie() ) ) {
			wp_add_dashboard_widget( 'mp_rezerwacje', 'Najbliższe spotkania', array( self::class, 'widget_tresc' ) );
		}
	}

	public static function widget_tresc(): void {
		list( $rezerwacje ) = Baza::lista( 'nadchodzace', '', 1, 5 );
		if ( ! $rezerwacje ) {
			echo '<p>Na razie nie ma umówionych spotkań.</p>';
		} else {
			echo '<ul class="mp-widget">';
			foreach ( $rezerwacje as $rez ) {
				$od = Czas::z_bazy( $rez['poczatek'] );
				printf(
					'<li><strong>%s</strong> %s<br><span>%s</span></li>',
					esc_html( Czas::data_krotka( $od ) . ', ' . Czas::godzina( $od ) ),
					esc_html( $rez['imie'] ),
					esc_html( Ustawienia::wizyta( $rez['wizyta'] )['nazwa'] ?? $rez['wizyta'] )
				);
			}
			echo '</ul>';
		}
		printf( '<p><a href="%s">Wszystkie spotkania</a></p>', esc_url( admin_url( 'admin.php?page=' . self::STRONA ) ) );
	}

	/* ---------- Komunikaty po zapisie ---------- */

	public static function komunikat( string $tekst, string $typ = 'success' ): void {
		set_transient( 'mp_rez_komunikat_' . get_current_user_id(), array( $tekst, $typ ), MINUTE_IN_SECONDS );
	}

	public static function pokaz_komunikat(): void {
		$komunikat = get_transient( 'mp_rez_komunikat_' . get_current_user_id() );
		if ( is_array( $komunikat ) ) {
			delete_transient( 'mp_rez_komunikat_' . get_current_user_id() );
			printf( '<div class="notice notice-%s is-dismissible"><p>%s</p></div>', esc_attr( $komunikat[1] ), esc_html( $komunikat[0] ) );
		}
	}

	/** Ostrzeżenie, gdy w ostatniej dobie Google odmówił odczytu albo zapisu (szczegóły w Narzędziach). */
	public static function problem_google(): void {
		$dzialalo = (int) get_option( 'mp_rezerwacje_google_ok' );
		foreach ( Dziennik::wpisy() as $wpis ) {
			if ( time() - $wpis['czas'] > DAY_IN_SECONDS || $wpis['czas'] <= $dzialalo ) {
				break;
			}
			if ( str_contains( $wpis['tekst'], 'Google' ) ) {
				printf(
					'<div class="notice notice-warning"><p><strong>Problem z Google (%s):</strong> %s <a href="%s">Dziennik</a></p></div>',
					esc_html( wp_date( 'j.m H:i', $wpis['czas'] ) ),
					esc_html( $wpis['tekst'] ),
					esc_url( self::adres_ustawien( 'narzedzia' ) )
				);
				return;
			}
		}
	}

	/** Strony, na których stoi kalendarz (blok albo shortcode). */
	public static function strony_z_kalendarzem(): array {
		global $wpdb;
		return $wpdb->get_results(
			"SELECT ID, post_title FROM {$wpdb->posts} WHERE post_status = 'publish' AND post_type IN ('page', 'post') AND (post_content LIKE '%<!-- wp:mp/rezerwacja%' OR post_content LIKE '%[mp_rezerwacja%') ORDER BY post_title LIMIT 10"
		) ?: array();
	}
}
