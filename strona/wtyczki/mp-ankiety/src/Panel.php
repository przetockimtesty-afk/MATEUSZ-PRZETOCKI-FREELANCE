<?php
namespace MP\Ankiety;

defined( 'ABSPATH' ) || exit;

/**
 * Panel w WordPressie: menu „Ankiety” z listą odpowiedzi (dla Redaktora i wyżej)
 * i ustawieniami (dla Administratora). Formularze idą przez admin-post.php.
 */
final class Panel {

	const STRONA     = 'mp-ankiety';
	const USTAWIENIA = 'mp-ankiety-ustawienia';
	const NA_STRONE  = 30;

	public static function start(): void {
		add_action( 'admin_menu', array( self::class, 'menu' ) );
		add_action( 'admin_enqueue_scripts', array( self::class, 'zasoby' ) );
		add_action( 'admin_post_mp_ank_zapisz', array( self::class, 'zapisz' ) );
		add_action( 'admin_post_mp_ank_akcja', array( self::class, 'akcja' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( PLIK ), array( self::class, 'linki_wtyczki' ) );
	}

	/** Kto widzi odpowiedzi (filtr `mp_ankiety_uprawnienie`). Ustawienia zawsze manage_options. */
	public static function uprawnienie(): string {
		return (string) apply_filters( 'mp_ankiety_uprawnienie', 'edit_pages' );
	}

	public static function menu(): void {
		$nowe  = Baza::nowe();
		$licznik = $nowe ? ' <span class="awaiting-mod count-' . $nowe . '"><span class="pending-count">' . $nowe . '</span></span>' : '';
		add_menu_page( 'Ankiety', 'Ankiety' . $licznik, self::uprawnienie(), self::STRONA, array( self::class, 'lista' ), 'dashicons-feedback', 27 );
		add_submenu_page( self::STRONA, 'Odpowiedzi z ankiet', 'Odpowiedzi', self::uprawnienie(), self::STRONA, array( self::class, 'lista' ) );
		add_submenu_page( self::STRONA, 'Ustawienia ankiet', 'Ustawienia', 'manage_options', self::USTAWIENIA, array( self::class, 'ustawienia' ) );
	}

	public static function zasoby( string $hak ): void {
		if ( str_contains( $hak, self::STRONA ) ) {
			wp_enqueue_style( 'mp-ankiety-panel', plugins_url( 'panel/panel.css', PLIK ), array(), WERSJA );
		}
	}

	public static function linki_wtyczki( array $linki ): array {
		array_unshift( $linki, '<a href="' . esc_url( admin_url( 'admin.php?page=' . self::USTAWIENIA ) ) . '">Ustawienia</a>' );
		return $linki;
	}

	/** Lista odpowiedzi albo jedna odpowiedź (?odpowiedz=ID). */
	public static function lista(): void {
		if ( ! current_user_can( self::uprawnienie() ) ) {
			wp_die( 'Brak uprawnień.' );
		}
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- tylko odczyt i filtry listy.
		$id = isset( $_GET['odpowiedz'] ) ? absint( $_GET['odpowiedz'] ) : 0;
		if ( $id ) {
			$o = Baza::po_id( $id );
			if ( $o && 'nowa' === $o['status'] ) {
				Baza::zmien( $id, array( 'status' => 'przeczytana' ) );
			}
			include dirname( PLIK ) . '/panel/odpowiedz.php';
			return;
		}
		$ankieta = isset( $_GET['ankieta'] ) ? sanitize_key( wp_unslash( $_GET['ankieta'] ) ) : '';
		$szukaj  = isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : '';
		$strona  = max( 1, isset( $_GET['paged'] ) ? absint( $_GET['paged'] ) : 1 );
		// phpcs:enable
		list( $odpowiedzi, $razem ) = Baza::lista( $ankieta, $szukaj, self::NA_STRONE, ( $strona - 1 ) * self::NA_STRONE );
		$stron   = max( 1, (int) ceil( $razem / self::NA_STRONE ) );
		$ankiety = Baza::ankiety();
		include dirname( PLIK ) . '/panel/lista.php';
	}

	public static function ustawienia(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'Brak uprawnień.' );
		}
		$u      = Ustawienia::wszystkie();
		$wpisy  = Dziennik::wpisy();
		include dirname( PLIK ) . '/panel/ustawienia.php';
	}

	public static function zapisz(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'Brak uprawnień.' );
		}
		check_admin_referer( 'mp_ank_zapisz' );
		Ustawienia::zapisz( (array) wp_unslash( $_POST['u'] ?? array() ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- czyści Ustawienia::zapisz().
		self::komunikat( 'Ustawienia zapisane.' );
		wp_safe_redirect( admin_url( 'admin.php?page=' . self::USTAWIENIA ) );
		exit;
	}

	/** Akcje: usuń, ponów automat, CSV, test automatu, wyczyść dziennik. */
	public static function akcja(): void {
		$akcja = sanitize_key( wp_unslash( $_REQUEST['akcja'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification -- sprawdzane niżej dla każdej akcji.
		$id    = absint( $_REQUEST['id'] ?? 0 ); // phpcs:ignore WordPress.Security.NonceVerification
		$lista = admin_url( 'admin.php?page=' . self::STRONA );

		switch ( $akcja ) {
			case 'usun':
				self::sprawdz( 'mp_ank_usun_' . $id, self::uprawnienie() );
				Baza::usun( $id );
				self::komunikat( 'Odpowiedź usunięta.' );
				wp_safe_redirect( $lista );
				exit;

			case 'ponow':
				self::sprawdz( 'mp_ank_ponow_' . $id, self::uprawnienie() );
				$ok = Odpowiedzi::ponow_automat( $id );
				self::komunikat( $ok ? 'Wysłano ponownie do automatu.' : 'Automat nie przyjął odpowiedzi. Szczegóły w Ustawieniach, w dzienniku problemów.', $ok ? 'success' : 'error' );
				wp_safe_redirect( add_query_arg( 'odpowiedz', $id, $lista ) );
				exit;

			case 'csv':
				self::sprawdz( 'mp_ank_csv', self::uprawnienie() );
				self::csv( sanitize_key( wp_unslash( $_GET['ankieta'] ?? '' ) ) ); // phpcs:ignore WordPress.Security.NonceVerification
				exit;

			case 'test':
				self::sprawdz( 'mp_ank_test', 'manage_options' );
				$wynik = Automat::test();
				self::komunikat( is_wp_error( $wynik ) ? $wynik->get_error_message() : 'Automat odpowiedział poprawnie.', is_wp_error( $wynik ) ? 'error' : 'success' );
				wp_safe_redirect( admin_url( 'admin.php?page=' . self::USTAWIENIA ) );
				exit;

			case 'dziennik':
				self::sprawdz( 'mp_ank_dziennik', 'manage_options' );
				Dziennik::wyczysc();
				self::komunikat( 'Dziennik wyczyszczony.' );
				wp_safe_redirect( admin_url( 'admin.php?page=' . self::USTAWIENIA ) );
				exit;
		}
		wp_safe_redirect( $lista );
		exit;
	}

	/** CSV (średnik, UTF-8 z BOM, żeby Excel otworzył polskie znaki) dla jednej ankiety albo wszystkich. */
	private static function csv( string $ankieta ): void {
		list( $odpowiedzi ) = Baza::lista( $ankieta, '', 5000, 0 );
		$kolumny = array();
		foreach ( array_reverse( $odpowiedzi ) as $o ) {
			foreach ( $o['odpowiedzi'] as $odp ) {
				$kolumny[ $odp['id'] ] = $kolumny[ $odp['id'] ] ?? $odp['pytanie'];
			}
		}
		nocache_headers();
		header( 'Content-Type: text/csv; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename="ankiety-' . ( $ankieta ?: 'wszystkie' ) . '-' . gmdate( 'Y-m-d' ) . '.csv"' );
		$wyjscie = fopen( 'php://output', 'w' );
		fwrite( $wyjscie, "\xEF\xBB\xBF" );
		fputcsv( $wyjscie, array_merge( array( 'Nr', 'Data', 'Ankieta', 'Nazwa', 'E-mail', 'Strona' ), array_values( $kolumny ) ), ';' );
		foreach ( $odpowiedzi as $o ) {
			$teksty = array_column( $o['odpowiedzi'], 'tekst', 'id' );
			$wiersz = array( $o['id'], get_date_from_gmt( $o['utworzona'], 'Y-m-d H:i' ), $o['tytul'], $o['nazwa'], $o['email'], $o['zrodlo'] );
			foreach ( array_keys( $kolumny ) as $k ) {
				$wiersz[] = $teksty[ $k ] ?? '';
			}
			fputcsv( $wyjscie, array_map( array( self::class, 'komorka' ), $wiersz ), ';' );
		}
		fclose( $wyjscie ); // phpcs:ignore WordPress.WP.AlternativeFunctions
	}

	/** Komórka bez formuł arkusza (=, +, -, @ na początku). */
	private static function komorka( $wartosc ): string {
		$w = (string) $wartosc;
		return preg_match( '/^[=+\-@\t\r]/', $w ) ? "'" . $w : $w;
	}

	private static function sprawdz( string $akcja, string $uprawnienie ): void {
		if ( ! current_user_can( $uprawnienie ) ) {
			wp_die( 'Brak uprawnień.' );
		}
		check_admin_referer( $akcja );
	}

	public static function komunikat( string $tekst, string $typ = 'success' ): void {
		set_transient( 'mp_ank_komunikat_' . get_current_user_id(), array( $tekst, $typ ), MINUTE_IN_SECONDS );
	}

	public static function pokaz_komunikat(): void {
		$komunikat = get_transient( 'mp_ank_komunikat_' . get_current_user_id() );
		if ( $komunikat ) {
			delete_transient( 'mp_ank_komunikat_' . get_current_user_id() );
			printf( '<div class="notice notice-%s is-dismissible"><p>%s</p></div>', esc_attr( $komunikat[1] ), esc_html( $komunikat[0] ) );
		}
	}

	public static function link_akcji( string $akcja, int $id = 0, array $dodatkowe = array() ): string {
		$nonce = 'csv' === $akcja ? 'mp_ank_csv' : ( in_array( $akcja, array( 'test', 'dziennik' ), true ) ? 'mp_ank_' . $akcja : 'mp_ank_' . $akcja . '_' . $id );
		return wp_nonce_url( add_query_arg( array_merge( array( 'action' => 'mp_ank_akcja', 'akcja' => $akcja, 'id' => $id ), $dodatkowe ), admin_url( 'admin-post.php' ) ), $nonce );
	}

	/** Znaczek stanu przekazania do automatu. */
	public static function znaczek_automatu( array $o ): string {
		$stany = array(
			'czeka'   => array( 'Automat: czeka', '' ),
			'wyslana' => array( 'Automat: przekazana', '' ),
			'blad'    => array( 'Automat: błąd', 'mp-znaczek--blad' ),
		);
		if ( ! isset( $stany[ $o['automat'] ] ) ) {
			return '';
		}
		return '<span class="mp-znaczek ' . esc_attr( $stany[ $o['automat'] ][1] ) . '"' . ( $o['blad'] ? ' title="' . esc_attr( $o['blad'] ) . '"' : '' ) . '>' . esc_html( $stany[ $o['automat'] ][0] ) . '</span>';
	}
}
