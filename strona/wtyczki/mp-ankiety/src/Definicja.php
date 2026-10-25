<?php
namespace MP\Ankiety;

defined( 'ABSPATH' ) || exit;

/**
 * Definicja ankiety zapisana w atrybucie bloku „mp/ankieta” (JSON): kroki, pytania, warunki.
 * Ta sama logika widoczności działa w przeglądarce (view.js) i tutaj, przy sprawdzaniu odpowiedzi.
 *
 * Warunek „gdy”: {"POLE": ["wartość", …]} albo lista takich obiektów (wystarczy, że spełniony jest jeden).
 * W obiekcie muszą się zgadzać wszystkie pola; "*" oznacza „pole ma jakąkolwiek odpowiedź”.
 * Warunek może odwoływać się tylko do pytań, które są wcześniej w ankiecie.
 */
final class Definicja {

	const TYPY = array( 'tekst', 'email', 'telefon', 'liczba', 'akapit', 'jeden', 'wiele', 'skala', 'zgoda', 'info' );
	const INNE = '__inne';

	/** Definicja ankiety o danym identyfikatorze z treści strony albo null. */
	public static function znajdz( int $strona, string $ankieta ): ?array {
		$post = get_post( $strona );
		if ( ! $post || '' === $ankieta || ! has_block( 'mp/ankieta', $post ) || post_password_required( $post ) ) {
			return null;
		}
		if ( 'publish' !== $post->post_status && ! current_user_can( 'edit_post', $post->ID ) ) {
			return null;
		}
		foreach ( self::bloki( parse_blocks( $post->post_content ) ) as $blok ) {
			$d = self::normalizuj( (array) ( $blok['attrs']['definicja'] ?? array() ) );
			if ( $d && $d['id'] === $ankieta ) {
				return $d;
			}
		}
		return null;
	}

	/** Wszystkie bloki ankiety, także zagnieżdżone w grupach i kolumnach. */
	public static function bloki( array $bloki ): array {
		$wynik = array();
		foreach ( $bloki as $blok ) {
			if ( 'mp/ankieta' === ( $blok['blockName'] ?? '' ) ) {
				$wynik[] = $blok;
			}
			if ( ! empty( $blok['innerBlocks'] ) ) {
				$wynik = array_merge( $wynik, self::bloki( $blok['innerBlocks'] ) );
			}
		}
		return $wynik;
	}

