<?php
namespace MP\Rezerwacje;

defined( 'ABSPATH' ) || exit;

/**
 * Strona: blok „Rezerwacja terminu”, shortcode [mp_rezerwacja] i strona zarządzania rezerwacją
 * (link z e-maila: /?mp_rezerwacja=TOKEN).
 */
final class Front {

	/** Ikony z zestawu strony (Lucide, obrys 1,5). */
	const IKONY = array(
		'osoba'     => '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
		'zegar'     => '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
		'wideo'     => '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
		'pinezka'   => '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
		'telefon'   => '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>',
		'lista'     => '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
		'kalendarz' => '<path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="m9 15 2 2 4-4"/>',
		'ok'        => '<path d="M20 6 9 17l-5-5"/>',
		'lewo'      => '<path d="m15 18-6-6 6-6"/>',
		'prawo'     => '<path d="m9 18 6-6-6-6"/>',
		'strzalka'  => '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
		'mail'      => '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/>',
	);

	public static function start(): void {
		add_action( 'init', array( self::class, 'rejestruj' ) );
		add_action( 'enqueue_block_editor_assets', array( self::class, 'dane_edytora' ) );
		add_action( 'template_redirect', array( self::class, 'strona_rezerwacji' ), 1 );
	}

	public static function rejestruj(): void {
		register_block_type( dirname( PLIK ) . '/bloki/rezerwacja', array( 'render_callback' => array( self::class, 'blok' ) ) );
		add_shortcode( 'mp_rezerwacja', array( self::class, 'shortcode' ) );
	}

	public static function blok( array $atrybuty ): string {
		return self::html( $atrybuty, get_block_wrapper_attributes( array( 'class' => 'mp-rez', 'style' => self::zmienne() ) ) );
	}

	/** [mp_rezerwacja wizyta="konsultacja" naglowek="Umów rozmowę" osoba="nie"] */
	public static function shortcode( $atrybuty ): string {
		$a          = shortcode_atts(
			array(
				'wizyta'   => '',
				'naglowek' => '',
				'osoba'    => 'tak',
			),
			$atrybuty,
			'mp_rezerwacja'
		);
		$a['osoba'] = 'nie' !== $a['osoba'];
		return self::html( $a, 'class="mp-rez" style="' . esc_attr( self::zmienne() ) . '"' );
	}

	/** Kalendarz; z $rez w trybie zmiany terminu (strona zarządzania rezerwacją). */
	public static function html( array $a, string $wrapper, ?array $rez = null ): string {
		wp_enqueue_script( 'mp-rezerwacja-view-script' );
		wp_enqueue_style( 'mp-rezerwacja-style' );
		$dane  = self::dane( $a, $rez );
		$osoba = ( $a['osoba'] ?? true ) ? self::osoba() : null;
		ob_start();
		include dirname( PLIK ) . '/szablony/kalendarz.php';
		return (string) ob_get_clean();
	}

