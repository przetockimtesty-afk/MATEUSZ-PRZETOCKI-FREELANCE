<?php
namespace MP\Ankiety;

use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Przyjęcie odpowiedzi (zapis od razu, odpowiedź dla przeglądarki od razu), a potem w tle:
 * e-mail do właściciela, potwierdzenie dla osoby i przekazanie do automatu. Gdy coś się nie uda,
 * zadanie cykliczne ponawia to do 3 razy.
 */
final class Odpowiedzi {

	/** Odpowiedzi do dokończenia po wysłaniu odpowiedzi HTTP. */
	private static array $po_odpowiedzi = array();

	/**
	 * @param array $dane strona, ankieta, odpowiedzi, klucz, czas (ms na stronie), www (pułapka), adres
	 * @return array|WP_Error
	 */
	public static function przyjmij( array $dane ) {
		$strona  = absint( $dane['strona'] ?? 0 );
		$ankieta = sanitize_key( (string) ( $dane['ankieta'] ?? '' ) );
		$d       = Definicja::znajdz( $strona, $ankieta );
		if ( ! $d ) {
			return self::blad( 'brak', 'Nie znaleziono tej ankiety. Odśwież stronę i spróbuj ponownie.', 404 );
		}

		// Pułapka na boty: wygląda jak sukces, ale nic się nie zapisuje.
		if ( is_scalar( $dane['www'] ?? null ) && '' !== trim( (string) $dane['www'] ) ) {
			return array( 'ok' => true );
		}

		$od_klienta = is_scalar( $dane['klucz'] ?? null ) ? (string) $dane['klucz'] : '';
		if ( ! preg_match( '/^[A-Za-z0-9-]{16,64}$/', $od_klienta ) ) {
			$od_klienta = wp_generate_uuid4();
		}
		$klucz = md5( $ankieta . '|' . $od_klienta );

		// Ponowne wysłanie tego samego formularza (np. po zerwanym połączeniu) nie robi duplikatu.
		$jest = Baza::po_kluczu( $klucz );
		if ( $jest ) {
			return self::wynik( $jest );
		}

		$czas = is_numeric( $dane['czas'] ?? null ) ? (int) $dane['czas'] : 0;
		if ( $czas > 0 && $czas < 2500 ) {
			return self::blad( 'za_szybko', 'Wysłano zbyt szybko. Spróbuj jeszcze raz za chwilę.', 400 );
		}

		$sprawdzone = Definicja::sprawdz( $d, is_array( $dane['odpowiedzi'] ?? null ) ? $dane['odpowiedzi'] : array() );
		if ( $sprawdzone['bledy'] ) {
			return new WP_Error(
				'pola',
				'Popraw zaznaczone pola.',
				array(
					'status' => 400,
					'pola'   => $sprawdzone['bledy'],
				)
			);
		}
		if ( ! self::limit_adresu( false ) ) {
			return self::blad( 'limit', 'Z tego adresu wysłano już kilka ankiet. Spróbuj za godzinę.', 429 );
		}

		$pole = fn( string $id ): string => (string) ( array_column( $sprawdzone['odpowiedzi'], 'tekst', 'id' )[ $id ] ?? '' );
		$id   = Baza::dodaj(
			array(
				'klucz'      => $klucz,
				'ankieta'    => $ankieta,
				'tytul'      => mb_substr( $d['nazwa'], 0, 190 ),
				'strona'     => $strona,
				'nazwa'      => mb_substr( $d['pola']['nazwa'] ? $pole( $d['pola']['nazwa'] ) : '', 0, 190 ),
				'email'      => mb_substr( $d['pola']['email'] ? $pole( $d['pola']['email'] ) : '', 0, 190 ),
				'odpowiedzi' => $sprawdzone['odpowiedzi'],
				'zrodlo'     => mb_substr( self::zrodlo( $dane['adres'] ?? '' ), 0, 255 ),
				'automat'    => $d['automat'] && Automat::wlaczony() ? 'czeka' : '',
			)
		);
		if ( ! $id ) {
			$jest = Baza::po_kluczu( $klucz );
			if ( $jest ) {
				return self::wynik( $jest );
			}
			Dziennik::zapisz( 'Zapis odpowiedzi w bazie: ' . ( Baza::ostatni_blad() ?: 'nieznany błąd' ) );
			return self::blad( 'baza', 'Nie udało się zapisać odpowiedzi. Spróbuj ponownie.', 500 );
		}
		self::limit_adresu( true );
		self::zaplanuj( $id );

		$zapis = Baza::po_id( $id );
		do_action( 'mp_ankiety_nowa', $zapis, $d );
		return self::wynik( $zapis );
	}