	/** Oczyszczona definicja albo null, gdy nie ma identyfikatora albo żadnego pytania. */
	public static function normalizuj( array $d ): ?array {
		$id = sanitize_key( (string) ( $d['id'] ?? '' ) );
		if ( '' === $id ) {
			return null;
		}
		$kroki = array();
		$n     = 0;
		foreach ( (array) ( $d['kroki'] ?? array() ) as $k ) {
			if ( ! is_array( $k ) ) {
				continue;
			}
			$pytania = array();
			foreach ( (array) ( $k['pytania'] ?? array() ) as $p ) {
				$p = is_array( $p ) ? self::pytanie( $p, $n ) : null;
				if ( $p ) {
					$pytania[] = $p;
					++$n;
				}
			}
			if ( $pytania ) {
				$kroki[] = array(
					'tytul'   => self::tekst( $k['tytul'] ?? '' ),
					'opis'    => self::tekst( $k['opis'] ?? '' ),
					'gdy'     => self::warunek( $k['gdy'] ?? null ),
					'pytania' => $pytania,
				);
			}
		}
		if ( ! $kroki ) {
			return null;
		}
		$dziekuje = is_array( $d['dziekuje'] ?? null ) ? $d['dziekuje'] : array();
		$potw     = is_array( $d['potwierdzenie'] ?? null ) ? $d['potwierdzenie'] : array();
		$zd       = is_array( $d['zdarzenia'] ?? null ) ? $d['zdarzenia'] : array();
		$pola     = is_array( $d['pola'] ?? null ) ? $d['pola'] : array();
		return array(
			'id'            => $id,
			'nazwa'         => self::tekst( $d['nazwa'] ?? '' ) ?: $id,
			'naglowek'      => self::tekst( $d['naglowek'] ?? '' ),
			'wstep'         => self::tekst( $d['wstep'] ?? '' ),
			'czas'          => self::tekst( $d['czas'] ?? '' ),
			'wyslij'        => self::tekst( $d['wyslij'] ?? '' ) ?: 'Wyślij odpowiedzi',
			'prywatnosc'    => self::tekst( $d['prywatnosc'] ?? '' ),
			'automat'       => ! empty( $d['automat'] ),
			'pola'          => array(
				'email' => self::klucz( $pola['email'] ?? '' ),
				'nazwa' => self::klucz( $pola['nazwa'] ?? '' ),
			),
			'dziekuje'      => array(
				'naglowek' => self::tekst( $dziekuje['naglowek'] ?? '' ) ?: 'Dziękuję! Odpowiedzi dotarły.',
				'tekst'    => self::tekst( $dziekuje['tekst'] ?? '' ),
				'przycisk' => self::tekst( $dziekuje['przycisk'] ?? '' ),
				'adres'    => self::adres( (string) ( $dziekuje['adres'] ?? '' ) ),
			),
			'potwierdzenie' => array(
				'temat' => self::tekst( $potw['temat'] ?? '' ),
				'tekst' => self::tekst( $potw['tekst'] ?? '' ),
				'kopia' => ! isset( $potw['kopia'] ) || ! empty( $potw['kopia'] ),
			),
			'zdarzenia'     => array(
				'ga4'  => preg_replace( '/[^A-Za-z0-9_]/', '', (string) ( $zd['ga4'] ?? '' ) ),
				'meta' => preg_replace( '/[^A-Za-z0-9_]/', '', (string) ( $zd['meta'] ?? '' ) ),
			),
			'kroki'         => $kroki,
		);
	}

	/** Wszystkie pytania po kolei (z numerem kroku). */
	public static function pytania( array $d ): array {
		$wynik = array();
		foreach ( $d['kroki'] as $i => $k ) {
			foreach ( $k['pytania'] as $p ) {
				$wynik[] = $p + array( 'krok' => $i );
			}
		}
		return $wynik;
	}

	/**
	 * Sprawdza odpowiedzi z przeglądarki: tylko widoczne pytania, w kolejności ankiety.
	 *
	 * @param array $surowe {ID: wartość, ID__inne: tekst}
	 * @return array{bledy: array, odpowiedzi: array} błędy kluczowane „p{numer pytania}”
	 */
	public static function sprawdz( array $d, array $surowe ): array {
		$bledy      = array();
		$odpowiedzi = array();
		$wartosci   = array();
		$widoczne   = array();
		foreach ( $d['kroki'] as $k ) {
			if ( ! self::spelnia( $k['gdy'], $wartosci ) ) {
				continue;
			}
			foreach ( $k['pytania'] as $p ) {
				if ( 'info' === $p['typ'] || isset( $widoczne[ $p['id'] ] ) || ! self::spelnia( $p['gdy'], $wartosci ) ) {
					continue;
				}
				$widoczne[ $p['id'] ] = true;
				$wynik                = self::odczytaj( $p, $surowe );
				if ( isset( $wynik['blad'] ) ) {
					$bledy[ 'p' . $p['n'] ] = $wynik['blad'];
					continue;
				}
				if ( null === $wynik['wartosc'] ) {
					if ( $p['wymagane'] ) {
						$bledy[ 'p' . $p['n'] ] = 'zgoda' === $p['typ'] ? 'Zaznacz, żeby przejść dalej.' : 'To pytanie jest wymagane.';
					}
					continue;
				}
				$wartosci[ $p['id'] ] = $wynik['wartosc'];
				$odpowiedzi[]         = array(
					'id'      => $p['id'],
					'pytanie' => $p['tytul'],
					'krok'    => $k['tytul'],
					'typ'     => $p['typ'],
					'wartosc' => $wynik['wartosc'],
					'tekst'   => $wynik['tekst'],
				) + ( isset( $wynik['lista'] ) ? array( 'lista' => $wynik['lista'] ) : array() );
			}
		}
		return array(
			'bledy'      => $bledy,
			'odpowiedzi' => $odpowiedzi,
		);
	}

