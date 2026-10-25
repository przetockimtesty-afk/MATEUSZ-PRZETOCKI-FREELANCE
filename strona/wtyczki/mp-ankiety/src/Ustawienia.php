<?php
namespace MP\Ankiety;

defined( 'ABSPATH' ) || exit;

/**
 * Ustawienia wtyczki (opcja `mp_ankiety`). Pytania nie są tutaj: każda ankieta ma definicję w swoim bloku.
 */
final class Ustawienia {

	const OPCJA = 'mp_ankiety';

	public static function domyslne(): array {
		return array(
			'powiadomienia'            => '',
			'nadawca'                  => '',
			'podpis'                   => '',
			'polityka'                 => '',
			'przechowywanie'           => 365,
			'automat'                  => array(
				'adres'  => '',
				'sekret' => '',
			),
			'usun_przy_odinstalowaniu' => false,
		);
	}

	public static function wszystkie(): array {
		$zapisane = get_option( self::OPCJA, array() );
		$u        = array_replace_recursive( self::domyslne(), is_array( $zapisane ) ? $zapisane : array() );
		return $u;
	}

	/** Wartość po ścieżce z kropkami, np. „automat.adres”. */
	public static function get( string $sciezka ) {
		$w = self::wszystkie();
		foreach ( explode( '.', $sciezka ) as $czesc ) {
			if ( ! is_array( $w ) || ! array_key_exists( $czesc, $w ) ) {
				return null;
			}
			$w = $w[ $czesc ];
		}
		return $w;
	}

	/** Zapis z formularza w panelu. Puste pole sekretu nie usuwa zapisanego sekretu. */
	public static function zapisz( array $nowe ): void {
		$obecne = self::wszystkie();
		$adresy = array_filter( array_map( 'trim', explode( ',', (string) ( $nowe['powiadomienia'] ?? '' ) ) ), 'is_email' );
		$sekret = trim( (string) ( $nowe['automat']['sekret'] ?? '' ) );
		$u      = array(
			'powiadomienia'            => implode( ', ', array_map( 'sanitize_email', $adresy ) ),
			'nadawca'                  => mb_substr( sanitize_text_field( (string) ( $nowe['nadawca'] ?? '' ) ), 0, 100 ),
			'podpis'                   => mb_substr( sanitize_textarea_field( (string) ( $nowe['podpis'] ?? '' ) ), 0, 300 ),
			'polityka'                 => esc_url_raw( (string) ( $nowe['polityka'] ?? '' ) ),
			'przechowywanie'           => max( 0, min( 3650, (int) ( $nowe['przechowywanie'] ?? 365 ) ) ),
			'automat'                  => array(
				'adres'  => self::adres_automatu( (string) ( $nowe['automat']['adres'] ?? '' ) ),
				'sekret' => '' !== $sekret ? mb_substr( $sekret, 0, 200 ) : (string) $obecne['automat']['sekret'],
			),
			'usun_przy_odinstalowaniu' => ! empty( $nowe['usun_przy_odinstalowaniu'] ),
		);
		if ( ! empty( $nowe['automat']['usun_sekret'] ) ) {
			$u['automat']['sekret'] = '';
		}
		update_option( self::OPCJA, $u, false );
	}

	/** Adresy na powiadomienia; puste = adres administratora WordPressa. */
	public static function adresy(): array {
		$adresy = array_filter( array_map( 'trim', explode( ',', (string) self::get( 'powiadomienia' ) ) ), 'is_email' );
		return $adresy ? array_values( $adresy ) : array( (string) get_option( 'admin_email' ) );
	}

	public static function nadawca(): string {
		return (string) ( self::get( 'nadawca' ) ?: wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ) );
	}

	public static function polityka(): string {
		return (string) ( self::get( 'polityka' ) ?: get_privacy_policy_url() );
	}

	/** Tylko https (np. adres aplikacji internetowej Google Apps Script). */
	private static function adres_automatu( string $adres ): string {
		$adres = esc_url_raw( trim( $adres ), array( 'https' ) );
		return str_starts_with( $adres, 'https://' ) ? $adres : '';
	}
}
