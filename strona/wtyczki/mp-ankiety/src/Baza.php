<?php
namespace MP\Ankiety;

defined( 'ABSPATH' ) || exit;

/**
 * Tabela odpowiedzi `{prefiks}mp_ankiety`. Czasy w UTC.
 * maile: 0 czeka, 1 wysłane, 2 błąd. automat: '' nie dotyczy, czeka, wyslana, blad.
 */
final class Baza {

	const WERSJA = 1;

	public static function tabela(): string {
		global $wpdb;
		return $wpdb->prefix . 'mp_ankiety';
	}

	public static function instaluj(): void {
		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		$tabela = self::tabela();
		dbDelta(
			"CREATE TABLE {$tabela} (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			klucz char(32) NOT NULL,
			ankieta varchar(64) NOT NULL DEFAULT '',
			tytul varchar(190) NOT NULL DEFAULT '',
			strona bigint(20) unsigned NOT NULL DEFAULT 0,
			nazwa varchar(190) NOT NULL DEFAULT '',
			email varchar(190) NOT NULL DEFAULT '',
			odpowiedzi longtext NULL,
			zrodlo varchar(255) NOT NULL DEFAULT '',
			status varchar(20) NOT NULL DEFAULT 'nowa',
			maile tinyint(3) unsigned NOT NULL DEFAULT 0,
			automat varchar(20) NOT NULL DEFAULT '',
			proby smallint(5) unsigned NOT NULL DEFAULT 0,
			blad varchar(255) NOT NULL DEFAULT '',
			utworzona datetime NOT NULL,
			PRIMARY KEY  (id),
			UNIQUE KEY klucz (klucz),
			KEY ankieta (ankieta),
			KEY email (email),
			KEY utworzona (utworzona)
		) {$wpdb->get_charset_collate()};"
		);
		update_option( 'mp_ankiety_db', self::WERSJA );
	}

	public static function aktualizuj(): void {
		if ( (int) get_option( 'mp_ankiety_db' ) !== self::WERSJA ) {
			self::instaluj();
		}
	}

	/** Nowa odpowiedź; 0, gdy zapis się nie udał (np. ten sam klucz już jest). */
	public static function dodaj( array $dane ): int {
		global $wpdb;
		$dane = array_merge(
			array(
				'status'    => 'nowa',
				'utworzona' => gmdate( 'Y-m-d H:i:s' ),
			),
			$dane
		);
		if ( isset( $dane['odpowiedzi'] ) && is_array( $dane['odpowiedzi'] ) ) {
			$dane['odpowiedzi'] = wp_json_encode( $dane['odpowiedzi'], JSON_UNESCAPED_UNICODE );
		}
		$poprzednie = $wpdb->suppress_errors( true );
		$wynik      = $wpdb->insert( self::tabela(), $dane );
		$wpdb->suppress_errors( $poprzednie );
		return $wynik ? (int) $wpdb->insert_id : 0;
	}

	public static function zmien( int $id, array $dane ): bool {
		global $wpdb;
		return false !== $wpdb->update( self::tabela(), $dane, array( 'id' => $id ) );
	}

	public static function usun( int $id ): bool {
		global $wpdb;
		return (bool) $wpdb->delete( self::tabela(), array( 'id' => $id ) );
	}

	public static function po_id( int $id ): ?array {
		global $wpdb;
		$wiersz = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::tabela() . ' WHERE id = %d', $id ), ARRAY_A );
		return $wiersz ? self::rozpakuj( $wiersz ) : null;
	}

	public static function po_kluczu( string $klucz ): ?array {
		global $wpdb;
		$wiersz = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::tabela() . ' WHERE klucz = %s', $klucz ), ARRAY_A );
		return $wiersz ? self::rozpakuj( $wiersz ) : null;
	}

	/**
	 * Lista do panelu: najnowsze pierwsze.
	 *
	 * @return array{0: array, 1: int} wiersze i liczba wszystkich pasujących
	 */
	public static function lista( string $ankieta = '', string $szukaj = '', int $limit = 30, int $przesuniecie = 0 ): array {
		global $wpdb;
		$warunki = array( '1=1' );
		$wartosci = array();
		if ( '' !== $ankieta ) {
			$warunki[]  = 'ankieta = %s';
			$wartosci[] = $ankieta;
		}
		if ( '' !== $szukaj ) {
			$warunki[]  = '(nazwa LIKE %s OR email LIKE %s OR odpowiedzi LIKE %s)';
			$fraza      = '%' . $wpdb->esc_like( $szukaj ) . '%';
			$wartosci[] = $fraza;
			$wartosci[] = $fraza;
			$wartosci[] = $fraza;
		}
		$gdzie = implode( ' AND ', $warunki );
		// phpcs:disable WordPress.DB.PreparedSQL.NotPrepared -- warunki składane wyłącznie z placeholderów powyżej.
		$razem   = (int) $wpdb->get_var( $wartosci ? $wpdb->prepare( 'SELECT COUNT(*) FROM ' . self::tabela() . " WHERE {$gdzie}", $wartosci ) : 'SELECT COUNT(*) FROM ' . self::tabela() );
		$wiersze = $wpdb->get_results(
			$wpdb->prepare( 'SELECT * FROM ' . self::tabela() . " WHERE {$gdzie} ORDER BY id DESC LIMIT %d OFFSET %d", array_merge( $wartosci, array( $limit, $przesuniecie ) ) ),
			ARRAY_A
		);
		// phpcs:enable
		return array( array_map( array( self::class, 'rozpakuj' ), $wiersze ?: array() ), $razem );
	}

	/** Ankiety, które mają odpowiedzi: identyfikator => [tytuł, liczba]. */
	public static function ankiety(): array {
		global $wpdb;
		$wynik = array();
		foreach ( $wpdb->get_results( 'SELECT ankieta, MAX(tytul) AS tytul, COUNT(*) AS ile FROM ' . self::tabela() . ' GROUP BY ankieta ORDER BY ankieta', ARRAY_A ) ?: array() as $w ) {
			$wynik[ $w['ankieta'] ] = array( $w['tytul'] ?: $w['ankieta'], (int) $w['ile'] );
		}
		return $wynik;
	}

	public static function nowe(): int {
		global $wpdb;
		return (int) $wpdb->get_var( 'SELECT COUNT(*) FROM ' . self::tabela() . " WHERE status = 'nowa'" );
	}

	/** Odpowiedzi z niedokończonymi e-mailami albo przekazaniem do automatu (do 3 prób). */
	public static function zalegle( string $starsze_niz ): array {
		global $wpdb;
		return array_map(
			'intval',
			$wpdb->get_col(
				$wpdb->prepare(
					'SELECT id FROM ' . self::tabela() . " WHERE (maile <> 1 OR automat IN ('czeka', 'blad')) AND proby < 3 AND utworzona < %s ORDER BY id LIMIT 20",
					$starsze_niz
				)
			) ?: array()
		);
	}

	public static function po_emailu( string $email, int $limit = 100, int $przesuniecie = 0 ): array {
		global $wpdb;
		return array_map(
			array( self::class, 'rozpakuj' ),
			$wpdb->get_results(
				$wpdb->prepare( 'SELECT * FROM ' . self::tabela() . ' WHERE email = %s ORDER BY id LIMIT %d OFFSET %d', $email, $limit, $przesuniecie ),
				ARRAY_A
			) ?: array()
		);
	}

	public static function starsze_niz( string $data ): array {
		global $wpdb;
		return array_map( 'intval', $wpdb->get_col( $wpdb->prepare( 'SELECT id FROM ' . self::tabela() . ' WHERE utworzona < %s LIMIT 500', $data ) ) ?: array() );
	}

	public static function ostatni_blad(): string {
		global $wpdb;
		return (string) $wpdb->last_error;
	}

	private static function rozpakuj( array $w ): array {
		$w['id']         = (int) $w['id'];
		$w['strona']     = (int) $w['strona'];
		$w['maile']      = (int) $w['maile'];
		$w['proby']      = (int) $w['proby'];
		$odpowiedzi      = json_decode( (string) $w['odpowiedzi'], true );
		$w['odpowiedzi'] = is_array( $odpowiedzi ) ? $odpowiedzi : array();
		return $w;
	}
}
