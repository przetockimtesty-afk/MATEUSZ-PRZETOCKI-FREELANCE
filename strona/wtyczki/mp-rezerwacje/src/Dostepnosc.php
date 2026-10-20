<?php
namespace MP\Rezerwacje;

use DateTimeImmutable;

defined( 'ABSPATH' ) || exit;

/**
 * Wolne terminy: godziny pracy i wyjątki minus rezerwacje z bazy i zajętość z Kalendarza Google.
 * Termin jest wolny, gdy razem z przerwą przed i po nie nachodzi na nic zajętego.
 */
final class Dostepnosc {

	/**
	 * Tydzień (pn–nd) do kalendarza na stronie.
	 *
	 * @param array       $wizyta Spotkanie z ustawień.
	 * @param string|null $od     Dowolny dzień tygodnia 'Y-m-d'; null = pierwszy tydzień z wolnym terminem.
	 * @param int         $pomin  Id rezerwacji, której termin zmieniamy (nie blokuje sama siebie).
	 */
	public static function tydzien( array $wizyta, ?string $od = null, int $pomin = 0 ): array {
		$dzis    = Czas::dzis();
		$granica = self::granica();
		$pierwszy_pn = self::poniedzialek( $dzis );

		$pn = $od ? Czas::dzien( $od ) : null;
		$pn = $pn ? self::poniedzialek( $pn ) : null;
		if ( $pn && ( $pn < $pierwszy_pn || $pn > $granica ) ) {
			$pn = null;
		}

		$wszystkie = null;
		if ( ! $pn ) {
			$wszystkie = self::dni( $wizyta, $dzis, $granica, $pomin );
			$wolny     = self::pierwszy_wolny( $wszystkie );
			$pn        = self::poniedzialek( $wolny ? Czas::dzien( $wolny ) : $dzis );
		}
		$nd    = $pn->modify( '+6 days' );
		$sloty = $wszystkie ?? self::dni( $wizyta, max( $pn, $dzis ), min( $nd, $granica ), $pomin );

		$pracujace = self::dni_pracujace();
		$dni       = array();
		for ( $d = $pn; $d <= $nd; $d = $d->modify( '+1 day' ) ) {
			$data    = $d->format( 'Y-m-d' );
			$godziny = $sloty[ $data ] ?? array();
			if ( ! $godziny && ! in_array( (int) $d->format( 'N' ), $pracujace, true ) ) {
				continue;
			}
			$dni[] = array(
				'data'     => $data,
				'skrot'    => Czas::DNI_SKROT[ (int) $d->format( 'N' ) ],
				'numer'    => (int) $d->format( 'j' ),
				'etykieta' => Czas::data( $d ),
				'wolne'    => count( array_filter( $godziny, fn( $s ) => $s['wolny'] ) ),
				'godziny'  => array_map(
					fn( $s ) => array(
						'czas'   => Czas::godzina( $s['od'] ),
						'koniec' => Czas::godzina( $s['do'] ),
						'start'  => Czas::iso( $s['od'] ),
						'wolny'  => $s['wolny'],
					),
					$godziny
				),
			);
		}

		$nastepny = $pn->modify( '+7 days' );
		$wynik    = array(
			'od'         => $pn->format( 'Y-m-d' ),
			'miesiac'    => $dni ? Czas::miesiace( Czas::dzien( $dni[0]['data'] ), Czas::dzien( end( $dni )['data'] ) ) : Czas::miesiace( $pn, $nd ),
			'poprzedni'  => $pn > $pierwszy_pn ? $pn->modify( '-7 days' )->format( 'Y-m-d' ) : null,
			'nastepny'   => $nastepny <= $granica ? $nastepny->format( 'Y-m-d' ) : null,
			'dni'        => $dni,
			'najblizszy' => null,
		);

		if ( ! array_sum( array_column( $dni, 'wolne' ) ) && $nastepny <= $granica ) {
			$wolny = self::pierwszy_wolny( $wszystkie ?? self::dni( $wizyta, $nastepny, $granica, $pomin ), $nastepny->format( 'Y-m-d' ) );
			if ( $wolny ) {
				$wynik['najblizszy'] = array(
					'data'     => $wolny,
					'etykieta' => Czas::data( Czas::dzien( $wolny ) ),
				);
			}
		}
		return $wynik;
	}

