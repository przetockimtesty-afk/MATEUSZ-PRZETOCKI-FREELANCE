<?php
namespace MP\Rezerwacje;

defined( 'ABSPATH' ) || exit;

/**
 * Tabela rezerwacji `{prefiks}mp_rezerwacje`. Czasy w UTC.
 * Statusy: potwierdzona, odwolana (kto odwołał: pole `odwolal` = klient albo wlasciciel).
 */
final class Baza {

	const WERSJA = 2;

	public static function tabela(): string {
		global $wpdb;
		return $wpdb->prefix . 'mp_rezerwacje';
	}

	public static function instaluj(): void {
		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		$tabela = self::tabela();
		dbDelta(
			"CREATE TABLE {$tabela} (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			token char(32) NOT NULL,
			status varchar(20) NOT NULL DEFAULT 'potwierdzona',
			wizyta varchar(64) NOT NULL DEFAULT '',
			poczatek datetime NOT NULL,
			koniec datetime NOT NULL,
			imie varchar(190) NOT NULL DEFAULT '',
			email varchar(190) NOT NULL DEFAULT '',
			telefon varchar(40) NOT NULL DEFAULT '',
			forma varchar(20) NOT NULL DEFAULT '',
			odpowiedzi longtext NULL,
			zrodlo varchar(255) NOT NULL DEFAULT '',
			klucz char(32) NULL,
			w_tle varchar(20) NOT NULL DEFAULT '',
			google_id varchar(255) NOT NULL DEFAULT '',
			google_blad varchar(255) NOT NULL DEFAULT '',
			odwolal varchar(20) NOT NULL DEFAULT '',
			sekwencja smallint(5) unsigned NOT NULL DEFAULT 0,
			przypomnienie datetime NULL,
			utworzona datetime NOT NULL,
			zmieniona datetime NOT NULL,
			PRIMARY KEY  (id),
			UNIQUE KEY token (token),
			UNIQUE KEY klucz (klucz),
			KEY poczatek (poczatek),
			KEY email (email)
		) {$wpdb->get_charset_collate()};"
		);
		update_option( 'mp_rezerwacje_db', self::WERSJA );
	}

	public static function aktualizuj(): void {
		if ( (int) get_option( 'mp_rezerwacje_db' ) !== self::WERSJA ) {
			self::instaluj();
		}
	}

	public static function dodaj( array $dane ): int {
		global $wpdb;
		$teraz = gmdate( 'Y-m-d H:i:s' );
		$dane  = array_merge(
			array(
				'token'     => bin2hex( random_bytes( 16 ) ),
				'status'    => 'potwierdzona',
				'utworzona' => $teraz,
				'zmieniona' => $teraz,
			),
			$dane
		);
		if ( isset( $dane['odpowiedzi'] ) && is_array( $dane['odpowiedzi'] ) ) {
			$dane['odpowiedzi'] = wp_json_encode( $dane['odpowiedzi'], JSON_UNESCAPED_UNICODE );
		}
		// Ten sam klucz od przeglądarki (ponowne wysłanie) kończy się błędem unikalności, nie drugą rezerwacją.
		$poprzednie = $wpdb->suppress_errors( true );
		$wynik      = $wpdb->insert( self::tabela(), $dane );
		$wpdb->suppress_errors( $poprzednie );
		return $wynik ? (int) $wpdb->insert_id : 0;
	}

	public static function usun( int $id ): bool {
		global $wpdb;
		return (bool) $wpdb->delete( self::tabela(), array( 'id' => $id ) );
	}

	/** Rezerwacja zapisana wcześniej z tym samym kluczem formularza (ponowne kliknięcie, zerwane połączenie). */
	public static function po_kluczu( string $klucz ): ?array {
		global $wpdb;
		$wiersz = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::tabela() . ' WHERE klucz = %s', $klucz ), ARRAY_A );
		return $wiersz ? self::rozpakuj( $wiersz ) : null;
	}

	/** Rezerwacje, przy których e-maile i Google czekają na zadanie w tle dłużej niż do granicy. */
	public static function czekajace_w_tle( string $granica ): array {
		global $wpdb;
		return array_map( 'intval', $wpdb->get_col( $wpdb->prepare( 'SELECT id FROM ' . self::tabela() . " WHERE w_tle <> '' AND utworzona < %s ORDER BY id LIMIT 20", $granica ) ) ?: array() );
	}

	/**
	 * Zmienia rezerwację. Z $status zmienia tylko wtedy, gdy rezerwacja nadal ma ten status
	 * (np. nie przesunie spotkania, które ktoś w tej samej chwili odwołał).
	 */
	public static function zmien( int $id, array $dane, ?string $status = null ): bool {
		global $wpdb;
		if ( isset( $dane['odpowiedzi'] ) && is_array( $dane['odpowiedzi'] ) ) {
			$dane['odpowiedzi'] = wp_json_encode( $dane['odpowiedzi'], JSON_UNESCAPED_UNICODE );
		}
		$warunek = null === $status ? array( 'id' => $id ) : array(
			'id'     => $id,
			'status' => $status,
		);
		$wynik   = $wpdb->update( self::tabela(), $dane, $warunek );
		return null === $status ? false !== $wynik : (int) $wynik > 0;
	}

	public static function ostatni_blad(): string {
		global $wpdb;
		return (string) $wpdb->last_error;
	}

	public static function po_id( int $id ): ?array {
		global $wpdb;
		$wiersz = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::tabela() . ' WHERE id = %d', $id ), ARRAY_A );
		return $wiersz ? self::rozpakuj( $wiersz ) : null;
	}

	public static function po_tokenie( string $token ): ?array {
		global $wpdb;
		if ( ! preg_match( '/^[a-f0-9]{32}$/', $token ) ) {
			return null;
		}
		$wiersz = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::tabela() . ' WHERE token = %s', $token ), ARRAY_A );
		return $wiersz ? self::rozpakuj( $wiersz ) : null;
	}

	/** Potwierdzone rezerwacje nachodzące na przedział [od, do) w UTC. */
	public static function zajete( string $od, string $do, int $pomin = 0 ): array {
		global $wpdb;
		return $wpdb->get_results(
			$wpdb->prepare(
				'SELECT id, poczatek, koniec FROM ' . self::tabela() . " WHERE status = 'potwierdzona' AND poczatek < %s AND koniec > %s AND id <> %d",
				$do,
				$od,
				$pomin
			),
			ARRAY_A
		) ?: array();
	}

	/** Lista do panelu: widok nadchodzace | minione | odwolane | wszystkie. Zwraca [wiersze, razem]. */
	public static function lista( string $widok, string $szukaj = '', int $strona = 1, int $na_strone = 50 ): array {
		global $wpdb;
		list( $warunek, $argumenty, $kolejnosc ) = self::widok( $widok );
		if ( '' !== $szukaj ) {
			$like        = '%' . $wpdb->esc_like( $szukaj ) . '%';
			$warunek    .= ' AND (imie LIKE %s OR email LIKE %s OR telefon LIKE %s)';
			$argumenty[] = $like;
			$argumenty[] = $like;
			$argumenty[] = $like;
		}
		$tabela = self::tabela();
		$razem  = (int) $wpdb->get_var( $argumenty ? $wpdb->prepare( "SELECT COUNT(*) FROM {$tabela} WHERE {$warunek}", $argumenty ) : "SELECT COUNT(*) FROM {$tabela} WHERE {$warunek}" );
		$sql    = "SELECT * FROM {$tabela} WHERE {$warunek} ORDER BY {$kolejnosc} LIMIT %d OFFSET %d";
		$wiersz = $wpdb->get_results( $wpdb->prepare( $sql, array_merge( $argumenty, array( $na_strone, max( 0, $strona - 1 ) * $na_strone ) ) ), ARRAY_A ) ?: array();
		return array( array_map( array( self::class, 'rozpakuj' ), $wiersz ), $razem );
	}

	public static function policz( string $widok ): int {
		global $wpdb;
		list( $warunek, $argumenty ) = self::widok( $widok );
		$sql = 'SELECT COUNT(*) FROM ' . self::tabela() . " WHERE {$warunek}";
		return (int) $wpdb->get_var( $argumenty ? $wpdb->prepare( $sql, $argumenty ) : $sql );
	}

	/** Liczba potwierdzonych spotkań w przedziale albo utworzonych od danej chwili (UTC). */
	public static function statystyka( string $pole, string $od, string $do, string $status = 'potwierdzona' ): int {
		global $wpdb;
		$pole = in_array( $pole, array( 'poczatek', 'utworzona', 'zmieniona' ), true ) ? $pole : 'poczatek';
		return (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM ' . self::tabela() . " WHERE status = %s AND {$pole} >= %s AND {$pole} < %s", $status, $od, $do ) );
	}

	/** Potwierdzone spotkania zaczynające się w (od, do], bez wysłanego przypomnienia. */
	public static function do_przypomnienia( string $od, string $do ): array {
		global $wpdb;
		$wiersze = $wpdb->get_results(
			$wpdb->prepare( 'SELECT * FROM ' . self::tabela() . " WHERE status = 'potwierdzona' AND przypomnienie IS NULL AND poczatek > %s AND poczatek <= %s", $od, $do ),
			ARRAY_A
		) ?: array();
		return array_map( array( self::class, 'rozpakuj' ), $wiersze );
	}

	/** Spotkania przed nami z błędem Google: niezapisane albo odwołane, a nadal stojące w kalendarzu. */
	public static function z_bledem_google(): array {
		global $wpdb;
		$wiersze = $wpdb->get_results(
			$wpdb->prepare( 'SELECT * FROM ' . self::tabela() . " WHERE google_blad <> '' AND koniec > %s AND (status = 'potwierdzona' OR google_id <> '') ORDER BY poczatek", gmdate( 'Y-m-d H:i:s' ) ),
			ARRAY_A
		) ?: array();
		return array_map( array( self::class, 'rozpakuj' ), $wiersze );
	}

	public static function po_emailu( string $email, int $limit = 100, int $przesuniecie = 0 ): array {
		global $wpdb;
		$wiersze = $wpdb->get_results(
			$wpdb->prepare( 'SELECT * FROM ' . self::tabela() . ' WHERE email = %s ORDER BY id LIMIT %d OFFSET %d', $email, $limit, $przesuniecie ),
			ARRAY_A
		) ?: array();
		return array_map( array( self::class, 'rozpakuj' ), $wiersze );
	}

	/** Usuwa dane osobowe, zostawia termin i rodzaj spotkania (do statystyk). */
	public static function anonimizuj( int $id ): bool {
		global $wpdb;
		return false !== $wpdb->update(
			self::tabela(),
			array(
				'imie'       => '',
				'email'      => '',
				'telefon'    => '',
				'odpowiedzi' => null,
				'zrodlo'     => '',
			),
			array( 'id' => $id )
		);
	}

	/** Spotkania zakończone przed granicą, w których są jeszcze dane osobowe (najwyżej 50 naraz). */
	public static function do_anonimizacji( string $granica ): array {
		global $wpdb;
		return array_map( 'intval', $wpdb->get_col( $wpdb->prepare( 'SELECT id FROM ' . self::tabela() . " WHERE koniec < %s AND (email <> '' OR imie <> '') ORDER BY koniec LIMIT 50", $granica ) ) ?: array() );
	}

	private static function widok( string $widok ): array {
		$teraz = gmdate( 'Y-m-d H:i:s' );
		switch ( $widok ) {
			case 'minione':
				return array( "status = 'potwierdzona' AND koniec <= %s", array( $teraz ), 'poczatek DESC' );
			case 'odwolane':
				return array( "status = 'odwolana'", array(), 'poczatek DESC' );
			case 'wszystkie':
				return array( '1 = 1', array(), 'poczatek DESC' );
			default:
				return array( "status = 'potwierdzona' AND koniec > %s", array( $teraz ), 'poczatek ASC' );
		}
	}

	private static function rozpakuj( array $wiersz ): array {
		$odpowiedzi           = json_decode( (string) $wiersz['odpowiedzi'], true );
		$wiersz['odpowiedzi'] = is_array( $odpowiedzi ) ? $odpowiedzi : array();
		$wiersz['id']         = (int) $wiersz['id'];
		$wiersz['sekwencja']  = (int) $wiersz['sekwencja'];
		return $wiersz;
	}
}