	/**
	 * E-maile i automat dla jednej odpowiedzi. Bezpieczne przy wielokrotnym wywołaniu:
	 * robi tylko to, czego jeszcze nie zrobiono, i nie działa równolegle dla tej samej odpowiedzi.
	 */
	public static function przetworz( $id ): void {
		$id = (int) $id;
		$o  = Baza::po_id( $id );
		if ( ! $o || ( 1 === $o['maile'] && ! in_array( $o['automat'], array( 'czeka', 'blad' ), true ) ) ) {
			return;
		}
		$blokada = 'mp_ankiety_blokada_' . $id;
		if ( ! add_option( $blokada, time(), '', false ) ) {
			if ( time() - (int) get_option( $blokada ) < 5 * MINUTE_IN_SECONDS ) {
				return;
			}
			update_option( $blokada, time(), false );
		}
		try {
			$d      = Definicja::znajdz( $o['strona'], $o['ankieta'] );
			$zmiany = array( 'proby' => $o['proby'] + 1 );
			if ( 1 !== $o['maile'] ) {
				$zmiany['maile'] = Maile::do_wlasciciela( $o ) ? 1 : 2;
				if ( 0 === $o['proby'] && $d ) {
					Maile::potwierdzenie( $o, $d );
				}
			}
			if ( in_array( $o['automat'], array( 'czeka', 'blad' ), true ) ) {
				$wynik             = Automat::wyslij( $o );
				$zmiany['automat'] = is_wp_error( $wynik ) ? 'blad' : 'wyslana';
				$zmiany['blad']    = is_wp_error( $wynik ) ? mb_substr( $wynik->get_error_message(), 0, 250 ) : '';
				if ( is_wp_error( $wynik ) ) {
					Dziennik::zapisz( 'Automat, odpowiedź #' . $id . ': ' . $wynik->get_error_message() );
				}
			}
			Baza::zmien( $id, $zmiany );
		} finally {
			delete_option( $blokada );
		}
	}

	/** Zadanie co godzinę: odpowiedzi, przy których e-mail albo automat się nie udał. */
	public static function dokoncz_zalegle(): void {
		foreach ( Baza::zalegle( gmdate( 'Y-m-d H:i:s', time() - 2 * MINUTE_IN_SECONDS ) ) as $id ) {
			self::przetworz( $id );
		}
	}

	/** Ponowne przekazanie do automatu z panelu (np. po poprawce skryptu). */
	public static function ponow_automat( int $id ): bool {
		$o = Baza::po_id( $id );
		if ( ! $o || ! Automat::wlaczony() ) {
			return false;
		}
		$wynik = Automat::wyslij( $o );
		Baza::zmien(
			$id,
			array(
				'automat' => is_wp_error( $wynik ) ? 'blad' : 'wyslana',
				'blad'    => is_wp_error( $wynik ) ? mb_substr( $wynik->get_error_message(), 0, 250 ) : '',
			)
		);
		return ! is_wp_error( $wynik );
	}

	/**
	 * Przeglądarka dostaje odpowiedź od razu. E-maile i automat idą po jej wysłaniu (PHP-FPM, LiteSpeed),
	 * a gdzie się nie da, przez WP-Cron uruchomiony w tle. Zadanie zaplanowane na teraz to też siatka
	 * bezpieczeństwa, gdyby proces przerwał się w połowie.
	 */
	private static function zaplanuj( int $id ): void {
		wp_schedule_single_event( time(), 'mp_ankiety_dokoncz', array( $id ) );
		if ( ! self::$po_odpowiedzi ) {
			add_action( 'shutdown', array( self::class, 'po_odpowiedzi' ), 0 );
		}
		self::$po_odpowiedzi[] = $id;
	}

	public static function po_odpowiedzi(): void {
		if ( function_exists( 'fastcgi_finish_request' ) ) {
			fastcgi_finish_request();
		} elseif ( function_exists( 'litespeed_finish_request' ) ) {
			litespeed_finish_request();
		} else {
			spawn_cron();
			return;
		}
		ignore_user_abort( true );
		foreach ( self::$po_odpowiedzi as $id ) {
			self::przetworz( $id );
		}
	}

	private static function wynik( array $o ): array {
		return array(
			'ok'    => true,
			'email' => $o['email'],
		);
	}

	/** Strona, z której wysłano ankietę (tylko ta sama witryna; razem z parametrami, np. ?zrodlo=email). */
	private static function zrodlo( $adres ): string {
		$adres = is_scalar( $adres ) ? esc_url_raw( (string) $adres ) : '';
		return $adres ? (string) wp_validate_redirect( $adres, '' ) : '';
	}

	/** Najwyżej 10 ankiet na godzinę z jednego adresu IP (filtr `mp_ankiety_limit_ip`). */
	private static function limit_adresu( bool $zapisz ): bool {
		$adres = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
		$klucz = 'mp_ank_ip_' . md5( $adres . wp_salt( 'nonce' ) );
		$ile   = (int) get_transient( $klucz );
		if ( $zapisz ) {
			set_transient( $klucz, $ile + 1, HOUR_IN_SECONDS );
		}
		return $ile < (int) apply_filters( 'mp_ankiety_limit_ip', 10 );
	}

	private static function blad( string $kod, string $tekst, int $status ): WP_Error {
		return new WP_Error( $kod, $tekst, array( 'status' => $status ) );
	}
}
