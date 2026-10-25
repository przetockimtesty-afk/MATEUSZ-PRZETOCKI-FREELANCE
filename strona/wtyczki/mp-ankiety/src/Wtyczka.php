<?php
namespace MP\Ankiety;

defined( 'ABSPATH' ) || exit;

/**
 * Start wtyczki: podłącza moduły i zadania cykliczne.
 */
final class Wtyczka {

	public static function start(): void {
		Baza::aktualizuj();
		Rest::start();
		Front::start();
		Prywatnosc::start();

		add_action( 'init', array( self::class, 'zaplanuj' ) );
		add_action( 'mp_ankiety_co_godzine', array( Odpowiedzi::class, 'dokoncz_zalegle' ) );
		add_action( 'mp_ankiety_dokoncz', array( Odpowiedzi::class, 'przetworz' ) );
		add_action( 'mp_ankiety_codziennie', array( Prywatnosc::class, 'usun_stare' ) );

		if ( is_admin() ) {
			Panel::start();
		}
	}

	public static function aktywacja(): void {
		Baza::instaluj();
		self::zaplanuj();
		Front::oznacz_wszystkie();
	}

	public static function dezaktywacja(): void {
		wp_clear_scheduled_hook( 'mp_ankiety_co_godzine' );
		wp_clear_scheduled_hook( 'mp_ankiety_codziennie' );
	}

	/** Ponowienia co godzinę, usuwanie starych odpowiedzi raz na dobę. */
	public static function zaplanuj(): void {
		if ( ! wp_next_scheduled( 'mp_ankiety_co_godzine' ) ) {
			wp_schedule_event( time() + 10 * MINUTE_IN_SECONDS, 'hourly', 'mp_ankiety_co_godzine' );
		}
		if ( ! wp_next_scheduled( 'mp_ankiety_codziennie' ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'mp_ankiety_codziennie' );
		}
	}
}