	/**
	 * Terminy dzień po dniu: ['Y-m-d' => [['od' => DateTimeImmutable, 'do' => …, 'wolny' => bool], …]].
	 * Dni bez godzin pracy nie ma w wyniku.
	 */
	public static function dni( array $wizyta, DateTimeImmutable $od, DateTimeImmutable $do, int $pomin = 0, bool $swieze = false ): array {
		$u            = Ustawienia::wszystkie();
		$czas         = max( 5, (int) $wizyta['czas'] );
		$krok         = max( 5, (int) $u['zasady']['krok'] );
		$przerwa      = (int) $u['zasady']['przerwa'] * MINUTE_IN_SECONDS;
		$najwczesniej = time() + (int) $u['zasady']['wyprzedzenie'] * HOUR_IN_SECONDS;
		$limit        = (int) $u['zasady']['limit'];
		$tydzien      = self::godziny_tygodnia();
		$wyjatki      = Czas::wyjatki( (string) $u['wyjatki'] )['dni'];
		$swieta       = array();
		if ( $u['swieta'] ) {
			for ( $rok = (int) $od->format( 'Y' ); $rok <= (int) $do->format( 'Y' ); $rok++ ) {
				$swieta += Czas::swieta( $rok );
			}
		}

		list( $zajete, $na_dzien ) = self::zajete( $od->getTimestamp(), $do->modify( '+1 day' )->getTimestamp(), $pomin, $swieze );

		$wynik = array();
		for ( $d = $od; $d <= $do; $d = $d->modify( '+1 day' ) ) {
			$data       = $d->format( 'Y-m-d' );
			$przedzialy = $wyjatki[ $data ] ?? ( isset( $swieta[ $data ] ) ? array() : ( $tydzien[ (int) $d->format( 'N' ) ] ?? array() ) );
			$pelny      = $limit > 0 && ( $na_dzien[ $data ] ?? 0 ) >= $limit;
			$sloty      = array();
			foreach ( $przedzialy as list( $a, $b ) ) {
				for ( $t = $a; $t + $czas <= $b; $t += $krok ) {
					$start = new DateTimeImmutable( $data . ' ' . Czas::hhmm( $t ), Czas::strefa() );
					$s     = $start->getTimestamp();
					if ( $s < $najwczesniej ) {
						continue;
					}
					$e       = $s + $czas * MINUTE_IN_SECONDS;
					$sloty[] = array(
						'od'    => $start,
						'do'    => $start->modify( "+{$czas} minutes" ),
						'wolny' => ! $pelny && ! self::koliduje( $zajete, $s - $przerwa, $e + $przerwa ),
					);
				}
			}
			if ( $sloty ) {
				$wynik[ $data ] = $sloty;
			}
		}
		return apply_filters( 'mp_rezerwacje_terminy', $wynik, $wizyta, $od, $do );
	}

	/** Czy dokładnie ten termin można teraz zarezerwować (świeże dane z Google, tuż przed zapisem). */
	public static function czy_wolny( array $wizyta, DateTimeImmutable $start, int $pomin = 0 ): bool {
		$dzien = Czas::lokalnie( $start )->setTime( 0, 0 );
		if ( $dzien < Czas::dzis() || $dzien > self::granica() ) {
			return false;
		}
		foreach ( self::dni( $wizyta, $dzien, $dzien, $pomin, true )[ $dzien->format( 'Y-m-d' ) ] ?? array() as $slot ) {
			if ( $slot['od']->getTimestamp() === $start->getTimestamp() ) {
				return $slot['wolny'];
			}
		}
		return false;
	}

	/** Ostatni dzień, na który można się umówić. */
	public static function granica(): DateTimeImmutable {
		return Czas::dzis()->modify( '+' . (int) Ustawienia::get( 'zasady.okno' ) . ' days' );
	}

	/** Godziny pracy: numer dnia (1 = pn) => przedziały w minutach. */
	public static function godziny_tygodnia(): array {
		$wynik = array();
		foreach ( (array) Ustawienia::get( 'godziny' ) as $dzien => $tekst ) {
			$wynik[ (int) $dzien ] = Czas::przedzialy( (string) $tekst ) ?? array();
		}
		return $wynik;
	}

	/** Dni tygodnia z godzinami pracy (kolumny kalendarza). */
	private static function dni_pracujace(): array {
		$dni = array_keys( array_filter( self::godziny_tygodnia() ) );
		return $dni ?: array( 1, 2, 3, 4, 5 );
	}

	/**
	 * Zajęte przedziały [od, do] (znaczniki czasu) i liczba rezerwacji na dzień (do limitu dziennego).
	 * Gdy Google nie odpowiada, liczą się tylko rezerwacje z bazy, a błąd trafia do dziennika.
	 */
	private static function zajete( int $od, int $do, int $pomin, bool $swieze ): array {
		$zajete   = array();
		$na_dzien = array();
		foreach ( Baza::zajete( gmdate( 'Y-m-d H:i:s', $od - DAY_IN_SECONDS ), gmdate( 'Y-m-d H:i:s', $do + DAY_IN_SECONDS ), $pomin ) as $r ) {
			$zajete[] = array( strtotime( $r['poczatek'] . ' UTC' ), strtotime( $r['koniec'] . ' UTC' ) );
			$dzien    = Czas::z_bazy( $r['poczatek'] )->format( 'Y-m-d' );
			$na_dzien[ $dzien ] = ( $na_dzien[ $dzien ] ?? 0 ) + 1;
		}

		if ( Google::polaczony() ) {
			$google = Google::zajetosc( $od, $do, $swieze );
			if ( is_wp_error( $google ) ) {
				Dziennik::zapisz( 'Zajętość z Google: ' . $google->get_error_message() );
			} else {
				$wlasna = $pomin ? Baza::po_id( $pomin ) : null;
				if ( $wlasna ) {
					$a      = strtotime( $wlasna['poczatek'] . ' UTC' );
					$b      = strtotime( $wlasna['koniec'] . ' UTC' );
					$google = array_filter( $google, fn( $z ) => ! ( $z[0] === $a && $z[1] === $b ) );
				}
				$zajete = array_merge( $zajete, $google );
			}
		}
		return array( $zajete, $na_dzien );
	}

	private static function koliduje( array $zajete, int $od, int $do ): bool {
		foreach ( $zajete as list( $a, $b ) ) {
			if ( $od < $b && $do > $a ) {
				return true;
			}
		}
		return false;
	}

	private static function pierwszy_wolny( array $dni, string $od = '' ): ?string {
		foreach ( $dni as $data => $sloty ) {
			if ( $data >= $od && array_filter( $sloty, fn( $s ) => $s['wolny'] ) ) {
				return $data;
			}
		}
		return null;
	}

	private static function poniedzialek( DateTimeImmutable $d ): DateTimeImmutable {
		return $d->modify( '-' . ( (int) $d->format( 'N' ) - 1 ) . ' days' )->setTime( 0, 0 );
	}
}