	/** Konfiguracja dla skryptu kalendarza (view.js). */
	private static function dane( array $a, ?array $rez ): array {
		$wizyty = Ustawienia::wizyty();
		if ( $rez ) {
			$wizyty = array( Rezerwacje::wizyta_rezerwacji( $rez ) );
		} elseif ( ! empty( $a['wizyta'] ) && Ustawienia::wizyta( (string) $a['wizyta'] ) ) {
			$wizyty = array( Ustawienia::wizyta( (string) $a['wizyta'] ) );
		}
		$formy   = Ustawienia::formy();
		$pytania = Ustawienia::pytania();
		$liczba  = self::liczba_pytan( count( $pytania ) );

		return array(
			'api'     => array(
				'terminy'    => rest_url( Rest::NS . '/terminy' ),
				'rezerwacje' => rest_url( Rest::NS . '/rezerwacje' ),
				'zmien'      => $rez ? rest_url( Rest::NS . '/rezerwacje/' . $rez['token'] . '/zmien' ) : '',
			),
			'tryb'    => $rez ? 'zmiana' : 'nowa',
			'token'   => $rez['token'] ?? '',
			'po'      => $rez ? add_query_arg( 'zmieniona', '1', Rezerwacje::link_zarzadzania( $rez ) ) : '',
			'strona'  => (string) ( get_permalink() ?: home_url( '/' ) ),
			'wizyty'  => array_map(
				fn( $w ) => array(
					'id'    => $w['id'],
					'nazwa' => $w['nazwa'],
					'czas'        => Czas::dlugosc( (int) $w['czas'] ),
					'formy_tekst' => Ustawienia::formy_tekst( $w ),
					'info'        => $w['opis'],
					'formy' => array_map(
						fn( $f ) => array(
							'id'       => $f,
							'etykieta' => $formy[ $f ]['etykieta'],
							'ikona'    => $formy[ $f ]['ikona'],
						),
						$w['formy']
					),
				),
				$wizyty
			),
			'pytania' => $pytania,
			'telefon' => Ustawienia::get( 'telefon' ),
			// Nazwy zdarzeń po rezerwacji: GA4 (gtag) i piksel Meta (fbq, zdarzenie standardowe „Schedule”).
			'zdarzenia' => (array) apply_filters(
				'mp_rezerwacje_zdarzenia',
				array(
					'ga4'  => 'book_appointment',
					'meta' => 'Schedule',
				)
			),
			'teksty'  => array(
				'naglowek'  => ( $a['naglowek'] ?? '' ) ?: Ustawienia::get( 'teksty.naglowek' ),
				'dalej'     => $liczba ? 'Dalej: ' . $liczba : 'Dalej',
				'pytania'   => Czas::wielka( $liczba ),
				'zapowiedz' => Ustawienia::get( 'teksty.zapowiedz' ),
				'przycisk'  => Ustawienia::get( 'teksty.przycisk' ),
				'sukces'    => Ustawienia::get( 'teksty.sukces' ),
				'zgoda'     => self::zgoda(),
			),
			'ikony'   => self::IKONY,
		);
	}

	/** „jedno krótkie pytanie”, „3 krótkie pytania”, „5 krótkich pytań” (pusty tekst, gdy pytań nie ma). */
	public static function liczba_pytan( int $n ): string {
		if ( $n < 2 ) {
			return $n ? 'jedno krótkie pytanie' : '';
		}
		return $n . ' ' . Czas::odmiana( $n, 'krótkie pytanie', 'krótkie pytania', 'krótkich pytań' );
	}

	/** Treść zgody z linkiem do polityki prywatności (HTML gotowy do wstawienia). */
	private static function zgoda(): string {
		$adres = Ustawienia::polityka();
		$link  = $adres ? '<a href="' . esc_url( $adres ) . '" target="_blank" rel="noopener">polityce prywatności</a>' : 'polityce prywatności';
		return str_replace( '{polityka}', $link, esc_html( (string) Ustawienia::get( 'teksty.zgoda' ) ) );
	}

	/** Osoba nad kalendarzem (imię, podpis, zdjęcie) albo null. */
	public static function osoba(): ?array {
		$imie = (string) Ustawienia::get( 'osoba.imie' );
		if ( '' === $imie ) {
			return null;
		}
		$zdjecie = (int) Ustawienia::get( 'osoba.zdjecie' );
		return array(
			'imie'    => $imie,
			'opis'    => (string) Ustawienia::get( 'osoba.opis' ),
			'zdjecie' => $zdjecie ? (string) wp_get_attachment_image(
				$zdjecie,
				array( 96, 96 ),
				false,
				array(
					'alt'     => '',
					'loading' => 'lazy',
				)
			) : '',
			'adres'   => $zdjecie ? (string) wp_get_attachment_image_url( $zdjecie, 'thumbnail' ) : '',
		);
	}

	/** Kolory i zaokrąglenie z ustawień „Wygląd” jako zmienne CSS (puste = kolory motywu). */
	public static function zmienne(): string {
		$w = (array) Ustawienia::get( 'wyglad' );
		$z = array();
		if ( ! empty( $w['glowny'] ) ) {
			$z[] = '--mp-glowny:' . $w['glowny'];
			$z[] = '--mp-na-glownym:' . self::kontrast( $w['glowny'] );
		}
		if ( ! empty( $w['akcent'] ) ) {
			$z[] = '--mp-akcent:' . $w['akcent'];
		}
		if ( ! empty( $w['tlo'] ) ) {
			$z[] = '--mp-tlo:' . $w['tlo'];
		}
		if ( isset( $w['promien'] ) && '' !== $w['promien'] ) {
			$z[] = '--mp-promien:' . (int) $w['promien'] . 'px';
		}
		return implode( ';', $z );
	}

