<?php
namespace MP\Rezerwacje;

use DateTimeImmutable;
use DateTimeInterface;
use DateTimeZone;

defined( 'ABSPATH' ) || exit;

/**
 * Daty po polsku, strefa czasowa strony i zapis godzin pracy.
 * W bazie jest UTC, na stronie i w e-mailach czas strony (Ustawienia → Ogólne → Strefa czasowa).
 */
final class Czas {

	const DNI        = array( 1 => 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela' );
	const DNI_SKROT  = array( 1 => 'pn', 'wt', 'śr', 'czw', 'pt', 'sob', 'nd' );
	const DNI_W      = array( 1 => 'w poniedziałek', 'we wtorek', 'w środę', 'w czwartek', 'w piątek', 'w sobotę', 'w niedzielę' );
	const MIESIACE   = array( 1 => 'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień' );
	const MIESIACE_D = array( 1 => 'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia' );

	public static function strefa(): DateTimeZone {
		return wp_timezone();
	}

	public static function teraz(): DateTimeImmutable {
		return new DateTimeImmutable( 'now', self::strefa() );
	}

	public static function dzis(): DateTimeImmutable {
		return self::teraz()->setTime( 0, 0 );
	}

	/** Północ podanego dnia ('Y-m-d') w strefie strony albo null, gdy data jest błędna. */
	public static function dzien( string $data ): ?DateTimeImmutable {
		$d = DateTimeImmutable::createFromFormat( '!Y-m-d', $data, self::strefa() );
		return ( $d && $d->format( 'Y-m-d' ) === $data ) ? $d : null;
	}

	/** Ten sam moment w strefie strony. */
	public static function lokalnie( DateTimeInterface $d ): DateTimeImmutable {
		return ( new DateTimeImmutable( '@' . $d->getTimestamp() ) )->setTimezone( self::strefa() );
	}

	/** Data z bazy (UTC, 'Y-m-d H:i:s') w strefie strony. */
	public static function z_bazy( string $utc ): DateTimeImmutable {
		return ( new DateTimeImmutable( $utc, new DateTimeZone( 'UTC' ) ) )->setTimezone( self::strefa() );
	}

	public static function do_bazy( DateTimeInterface $d ): string {
		return gmdate( 'Y-m-d H:i:s', $d->getTimestamp() );
	}

	/** Zapis wymieniany z przeglądarką: 2026-10-29T18:30:00Z. */
	public static function iso( DateTimeInterface $d ): string {
		return gmdate( 'Y-m-d\TH:i:s\Z', $d->getTimestamp() );
	}

	public static function z_iso( string $iso ): ?DateTimeImmutable {
		if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/', $iso ) ) {
			return null;
		}
		try {
			return ( new DateTimeImmutable( $iso ) )->setTimezone( self::strefa() );
		} catch ( \Exception $e ) {
			return null;
		}
	}

	/** „czwartek, 29 października” (z rokiem, gdy inny niż bieżący). */
	public static function data( DateTimeInterface $d ): string {
		$d     = self::lokalnie( $d );
		$tekst = self::DNI[ (int) $d->format( 'N' ) ] . ', ' . $d->format( 'j' ) . ' ' . self::MIESIACE_D[ (int) $d->format( 'n' ) ];
		if ( $d->format( 'Y' ) !== self::teraz()->format( 'Y' ) ) {
			$tekst .= ' ' . $d->format( 'Y' );
		}
		return $tekst;
	}

	/** „czw 29.10” do tematów e-maili i list. */
	public static function data_krotka( DateTimeInterface $d ): string {
		$d = self::lokalnie( $d );
		return self::DNI_SKROT[ (int) $d->format( 'N' ) ] . ' ' . $d->format( 'j.m' );
	}

	public static function godzina( DateTimeInterface $d ): string {
		return self::lokalnie( $d )->format( 'H:i' );
	}

	/** „czwartek, 29 października, 19:30–20:00” */
	public static function termin( DateTimeInterface $od, DateTimeInterface $do ): string {
		return self::data( $od ) . ', ' . self::godzina( $od ) . '–' . self::godzina( $do );
	}

	/** „dziś o 19:30”, „jutro o 19:30”, „w czwartek o 19:30”, a dalej „w czwartek, 5 listopada, o 19:30”. */
	public static function kiedy( DateTimeInterface $d ): string {
		$d   = self::lokalnie( $d );
		$o   = 'o ' . $d->format( 'H:i' );
		$dni = self::roznica_dni( self::dzis(), $d );
		if ( 0 === $dni ) {
			return 'dziś ' . $o;
		}
		if ( 1 === $dni ) {
			return 'jutro ' . $o;
		}
		$dzien = self::DNI_W[ (int) $d->format( 'N' ) ];
		if ( $dni > 1 && $dni < 7 ) {
			return $dzien . ' ' . $o;
		}
		return $dzien . ', ' . $d->format( 'j' ) . ' ' . self::MIESIACE_D[ (int) $d->format( 'n' ) ] . ', ' . $o;
	}

