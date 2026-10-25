<?php
namespace MP\Ankiety;

use WP_REST_Request;
use WP_REST_Response;

defined( 'ABSPATH' ) || exit;

/**
 * REST API: /wp-json/mp-ankiety/v1/…
 *   POST odpowiedzi      nowa odpowiedź z ankiety na stronie
 *   POST automat/test    test połączenia z automatem (tylko administrator)
 */
final class Rest {

	const NS = 'mp-ankiety/v1';

	public static function start(): void {
		add_action( 'rest_api_init', array( self::class, 'trasy' ) );
	}

	public static function trasy(): void {
		register_rest_route(
			self::NS,
			'/odpowiedzi',
			array(
				'methods'             => 'POST',
				'callback'            => array( self::class, 'nowa' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			self::NS,
			'/automat/test',
			array(
				'methods'             => 'POST',
				'callback'            => function () {
					$wynik = Automat::test();
					return rest_ensure_response(
						array(
							'ok'        => ! is_wp_error( $wynik ),
							'komunikat' => is_wp_error( $wynik ) ? $wynik->get_error_message() : 'Automat odpowiedział poprawnie.',
						)
					);
				},
				'permission_callback' => fn() => current_user_can( 'manage_options' ),
			)
		);
	}

	public static function nowa( WP_REST_Request $r ) {
		$wynik = Odpowiedzi::przyjmij( (array) ( $r->get_json_params() ?: $r->get_body_params() ) );
		if ( is_wp_error( $wynik ) ) {
			return $wynik;
		}
		// Bez pamięci przeglądarki i wtyczek cache (LiteSpeed domyślnie zapamiętuje REST API).
		do_action( 'litespeed_control_set_nocache', 'mp-ankiety' );
		$odp = new WP_REST_Response( $wynik, 201 );
		$odp->header( 'Cache-Control', 'no-store, max-age=0' );
		return $odp;
	}
}
