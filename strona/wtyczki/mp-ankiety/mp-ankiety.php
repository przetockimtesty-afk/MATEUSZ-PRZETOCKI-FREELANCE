<?php
/**
 * Plugin Name:       MP Ankiety
 * Description:       Ankiety i formularze na stronie w krokach: pytania zależne od odpowiedzi, zapis w WordPressie, e-maile i opcjonalne przekazanie odpowiedzi do automatu (np. Google Apps Script).
 * Version:           0.1.0
 * Requires at least: 6.5
 * Requires PHP:      8.1
 * Author:            Mateusz Przetocki
 * License:           GPL-2.0-or-later
 * Text Domain:       mp-ankiety
 */

namespace MP\Ankiety;

defined( 'ABSPATH' ) || exit;

const WERSJA = '0.1.0';
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
