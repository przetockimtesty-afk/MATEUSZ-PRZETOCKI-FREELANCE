<?php
namespace MP\Ankiety;

use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Przekazanie odpowiedzi do automatu, np. aplikacji internetowej Google Apps Script (doPost).
 * Treść: {"dane": "<JSON jako tekst>", "podpis": "<HMAC-SHA256 tekstu dane, hex>"}.
 * Automat liczy ten sam podpis ze wspólnym sekretem i odrzuca wiadomość, gdy się nie zgadza;
 * odpowiada JSON-em {"ok": true}. Apps Script nie widzi nagłówków, dlatego podpis jest w treści.
 */
final class Automat {

	public static function wlaczony(): bool {
		return '' !== (string) Ustawienia::get( 'automat.adres' ) && '' !== (string) Ustawienia::get( 'automat.sekret' );
	}

	/** @return true|WP_Error */
	public static function wyslij( array $o ) {
		$teksty   = array();
		$wartosci = array();
		foreach ( $o['odpowiedzi'] as $odp ) {
			$teksty[ $odp['id'] ]   = $odp['lista'] ?? $odp['tekst'];
			$wartosci[ $odp['id'] ] = $odp['wartosc'];
		}
		return self::zapytanie(
			array(
				'wersja'     => 1,
				'test'       => false,
				'id'         => $o['id'],
				'ankieta'    => $o['ankieta'],
				'tytul'      => $o['tytul'],
				'witryna'    => home_url( '/' ),
				'strona'     => (string) get_permalink( $o['strona'] ),
				'adres'      => $o['zrodlo'],
				'utworzona'  => gmdate( 'c', (int) strtotime( $o['utworzona'] . ' UTC' ) ),
				'nazwa'      => $o['nazwa'],
				'email'      => $o['email'],
				'odpowiedzi' => $o['odpowiedzi'],
				'teksty'     => $teksty,
				'wartosci'   => $wartosci,
			)
		);
	}

	/** Test z panelu: automat powinien odpowiedzieć {"ok": true} i niczego nie tworzyć. */
	public static function test() {
		if ( ! self::wlaczony() ) {
			return new WP_Error( 'wylaczony', 'Wpisz adres automatu i sekret, zapisz ustawienia i spróbuj ponownie.' );
		}
		return self::zapytanie(
			array(
				'wersja'  => 1,
				'test'    => true,
				'witryna' => home_url( '/' ),
			)
		);
	}

	/** @return true|WP_Error */
	private static function zapytanie( array $dane ) {
		$tekst = (string) wp_json_encode( $dane, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
		$ua    = 'MP Ankiety/' . WERSJA . '; ' . home_url( '/' );
		$odp   = wp_remote_post(
			(string) Ustawienia::get( 'automat.adres' ),
			array(
				'timeout'     => 30,
				// Apps Script odpowiada przekierowaniem na stronę z wynikiem. WordPress poszedłby za nim
				// GET-em z tą samą treścią, a Google odrzuca GET z treścią kodem 400, więc wynik pobieramy niżej sami.
				'redirection' => 0,
				'headers'     => array( 'Content-Type' => 'application/json; charset=utf-8' ),
				'user-agent'  => $ua,
				'body'        => (string) wp_json_encode(
					array(
						'dane'   => $tekst,
						'podpis' => hash_hmac( 'sha256', $tekst, (string) Ustawienia::get( 'automat.sekret' ) ),
					),
					JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
				),
			)
		);
		if ( is_wp_error( $odp ) ) {
			return new WP_Error( 'polaczenie', 'Brak połączenia z automatem: ' . $odp->get_error_message() );
		}
		$kod    = (int) wp_remote_retrieve_response_code( $odp );
		$wynik  = (string) wp_remote_retrieve_header( $odp, 'location' );
		if ( $kod >= 300 && $kod < 400 && '' !== $wynik ) {
			$odp = wp_remote_get( \WP_Http::make_absolute_url( $wynik, (string) Ustawienia::get( 'automat.adres' ) ), array( 'timeout' => 30, 'redirection' => 3, 'user-agent' => $ua ) );
			if ( is_wp_error( $odp ) ) {
				return new WP_Error( 'polaczenie', 'Brak połączenia z automatem: ' . $odp->get_error_message() );
			}
		}
		$kod  = (int) wp_remote_retrieve_response_code( $odp );
		$json = json_decode( (string) wp_remote_retrieve_body( $odp ), true );
		if ( $kod >= 200 && $kod < 300 && is_array( $json ) && ! empty( $json['ok'] ) ) {
			return true;
		}
		if ( is_array( $json ) && ! empty( $json['blad'] ) ) {
			return new WP_Error( 'automat', 'Automat odrzucił odpowiedź: ' . sanitize_text_field( (string) $json['blad'] ) );
		}
		return new WP_Error( 'odpowiedz', sprintf( 'Automat odpowiedział nietypowo (kod %d). Sprawdź adres aplikacji i czy ma dostęp „Każdy”.', $kod ) );
	}
}
