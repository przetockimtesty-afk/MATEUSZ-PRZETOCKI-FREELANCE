<?php
namespace MP\Rezerwacje;

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
		add_action( 'mp_rezerwacje_co_godzine', array( Rezerwacje::class, 'wyslij_przypomnienia' ) );
		add_action( 'mp_rezerwacje_co_godzine', array( Rezerwacje::class, 'dokoncz_zalegle' ) );
		add_action( 'mp_rezerwacje_w_tle', array( Rezerwacje::class, 'dokoncz_nowa' ) );
		add_action( 'mp_rezerwacje_codziennie', array( Prywatnosc::class, 'anonimizuj_stare' ) );

		if ( is_admin() ) {
			Panel::start();
		}
	}

	public static function aktywacja(): void {
		Baza::instaluj();
		self::zaplanuj();
	}

	public static function dezaktywacja(): void {
		wp_clear_scheduled_hook( 'mp_rezerwacje_co_godzine' );
		wp_clear_scheduled_hook( 'mp_rezerwacje_codziennie' );
	}

	/** Przypomnienia co godzinę, czyszczenie starych danych raz na dobę (o 3:00 czasu strony). */
	public static function zaplanuj(): void {
		if ( ! wp_next_scheduled( 'mp_rezerwacje_co_godzine' ) ) {
			wp_schedule_event( time() + 5 * MINUTE_IN_SECONDS, 'hourly', 'mp_rezerwacje_co_godzine' );
		}
		if ( ! wp_next_scheduled( 'mp_rezerwacje_codziennie' ) ) {
			$trzecia = Czas::dzis()->modify( '+1 day' )->setTime( 3, 0 );
			wp_schedule_event( $trzecia->getTimestamp(), 'daily', 'mp_rezerwacje_codziennie' );
		}
	}
}
