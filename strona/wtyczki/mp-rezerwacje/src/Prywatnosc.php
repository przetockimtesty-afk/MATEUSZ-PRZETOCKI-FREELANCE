<?php
namespace MP\Rezerwacje;

defined( 'ABSPATH' ) || exit;

/**
 * RODO: propozycja tekstu do polityki prywatności, eksport i usuwanie danych na żądanie
 * (Narzędzia → Eksport / Usuwanie danych osobowych) i automatyczne usuwanie starych danych.
 */
final class Prywatnosc {

	public static function start(): void {
		add_action( 'admin_init', array( self::class, 'tekst_polityki' ) );
		add_filter(
			'wp_privacy_personal_data_exporters',
			function ( array $eksportery ): array {
				$eksportery['mp-rezerwacje'] = array(
					'exporter_friendly_name' => 'Rezerwacje spotkań',
					'callback'               => array( self::class, 'eksport' ),
				);
				return $eksportery;
			}
		);
		add_filter(
			'wp_privacy_personal_data_erasers',
			function ( array $gumki ): array {
				$gumki['mp-rezerwacje'] = array(
					'eraser_friendly_name' => 'Rezerwacje spotkań',
					'callback'             => array( self::class, 'usun' ),
				);
				return $gumki;
			}
		);
	}

	public static function tekst_polityki(): void {
		if ( ! function_exists( 'wp_add_privacy_policy_content' ) ) {
			return;
		}
		$dni   = (int) Ustawienia::get( 'rodo.przechowywanie' );
		$tekst = '<p>Gdy umawiasz spotkanie przez kalendarz na stronie, zapisujemy imię i nazwisko, adres e-mail, numer telefonu (jeśli go podasz), wybrany termin i odpowiedzi z formularza. Używamy ich, żeby przygotować się do spotkania, potwierdzić je, przypomnieć o nim i umożliwić zmianę terminu.</p>'
			. ( Google::polaczony() ? '<p>Termin i dane spotkania trafiają też do naszego Kalendarza Google (Google Ireland Limited). Gdy usuwamy dane, z wydarzenia w kalendarzu też znikają dane osobowe.</p>' : '' )
			. ( Google::arkusz_wlaczony() ? '<p>Kopia zgłoszenia trafia też do naszego arkusza Google; usuwamy ją ręcznie w tym samym terminie albo na Twoją prośbę.</p>' : '' )
			. '<p>' . ( $dni ? sprintf( 'Dane usuwamy automatycznie %d dni po spotkaniu; zostaje tylko termin i rodzaj spotkania bez danych osobowych.', $dni ) : 'Dane przechowujemy do czasu, aż poprosisz o ich usunięcie.' ) . '</p>';
		wp_add_privacy_policy_content( 'MP Rezerwacje', wp_kses_post( $tekst ) );
	}

	public static function eksport( string $email, int $strona = 1 ): array {
		$dane = array();
		foreach ( Baza::po_emailu( $email, 100, ( $strona - 1 ) * 100 ) as $rez ) {
			$pola = array(
				array(
					'name'  => 'Termin',
					'value' => Czas::termin( Czas::z_bazy( $rez['poczatek'] ), Czas::z_bazy( $rez['koniec'] ) ),
				),
				array(
					'name'  => 'Status',
					'value' => 'odwolana' === $rez['status'] ? 'odwołana' : 'potwierdzona',
				),
				array(
					'name'  => 'Imię i nazwisko',
					'value' => $rez['imie'],
				),
				array(
					'name'  => 'E-mail',
					'value' => $rez['email'],
				),
				array(
					'name'  => 'Telefon',
					'value' => $rez['telefon'],
				),
			);
			foreach ( $rez['odpowiedzi'] as $o ) {
				$pola[] = array(
					'name'  => $o['etykieta'],
					'value' => $o['wartosc'],
				);
			}
			$dane[] = array(
				'group_id'    => 'mp-rezerwacje',
				'group_label' => 'Rezerwacje spotkań',
				'item_id'     => 'rezerwacja-' . $rez['id'],
				'data'        => $pola,
			);
		}
		return array(
			'data' => $dane,
			'done' => count( $dane ) < 100,
		);
	}

	public static function usun( string $email, int $strona = 1 ): array {
		$rezerwacje = Baza::po_emailu( $email, 100 );
		foreach ( $rezerwacje as $rez ) {
			self::anonimizuj( $rez );
		}
		$arkusz = $rezerwacje && Google::arkusz_wlaczony();
		return array(
			'items_removed'  => count( $rezerwacje ) > 0,
			'items_retained' => $arkusz,
			'messages'       => $arkusz ? array( 'Rezerwacje spotkań: usuń ręcznie wiersze z tym adresem e-mail w arkuszu Google ustawionym we wtyczce.' ) : array(),
			'done'           => count( $rezerwacje ) < 100,
		);
	}

	/** Zadanie codzienne: usuwa dane osobowe ze spotkań starszych niż ustawiony okres. */
	public static function anonimizuj_stare(): void {
		$dni = (int) Ustawienia::get( 'rodo.przechowywanie' );
		if ( $dni <= 0 ) {
			return;
		}
		foreach ( Baza::do_anonimizacji( gmdate( 'Y-m-d H:i:s', time() - $dni * DAY_IN_SECONDS ) ) as $id ) {
			$rez = Baza::po_id( $id );
			if ( $rez ) {
				self::anonimizuj( $rez );
			}
		}
	}

	/** Usuwa dane osobowe z rezerwacji i z wydarzenia w Kalendarzu Google. */
	private static function anonimizuj( array $rez ): void {
		Baza::anonimizuj( $rez['id'] );
		if ( '' !== $rez['google_id'] && Google::polaczony() ) {
			$wynik = Google::anonimizuj_wydarzenie( $rez );
			if ( is_wp_error( $wynik ) ) {
				Dziennik::zapisz( 'RODO, rezerwacja #' . $rez['id'] . ': nie udało się usunąć danych z Kalendarza Google (' . $wynik->get_error_message() . ').' );
			}
		}
	}
}
