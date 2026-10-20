<?php
namespace MP\Rezerwacje;

use WP_REST_Request;
use WP_REST_Response;

defined( 'ABSPATH' ) || exit;

/**
 * REST API: /wp-json/mp-rezerwacje/v1/…
 *   GET  terminy                      tydzień wolnych terminów
 *   POST rezerwacje                   nowa rezerwacja
 *   POST rezerwacje/{token}/zmien     zmiana terminu przez klienta
 *   POST rezerwacje/{token}/odwolaj   odwołanie przez klienta
 *   POST google/test                  test połączenia (tylko administrator)
 */
final class Rest {

	const NS    = 'mp-rezerwacje/v1';
	const TOKEN = '(?P<token>[a-f0-9]{32})';

	public static function start(): void {
		add_action( 'rest_api_init', array( self::class, 'trasy' ) );
	}

	public static function trasy(): void {
		register_rest_route(
			self::NS,
			'/terminy',
			array(
				'methods'             => 'GET',
				'callback'            => array( self::class, 'terminy' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'wizyta' => array(
						'type'    => 'string',
						'default' => '',
					),
					'od'     => array(
						'type'    => 'string',
						'default' => '',
						'pattern' => '^(\d{4}-\d{2}-\d{2})?$',
					),
					'token'  => array(
						'type'    => 'string',
						'default' => '',
						'pattern' => '^([a-f0-9]{32})?$',
					),
				),
			)
		);
		register_rest_route(
			self::NS,
			'/rezerwacje',
			array(
				'methods'             => 'POST',
				'callback'            => array( self::class, 'nowa' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			self::NS,
			'/rezerwacje/' . self::TOKEN . '/zmien',
			array(
				'methods'             => 'POST',
				'callback'            => array( self::class, 'zmien' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			self::NS,
			'/rezerwacje/' . self::TOKEN . '/odwolaj',
			array(
				'methods'             => 'POST',
				'callback'            => array( self::class, 'odwolaj' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			self::NS,
			'/google/test',
			array(
				'methods'             => 'POST',
				'callback'            => fn() => rest_ensure_response( Google::test() ),
				'permission_callback' => fn() => current_user_can( 'manage_options' ),
			)
		);
	}

	public static function terminy( WP_REST_Request $r ): WP_REST_Response {
		$pomin  = 0;
		$wizyta = null;
		if ( $r['token'] ) {
			$rez = Baza::po_tokenie( (string) $r['token'] );
			if ( $rez && Rezerwacje::mozna_zmieniac( $rez ) ) {
				$pomin  = $rez['id'];
				$wizyta = Ustawienia::wizyta( $rez['wizyta'] );
			}
		}
		$wizyta = $wizyta ?? Ustawienia::wizyta( (string) $r['wizyta'] ) ?? Ustawienia::wizyta();
		return self::bez_pamieci( Dostepnosc::tydzien( $wizyta, $r['od'] ?: null, $pomin ) );
	}

	public static function nowa( WP_REST_Request $r ) {
		$wynik = Rezerwacje::utworz( (array) ( $r->get_json_params() ?: $r->get_body_params() ) );
		return is_wp_error( $wynik ) ? $wynik : self::bez_pamieci( $wynik, 201 );
	}

	public static function zmien( WP_REST_Request $r ) {
		$rez = Baza::po_tokenie( (string) $r['token'] );
		if ( ! $rez ) {
			return new \WP_Error( 'brak', 'Nie znaleziono rezerwacji.', array( 'status' => 404 ) );
		}
		$wynik = Rezerwacje::zmien_termin( $rez, is_scalar( $r->get_param( 'start' ) ) ? (string) $r->get_param( 'start' ) : '' );
		return is_wp_error( $wynik ) ? $wynik : self::bez_pamieci( $wynik );
	}

	public static function odwolaj( WP_REST_Request $r ) {
		$rez = Baza::po_tokenie( (string) $r['token'] );
		if ( ! $rez ) {
			return new \WP_Error( 'brak', 'Nie znaleziono rezerwacji.', array( 'status' => 404 ) );
		}
		$wynik = Rezerwacje::odwolaj( $rez, 'klient', is_scalar( $r->get_param( 'powod' ) ) ? (string) $r->get_param( 'powod' ) : '' );
		return is_wp_error( $wynik ) ? $wynik : self::bez_pamieci( array( 'status' => 'odwolana' ) );
	}

	/** Terminy muszą być świeże: bez pamięci przeglądarki i wtyczek cache (LiteSpeed domyślnie zapamiętuje REST API). */
	private static function bez_pamieci( array $dane, int $status = 200 ): WP_REST_Response {
		do_action( 'litespeed_control_set_nocache', 'mp-rezerwacje' );
		$odp = new WP_REST_Response( $dane, $status );
		$odp->header( 'Cache-Control', 'no-store, max-age=0' );
		return $odp;
	}
}