	/** Czytelny kolor tekstu na danym tle: kremowy na ciemnym, czarny na jasnym. */
	public static function kontrast( string $hex ): string {
		$hex = ltrim( $hex, '#' );
		if ( 3 === strlen( $hex ) ) {
			$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
		}
		if ( ! preg_match( '/^[0-9a-f]{6}$/i', $hex ) ) {
			return '#f5f2ec';
		}
		$kanal = function ( string $c ): float {
			$c = hexdec( $c ) / 255;
			return $c <= 0.03928 ? $c / 12.92 : ( ( $c + 0.055 ) / 1.055 ) ** 2.4;
		};
		$jasnosc = 0.2126 * $kanal( substr( $hex, 0, 2 ) ) + 0.7152 * $kanal( substr( $hex, 2, 2 ) ) + 0.0722 * $kanal( substr( $hex, 4, 2 ) );
		return $jasnosc > 0.2 ? '#161514' : '#f5f2ec';
	}

	public static function ikona( string $nazwa ): string {
		return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' . ( self::IKONY[ $nazwa ] ?? '' ) . '</svg>';
	}

	/** Dane dla podglądu bloku w edytorze. */
	public static function dane_edytora(): void {
		$liczba = self::liczba_pytan( count( Ustawienia::pytania() ) );
		$dane   = array(
			'wizyty'     => array_map(
				fn( $w ) => array(
					'id'    => $w['id'],
					'nazwa' => $w['nazwa'],
					'opis'  => Ustawienia::opis_wizyty( $w ),
				),
				Ustawienia::wizyty()
			),
			'naglowek'   => Ustawienia::get( 'teksty.naglowek' ),
			'dalej'      => $liczba ? 'Dalej: ' . $liczba : 'Dalej',
			'zapowiedz'  => Ustawienia::get( 'teksty.zapowiedz' ),
			'osoba'      => self::osoba(),
			'ustawienia' => admin_url( 'admin.php?page=mp-rezerwacje-ustawienia' ),
			'ikony'      => self::IKONY,
		);
		wp_add_inline_script( 'mp-rezerwacja-editor-script', 'window.mpRezerwacjeEdytor = ' . wp_json_encode( $dane ) . ';', 'before' );
	}

	/** Strona zarządzania rezerwacją: szczegóły, zmiana terminu, odwołanie, plik .ics. */
	public static function strona_rezerwacji(): void {
		if ( ! isset( $_GET['mp_rezerwacja'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}
		$rez = Baza::po_tokenie( sanitize_key( wp_unslash( $_GET['mp_rezerwacja'] ) ) ); // phpcs:ignore WordPress.Security.NonceVerification

		if ( ! defined( 'DONOTCACHEPAGE' ) ) {
			define( 'DONOTCACHEPAGE', true );
		}
		do_action( 'litespeed_control_set_nocache', 'mp-rezerwacje' );
		nocache_headers();
		header( 'X-Robots-Tag: noindex, nofollow' );
		header( 'Referrer-Policy: no-referrer' );

		if ( $rez && 'ics' === sanitize_key( wp_unslash( $_GET['plik'] ?? '' ) ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			header( 'Content-Type: text/calendar; charset=utf-8' );
			header( 'Content-Disposition: attachment; filename="termin.ics"' );
			echo Maile::ics( $rez, 'odwolana' === $rez['status'] ? 'CANCEL' : 'PUBLISH' ); // phpcs:ignore WordPress.Security.EscapeOutput
			exit;
		}

		// Odwołanie wyłącznie przez POST: skanery linków w poczcie otwierają linki GET-em.
		$komunikat = '';
		if ( $rez && 'POST' === ( $_SERVER['REQUEST_METHOD'] ?? '' ) && isset( $_POST['mp_odwolaj'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			$wynik = Rezerwacje::odwolaj( $rez, 'klient', sanitize_textarea_field( wp_unslash( $_POST['powod'] ?? '' ) ) ); // phpcs:ignore WordPress.Security.NonceVerification
			if ( ! is_wp_error( $wynik ) ) {
				wp_safe_redirect( add_query_arg( 'odwolana', '1', Rezerwacje::link_zarzadzania( $rez ) ) );
				exit;
			}
			$komunikat = $wynik->get_error_message();
		}

		$kalendarz = ( $rez && Rezerwacje::mozna_zmieniac( $rez ) ) ? self::html( array( 'osoba' => false ), 'class="mp-rez mp-rez--zmiana"', $rez ) : '';
		status_header( $rez ? 200 : 404 );
		include dirname( PLIK ) . '/szablony/zarzadzanie.php';
		exit;
	}
}
