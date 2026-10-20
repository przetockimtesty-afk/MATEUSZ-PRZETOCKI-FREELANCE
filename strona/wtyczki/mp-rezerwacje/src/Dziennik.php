<?php
namespace MP\Rezerwacje;

defined( 'ABSPATH' ) || exit;

/**
 * Ostatnie 50 problemów (Google, e-maile) do podejrzenia w panelu: Ustawienia → Narzędzia.
 */
final class Dziennik {

	const OPCJA = 'mp_rezerwacje_dziennik';

	public static function zapisz( string $tekst ): void {
		$wpisy = self::wpisy();
		if ( $wpisy && $wpisy[0]['tekst'] === $tekst && time() - $wpisy[0]['czas'] < HOUR_IN_SECONDS ) {
			return;
		}
		array_unshift(
			$wpisy,
			array(
				'czas'  => time(),
				'tekst' => mb_substr( $tekst, 0, 500 ),
			)
		);
		update_option( self::OPCJA, array_slice( $wpisy, 0, 50 ), false );
	}

	public static function wpisy(): array {
		$wpisy = get_option( self::OPCJA, array() );
		return is_array( $wpisy ) ? $wpisy : array();
	}

	public static function wyczysc(): void {
		delete_option( self::OPCJA );
	}
}