	/** Nazwa miesiąca nad kalendarzem: „Październik 2026”, „Październik – listopad 2026”. */
	public static function miesiace( DateTimeInterface $od, DateTimeInterface $do ): string {
		$m1 = self::MIESIACE[ (int) $od->format( 'n' ) ];
		$m2 = self::MIESIACE[ (int) $do->format( 'n' ) ];
		$r1 = $od->format( 'Y' );
		$r2 = $do->format( 'Y' );
		if ( $r1 !== $r2 ) {
			$tekst = "$m1 $r1 – $m2 $r2";
		} elseif ( $m1 !== $m2 ) {
			$tekst = "$m1 – $m2 $r1";
		} else {
			$tekst = "$m1 $r1";
		}
		return self::wielka( $tekst );
	}

	public static function wielka( string $tekst ): string {
		return mb_strtoupper( mb_substr( $tekst, 0, 1 ) ) . mb_substr( $tekst, 1 );
	}

	/** Odmiana przez liczby: 1 pytanie, 2 pytania, 5 pytań. */
	public static function odmiana( int $n, string $jeden, string $kilka, string $wiele ): string {
		if ( 1 === $n ) {
			return $jeden;
		}
		$r10  = $n % 10;
		$r100 = $n % 100;
		return ( $r10 >= 2 && $r10 <= 4 && ( $r100 < 12 || $r100 > 14 ) ) ? $kilka : $wiele;
	}

	/** „30 minut”, „1 godzina”, „1,5 godziny”. */
	public static function dlugosc( int $minuty ): string {
		if ( $minuty >= 60 && 0 === $minuty % 60 ) {
			$h = intdiv( $minuty, 60 );
			return $h . "\u{00A0}" . self::odmiana( $h, 'godzina', 'godziny', 'godzin' );
		}
		if ( 90 === $minuty ) {
			return "1,5\u{00A0}godziny";
		}
		return $minuty . "\u{00A0}" . self::odmiana( $minuty, 'minuta', 'minuty', 'minut' );
	}

	/**
	 * Godziny pracy z tekstu: „9:00-12:00, 13:00-17:00” → [[540, 720], [780, 1020]] (minuty od północy).
	 * Pusty tekst to dzień wolny ([]), błędny zapis to null.
	 */
	public static function przedzialy( string $tekst ): ?array {
		$tekst = trim( $tekst );
		if ( '' === $tekst ) {
			return array();
		}
		$wynik = array();
		foreach ( preg_split( '/[,;]+/', $tekst ) as $kawalek ) {
			if ( ! preg_match( '/^\s*(\d{1,2})(?:[:.](\d{2}))?\s*(?:-|–|—|do)\s*(\d{1,2})(?:[:.](\d{2}))?\s*$/u', $kawalek, $m ) ) {
				return null;
			}
			$m1 = (int) ( $m[2] ?? 0 );
			$m2 = (int) ( $m[4] ?? 0 );
			$od = (int) $m[1] * 60 + $m1;
			$do = (int) $m[3] * 60 + $m2;
			if ( $m1 > 59 || $m2 > 59 || $od >= $do || $do > 1440 ) {
				return null;
			}
			$wynik[] = array( $od, $do );
		}
		usort( $wynik, fn( $a, $b ) => $a[0] <=> $b[0] );
		for ( $i = 1, $n = count( $wynik ); $i < $n; $i++ ) {
			if ( $wynik[ $i ][0] < $wynik[ $i - 1 ][1] ) {
				return null;
			}
		}
		return $wynik;
	}

	/** [[540, 720]] → „09:00-12:00” */
	public static function przedzialy_tekst( array $przedzialy ): string {
		return implode( ', ', array_map( fn( $p ) => self::hhmm( $p[0] ) . '-' . self::hhmm( $p[1] ), $przedzialy ) );
	}

	public static function hhmm( int $minuty ): string {
		return sprintf( '%02d:%02d', intdiv( $minuty, 60 ), $minuty % 60 );
	}

