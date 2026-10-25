<?php
/**
 * Plugin Name:       MP Rezerwacje
 * Description:       Kalendarz rezerwacji na stronie: wolne terminy, krótki formularz, potwierdzenia e-mail z plikiem .ics i opcjonalnie Kalendarz Google klienta.
 * Version:           0.1.1
 * Requires at least: 6.5
 * Requires PHP:      8.1
 * Author:            Mateusz Przetocki
 * License:           GPL-2.0-or-later
 * Text Domain:       mp-rezerwacje
 */

namespace MP\Rezerwacje;

defined( 'ABSPATH' ) || exit;

const WERSJA = '0.1.1';
const PLIK   = __FILE__;

spl_autoload_register(
	function ( $klasa ) {
		if ( str_starts_with( $klasa, __NAMESPACE__ . '\\' ) ) {
			$plik = __DIR__ . '/src/' . substr( $klasa, strlen( __NAMESPACE__ ) + 1 ) . '.php';
			if ( is_file( $plik ) ) {
				require $plik;
			}
		}
	}
);

register_activation_hook( __FILE__, array( Wtyczka::class, 'aktywacja' ) );
register_deactivation_hook( __FILE__, array( Wtyczka::class, 'dezaktywacja' ) );
add_action( 'plugins_loaded', array( Wtyczka::class, 'start' ) );
