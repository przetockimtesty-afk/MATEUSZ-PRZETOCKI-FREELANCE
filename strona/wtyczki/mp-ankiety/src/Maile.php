<?php
namespace MP\Ankiety;

defined( 'ABSPATH' ) || exit;

/**
 * E-maile: powiadomienie o nowej odpowiedzi (do właściciela) i potwierdzenie z kopią odpowiedzi
 * (do osoby, która wypełniła ankietę, jeśli definicja ma temat potwierdzenia). Wysyłka przez wp_mail().
 */
final class Maile {

	public static function do_wlasciciela( array $o ): bool {
		$kto = $o['nazwa'] ?: ( $o['email'] ?: '#' . $o['id'] );
		$m   = array(
			'temat'     => "Nowa odpowiedź: {$o['tytul']} · {$kto}",
			'naglowek'  => 'Nowa odpowiedź: ' . $o['tytul'],
			'wstep'     => is_email( $o['email'] ) ? 'Odpowiedź na tę wiadomość trafi prosto do ' . $o['email'] . '.' : '',
			'sekcje'    => self::sekcje( $o['odpowiedzi'] ),
			'przyciski' => array( array( 'Otwórz w panelu', admin_url( 'admin.php?page=' . Panel::STRONA . '&odpowiedz=' . $o['id'] ), true ) ),
			'po'        => $o['zrodlo'] ? 'Wysłano ze strony: <a href="' . esc_url( $o['zrodlo'] ) . '">' . esc_html( $o['zrodlo'] ) . '</a>' : '',
			'podpis'    => '',
			'stopka'    => 'Powiadomienie z wtyczki MP Ankiety na stronie ' . wp_parse_url( home_url(), PHP_URL_HOST ) . '.',
		);
		$odpowiedz = is_email( $o['email'] ) ? array( 'Reply-To: ' . self::nazwa_w_naglowku( $o['nazwa'] ) . ' <' . $o['email'] . '>' ) : array();
		$wynik     = true;
		foreach ( Ustawienia::adresy() as $adres ) {
			$wynik = self::wyslij( $adres, $m, $odpowiedz ) && $wynik;
		}
		return $wynik;
	}

	/** Potwierdzenie dla osoby, która wypełniła ankietę (tylko gdy definicja ma temat potwierdzenia). */
	public static function potwierdzenie( array $o, array $d ): bool {
		$p = $d['potwierdzenie'];
		if ( '' === $p['temat'] || ! is_email( $o['email'] ) ) {
			return false;
		}
		$m = array(
			'temat'     => $p['temat'],
			'naglowek'  => $p['temat'],
			'wstep'     => "Dzień dobry!\n\n" . $p['tekst'],
			'sekcje'    => $p['kopia'] ? self::sekcje( $o['odpowiedzi'] ) : array(),
			'przyciski' => array(),
			'po'        => '',
			'podpis'    => (string) ( Ustawienia::get( 'podpis' ) ?: Ustawienia::nadawca() ),
			'stopka'    => 'Ta wiadomość potwierdza odpowiedzi wysłane na stronie ' . wp_parse_url( home_url(), PHP_URL_HOST ) . '. Jeśli to nie Ty, zignoruj ją.',
		);
		return self::wyslij( $o['email'], $m, array( 'Reply-To: ' . Ustawienia::adresy()[0] ) );
	}

	/** Odpowiedzi pogrupowane według kroków: [[tytuł kroku, [[pytanie, odpowiedź], …]], …]. */
	private static function sekcje( array $odpowiedzi ): array {
		$sekcje = array();
		foreach ( $odpowiedzi as $odp ) {
			$krok = (string) ( $odp['krok'] ?? '' );
			if ( ! $sekcje || end( $sekcje )[0] !== $krok ) {
				$sekcje[] = array( $krok, array() );
			}
			$sekcje[ count( $sekcje ) - 1 ][1][] = array( (string) $odp['pytanie'], (string) $odp['tekst'] );
		}
		return $sekcje;
	}

	private static function wyslij( string $do, array $m, array $naglowki ): bool {
		$m['zajawka'] = wp_strip_all_tags( strtok( $m['wstep'] ?: $m['naglowek'], "\n" ) ?: $m['naglowek'] );
		ob_start();
		include dirname( PLIK ) . '/szablony/mail.php';
		$html  = (string) ob_get_clean();
		$tekst = self::tekst( $m );

		$naglowki[] = 'Content-Type: text/html; charset=UTF-8';
		$nadawca    = Ustawienia::nadawca();
		$nazwa      = fn() => $nadawca;
		// Wersja tekstowa i krótszy limit czasu SMTP, żeby wolny serwer poczty nie blokował zadania.
		$alt = function ( $phpmailer ) use ( $tekst ) {
			$phpmailer->AltBody = $tekst; // phpcs:ignore WordPress.NamingConventions.ValidVariableName
			$phpmailer->Timeout = 20; // phpcs:ignore WordPress.NamingConventions.ValidVariableName
		};

		add_filter( 'wp_mail_from_name', $nazwa );
		add_action( 'phpmailer_init', $alt, PHP_INT_MAX );
		$wynik = wp_mail( $do, $m['temat'], $html, $naglowki );
		remove_filter( 'wp_mail_from_name', $nazwa );
		remove_action( 'phpmailer_init', $alt, PHP_INT_MAX );

		if ( ! $wynik ) {
			Dziennik::zapisz( "Nie udało się wysłać e-maila „{$m['temat']}” do {$do}." );
		}
		return (bool) $wynik;
	}

	/** Wersja tekstowa tej samej wiadomości (dla programów pocztowych bez HTML). */
	private static function tekst( array $m ): string {
		$linie = array( $m['naglowek'], '' );
		if ( '' !== $m['wstep'] ) {
			array_push( $linie, $m['wstep'], '' );
		}
		foreach ( $m['sekcje'] as list( $krok, $wiersze ) ) {
			if ( '' !== $krok ) {
				$linie[] = '== ' . $krok . ' ==';
			}
			foreach ( $wiersze as list( $pytanie, $odpowiedz ) ) {
				$linie[] = $pytanie . ': ' . $odpowiedz;
			}
			$linie[] = '';
		}
		foreach ( $m['przyciski'] as list( $napis, $adres ) ) {
			$linie[] = $napis . ': ' . $adres;
		}
		if ( $m['po'] ) {
			$linie[] = wp_strip_all_tags( preg_replace( '/<a href="([^"]+)">([^<]+)<\/a>/', '$2', $m['po'] ) );
		}
		if ( $m['podpis'] ) {
			array_push( $linie, '', $m['podpis'] );
		}
		return implode( "\n", $linie );
	}

	private static function nazwa_w_naglowku( string $nazwa ): string {
		return str_replace( array( ',', ';', '<', '>', '"', "\r", "\n" ), '', $nazwa );
	}
}