	/**
	 * Wyjątki od godzin pracy, po jednym w linii (daty także jako 24.12.2026):
	 *   2026-12-24                  dzień wolny
	 *   2026-12-24 - 2026-12-31     kilka dni wolnych
	 *   2026-11-14 10:00-14:00      inne godziny tego dnia
	 * Zwraca ['dni' => ['Y-m-d' => przedziały], 'bledy' => [linie, których nie rozumiem]].
	 */
	public static function wyjatki( string $tekst ): array {
		$dni   = array();
		$bledy = array();
		$tekst = preg_replace_callback(
			'/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/',
			fn( $m ) => sprintf( '%04d-%02d-%02d', $m[3], $m[2], $m[1] ),
			$tekst
		);
		foreach ( preg_split( '/\R/', $tekst ) as $linia ) {
			$linia = trim( preg_replace( '/#.*$/', '', $linia ) );
			if ( '' === $linia ) {
				continue;
			}
			if ( preg_match( '/^(\d{4}-\d{2}-\d{2})\s*(?:-|–|—|do)\s*(\d{4}-\d{2}-\d{2})$/u', $linia, $m ) ) {
				$od = self::dzien( $m[1] );
				$do = self::dzien( $m[2] );
				if ( ! $od || ! $do || $do < $od || $od->diff( $do )->days > 366 ) {
					$bledy[] = $linia;
					continue;
				}
				for ( $d = $od; $d <= $do; $d = $d->modify( '+1 day' ) ) {
					$dni[ $d->format( 'Y-m-d' ) ] = array();
				}
				continue;
			}
			if ( preg_match( '/^(\d{4}-\d{2}-\d{2})(?:\s+(.+))?$/u', $linia, $m ) ) {
				$przedzialy = isset( $m[2] ) ? self::przedzialy( $m[2] ) : array();
				if ( ! self::dzien( $m[1] ) || null === $przedzialy ) {
					$bledy[] = $linia;
					continue;
				}
				$dni[ $m[1] ] = $przedzialy;
				continue;
			}
			$bledy[] = $linia;
		}
		return array(
			'dni'   => $dni,
			'bledy' => $bledy,
		);
	}

	/** Dni ustawowo wolne od pracy w Polsce: 'Y-m-d' => nazwa. */
	public static function swieta( int $rok ): array {
		$swieta = array(
			"$rok-01-01" => 'Nowy Rok',
			"$rok-01-06" => 'Trzech Króli',
			"$rok-05-01" => 'Święto Pracy',
			"$rok-05-03" => 'Święto Konstytucji 3 Maja',
			"$rok-08-15" => 'Wniebowzięcie NMP',
			"$rok-11-01" => 'Wszystkich Świętych',
			"$rok-11-11" => 'Święto Niepodległości',
			"$rok-12-25" => 'Boże Narodzenie',
			"$rok-12-26" => 'Drugi dzień Bożego Narodzenia',
		);
		if ( $rok >= 2025 ) {
			$swieta[ "$rok-12-24" ] = 'Wigilia';
		}
		$wielkanoc = self::wielkanoc( $rok );
		foreach ( array( 0 => 'Wielkanoc', 1 => 'Poniedziałek Wielkanocny', 49 => 'Zielone Świątki', 60 => 'Boże Ciało' ) as $po => $nazwa ) {
			$swieta[ $wielkanoc->modify( "+$po days" )->format( 'Y-m-d' ) ] = $nazwa;
		}
		ksort( $swieta );
		return $swieta;
	}

	/** Niedziela Wielkanocna (algorytm Meeusa, kalendarz gregoriański). */
	private static function wielkanoc( int $rok ): DateTimeImmutable {
		$a = $rok % 19;
		$b = intdiv( $rok, 100 );
		$c = $rok % 100;
		$d = intdiv( $b, 4 );
		$e = $b % 4;
		$f = intdiv( $b + 8, 25 );
		$g = intdiv( $b - $f + 1, 3 );
		$h = ( 19 * $a + $b - $d - $g + 15 ) % 30;
		$i = intdiv( $c, 4 );
		$k = $c % 4;
		$l = ( 32 + 2 * $e + 2 * $i - $h - $k ) % 7;
		$m = intdiv( $a + 11 * $h + 22 * $l, 451 );
		$n = $h + $l - 7 * $m + 114;
		return new DateTimeImmutable( sprintf( '%04d-%02d-%02d', $rok, intdiv( $n, 31 ), $n % 31 + 1 ), new DateTimeZone( 'UTC' ) );
	}

	/** Liczba dni kalendarzowych między datami (bez wpływu zmiany czasu). */
	private static function roznica_dni( DateTimeInterface $a, DateTimeInterface $b ): int {
		$x = strtotime( self::lokalnie( $a )->format( 'Y-m-d' ) . ' UTC' );
		$y = strtotime( self::lokalnie( $b )->format( 'Y-m-d' ) . ' UTC' );
		return (int) round( ( $y - $x ) / DAY_IN_SECONDS );
	}
}