	/** Czy warunek jest spełniony przy dotychczasowych odpowiedziach {ID: wartość albo lista wartości}. */
	public static function spelnia( array $gdy, array $wartosci ): bool {
		if ( ! $gdy ) {
			return true;
		}
		foreach ( $gdy as $alternatywa ) {
			$ok = true;
			foreach ( $alternatywa as $pole => $dozwolone ) {
				$jest = $wartosci[ $pole ] ?? null;
				if ( null === $jest || ( is_array( $jest ) && ! $jest ) ) {
					$ok = false;
					break;
				}
				if ( in_array( '*', $dozwolone, true ) ) {
					continue;
				}
				if ( ! array_intersect( (array) $jest, $dozwolone ) ) {
					$ok = false;
					break;
				}
			}
			if ( $ok ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Wartość jednego pytania: [wartosc, tekst (+ lista)] albo [blad]. Brak odpowiedzi = wartosc null.
	 */
	private static function odczytaj( array $p, array $surowe ): array {
		$surowa = $surowe[ $p['id'] ] ?? null;
		$inne   = is_scalar( $surowe[ $p['id'] . self::INNE ] ?? null ) ? self::linia( (string) $surowe[ $p['id'] . self::INNE ], 190 ) : '';
		$pusto  = array(
			'wartosc' => null,
			'tekst'   => '',
		);

		switch ( $p['typ'] ) {
			case 'jeden':
				$w = is_scalar( $surowa ) ? (string) $surowa : '';
				if ( '' === $w ) {
					return $pusto;
				}
				if ( self::INNE === $w && '' !== $p['inne'] ) {
					return '' === $inne ? array( 'blad' => 'Wpisz, jaka to odpowiedź.' ) : array(
						'wartosc' => self::INNE,
						'tekst'   => $inne,
					);
				}
				foreach ( $p['opcje'] as $o ) {
					if ( $o['w'] === $w ) {
						return array(
							'wartosc' => $w,
							'tekst'   => $o['t'],
						);
					}
				}
				return $pusto;

			case 'wiele':
				$wybrane = array_values( array_unique( array_map( 'strval', array_filter( (array) $surowa, 'is_scalar' ) ) ) );
				$wartosc = array();
				$lista   = array();
				foreach ( $p['opcje'] as $o ) {
					if ( in_array( $o['w'], $wybrane, true ) ) {
						$wartosc[] = $o['w'];
						$lista[]   = $o['t'];
					}
				}
				if ( '' !== $p['inne'] && in_array( self::INNE, $wybrane, true ) ) {
					if ( '' === $inne ) {
						return array( 'blad' => 'Wpisz, co jeszcze.' );
					}
					$wartosc[] = self::INNE;
					$lista[]   = $inne;
				}
				return $wartosc ? array(
					'wartosc' => $wartosc,
					'tekst'   => implode( ', ', $lista ),
					'lista'   => $lista,
				) : $pusto;

			case 'liczba':
				$w = is_scalar( $surowa ) ? str_replace( array( ' ', "\u{00A0}", ',' ), array( '', '', '.' ), trim( (string) $surowa ) ) : '';
				if ( '' === $w ) {
					return $pusto;
				}
				if ( ! is_numeric( $w ) ) {
					return array( 'blad' => 'Wpisz samą liczbę, np. 12.' );
				}
				$liczba = (float) $w;
				if ( ( null !== $p['min'] && $liczba < $p['min'] ) || ( null !== $p['max'] && $liczba > $p['max'] ) ) {
					return array( 'blad' => 'Wpisz liczbę od ' . self::liczba( $p['min'] ?? 0 ) . ( null !== $p['max'] ? ' do ' . self::liczba( $p['max'] ) : ' w górę' ) . '.' );
				}
				return array(
					'wartosc' => self::liczba( $liczba ),
					'tekst'   => self::liczba( $liczba ),
				);

			case 'skala':
				$w = is_scalar( $surowa ) ? trim( (string) $surowa ) : '';
				if ( '' === $w ) {
					return $pusto;
				}
				if ( ! preg_match( '/^\d{1,2}$/', $w ) || (int) $w < (int) $p['min'] || (int) $w > (int) $p['max'] ) {
					return array( 'blad' => 'Wybierz jedną z liczb.' );
				}
				return array(
					'wartosc' => (string) (int) $w,
					'tekst'   => (string) (int) $w,
				);

			case 'zgoda':
				return in_array( $surowa, array( true, 1, '1', 'tak', 'on' ), true ) ? array(
					'wartosc' => 'tak',
					'tekst'   => $p['tytul'],
				) : $pusto;

			case 'email':
				$w = is_scalar( $surowa ) ? trim( (string) $surowa ) : '';
				if ( '' === $w ) {
					return $pusto;
				}
				$czysty = sanitize_email( $w );
				return is_email( $czysty ) ? array(
					'wartosc' => $czysty,
					'tekst'   => $czysty,
				) : array( 'blad' => 'Wpisz poprawny adres e-mail, np. imie@firma.pl.' );

			case 'telefon':
				$w = is_scalar( $surowa ) ? self::linia( (string) $surowa, 40 ) : '';
				if ( '' === $w ) {
					return $pusto;
				}
				$cyfry = strlen( (string) preg_replace( '/\D/', '', $w ) );
				return preg_match( '/^[0-9 +()\-.]+$/', $w ) && $cyfry >= 7 && $cyfry <= 15 ? array(
					'wartosc' => $w,
					'tekst'   => $w,
				) : array( 'blad' => 'Wpisz numer telefonu, np. 600 100 200.' );

			case 'akapit':
				$w = is_scalar( $surowa ) ? mb_substr( trim( wp_specialchars_decode( sanitize_textarea_field( (string) $surowa ), ENT_QUOTES ) ), 0, 5000 ) : '';
				return '' === $w ? $pusto : array(
					'wartosc' => $w,
					'tekst'   => $w,
				);

			default: // tekst
				$w = is_scalar( $surowa ) ? self::linia( (string) $surowa, 300 ) : '';
				return '' === $w ? $pusto : array(
					'wartosc' => $w,
					'tekst'   => $w,
				);
		}
	}

	private static function pytanie( array $p, int $n ): ?array {
		$typ = (string) ( $p['typ'] ?? '' );
		if ( ! in_array( $typ, self::TYPY, true ) ) {
			return null;
		}
		$id    = self::klucz( $p['id'] ?? '' );
		$tytul = self::tekst( $p['tytul'] ?? '' );
		if ( 'info' !== $typ && ( '' === $id || '' === $tytul ) ) {
			return null;
		}
		$opcje = array();
		if ( in_array( $typ, array( 'jeden', 'wiele' ), true ) ) {
			foreach ( (array) ( $p['opcje'] ?? array() ) as $o ) {
				$t = self::tekst( is_array( $o ) ? ( $o['t'] ?? '' ) : $o );
				$w = self::wartosc( is_array( $o ) && isset( $o['w'] ) ? $o['w'] : $t );
				if ( '' !== $t && '' !== $w && self::INNE !== $w ) {
					$opcje[] = array(
						'w'   => $w,
						't'   => $t,
						'sam' => is_array( $o ) && ! empty( $o['sam'] ),
					);
				}
			}
			if ( ! $opcje && empty( $p['inne'] ) ) {
				return null;
			}
		}
		$min = isset( $p['min'] ) && is_numeric( $p['min'] ) ? (float) $p['min'] : null;
		$max = isset( $p['max'] ) && is_numeric( $p['max'] ) ? (float) $p['max'] : null;
		if ( 'skala' === $typ ) {
			$min = $min ?? 0;
			$max = $max ?? 10;
		} elseif ( 'liczba' === $typ ) {
			$min = $min ?? 0;
		}
		return array(
			'n'          => $n,
			'id'         => '' !== $id ? $id : 'INFO_' . $n,
			'typ'        => $typ,
			'tytul'      => $tytul,
			'pomoc'      => self::tekst( $p['pomoc'] ?? '' ),
			'podpowiedz' => self::tekst( $p['podpowiedz'] ?? '' ),
			'wymagane'   => 'info' !== $typ && ! empty( $p['wymagane'] ),
			'opcje'      => $opcje,
			'inne'       => in_array( $typ, array( 'jeden', 'wiele' ), true ) ? self::tekst( $p['inne'] ?? '' ) : '',
			'gdy'        => self::warunek( $p['gdy'] ?? null ),
			'z_adresu'   => sanitize_key( (string) ( $p['z_adresu'] ?? '' ) ),
			'min'        => $min,
			'max'        => $max,
		);
	}

	/** Warunek jako lista alternatyw: [[POLE => [wartości]], …]. Pusta lista = zawsze. */
	private static function warunek( $gdy ): array {
		if ( ! is_array( $gdy ) || ! $gdy ) {
			return array();
		}
		$wynik = array();
		foreach ( array_is_list( $gdy ) ? $gdy : array( $gdy ) as $alternatywa ) {
			if ( ! is_array( $alternatywa ) ) {
				continue;
			}
			$czesci = array();
			foreach ( $alternatywa as $pole => $wartosci ) {
				$pole = self::klucz( $pole );
				if ( '' !== $pole ) {
					$czesci[ $pole ] = array_values( array_filter( array_map( array( self::class, 'wartosc' ), (array) $wartosci ), 'strlen' ) );
				}
			}
			if ( $czesci ) {
				$wynik[] = $czesci;
			}
		}
		return $wynik;
	}

	/** Identyfikator pytania: litery, cyfry i podkreślenie (wielkość liter zostaje). */
	public static function klucz( $x ): string {
		return is_scalar( $x ) ? substr( (string) preg_replace( '/[^A-Za-z0-9_]/', '', (string) $x ), 0, 40 ) : '';
	}

	private static function tekst( $x ): string {
		return is_scalar( $x ) ? mb_substr( trim( wp_strip_all_tags( (string) $x ) ), 0, 2000 ) : '';
	}

	private static function wartosc( $x ): string {
		return is_scalar( $x ) ? mb_substr( trim( wp_strip_all_tags( (string) $x ) ), 0, 190 ) : '';
	}

	/** Jedna linia tekstu od klienta, czytelna („<10%” zamiast „&lt;10%”); escapowanie przy wyświetlaniu. */
	private static function linia( string $x, int $max ): string {
		return mb_substr( trim( wp_specialchars_decode( sanitize_text_field( $x ), ENT_QUOTES ) ), 0, $max );
	}

	private static function liczba( float $x ): string {
		return rtrim( rtrim( number_format( $x, 2, '.', '' ), '0' ), '.' );
	}

	/** Adres przycisku po wysłaniu: ścieżka na tej stronie albo pełny adres. */
	private static function adres( string $x ): string {
		$x = trim( $x );
		if ( '' === $x ) {
			return '';
		}
		return str_starts_with( $x, '/' ) && ! str_starts_with( $x, '//' ) ? home_url( $x ) : esc_url_raw( $x );
	}
}
