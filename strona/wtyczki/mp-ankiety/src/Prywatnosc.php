<?php
namespace MP\Ankiety;

defined( 'ABSPATH' ) || exit;

/**
 * RODO: propozycja tekstu do polityki prywatności, eksport i usuwanie danych na żądanie
 * (Narzędzia → Eksport / Usuwanie danych osobowych) i automatyczne usuwanie starych odpowiedzi.
 */
final class Prywatnosc {

	public static function start(): void {
		add_action( 'admin_init', array( self::class, 'tekst_polityki' ) );
		add_filter(
			'wp_privacy_personal_data_exporters',
			function ( array $eksportery ): array {
				$eksportery['mp-ankiety'] = array(
					'exporter_friendly_name' => 'Odpowiedzi z ankiet',
					'callback'               => array( self::class, 'eksport' ),
				);
				return $eksportery;
			}
		);
		add_filter(
			'wp_privacy_personal_data_erasers',
			function ( array $gumki ): array {
				$gumki['mp-ankiety'] = array(
					'eraser_friendly_name' => 'Odpowiedzi z ankiet',
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
		$dni   = (int) Ustawienia::get( 'przechowywanie' );
		$tekst = '<p>Gdy wypełniasz ankietę na stronie, zapisujemy Twoje odpowiedzi, w tym imię albo nazwę firmy i adres e-mail, jeśli je podasz, oraz adres strony, z której wysłano ankietę. Używamy ich, żeby odpowiedzieć i przygotować to, o co prosisz w ankiecie.</p>'
			. ( Automat::wlaczony() ? '<p>Kopia odpowiedzi trafia do naszego automatu (np. Google Apps Script), który przygotowuje odpowiedź; jego dostawca przetwarza dane w naszym imieniu.</p>' : '' )
			. '<p>' . ( $dni ? sprintf( 'Odpowiedzi usuwamy automatycznie po %d dniach.', $dni ) : 'Odpowiedzi przechowujemy do czasu, aż poprosisz o ich usunięcie.' ) . '</p>';
		wp_add_privacy_policy_content( 'MP Ankiety', wp_kses_post( $tekst ) );
	}

	public static function eksport( string $email, int $strona = 1 ): array {
		$dane = array();
		foreach ( Baza::po_emailu( $email, 100, ( $strona - 1 ) * 100 ) as $o ) {
			$pola = array(
				array(
					'name'  => 'Ankieta',
					'value' => $o['tytul'],
				),
				array(
					'name'  => 'Wysłano',
					'value' => get_date_from_gmt( $o['utworzona'], 'd.m.Y H:i' ),
				),
			);
			foreach ( $o['odpowiedzi'] as $odp ) {
				$pola[] = array(
					'name'  => $odp['pytanie'],
					'value' => $odp['tekst'],
				);
			}
			$dane[] = array(
				'group_id'    => 'mp-ankiety',
				'group_label' => 'Odpowiedzi z ankiet',
				'item_id'     => 'ankieta-' . $o['id'],
				'data'        => $pola,
			);
		}
		return array(
			'data' => $dane,
			'done' => count( $dane ) < 100,
		);
	}

	public static function usun( string $email, int $strona = 1 ): array {
		$odpowiedzi = Baza::po_emailu( $email, 100 );
		foreach ( $odpowiedzi as $o ) {
			Baza::usun( $o['id'] );
		}
		$automat = $odpowiedzi && Automat::wlaczony();
		return array(
			'items_removed'  => count( $odpowiedzi ) > 0,
			'items_retained' => $automat,
			'messages'       => $automat ? array( 'Odpowiedzi z ankiet: usuń też kopie z tym adresem e-mail u siebie w automacie (np. arkusz Google).' ) : array(),
			'done'           => count( $odpowiedzi ) < 100,
		);
	}

	/** Zadanie codzienne: usuwa odpowiedzi starsze niż ustawiony okres (0 = nie usuwa). */
	public static function usun_stare(): void {
		$dni = (int) Ustawienia::get( 'przechowywanie' );
		if ( $dni <= 0 ) {
			return;
		}
		foreach ( Baza::starsze_niz( gmdate( 'Y-m-d H:i:s', time() - $dni * DAY_IN_SECONDS ) ) as $id ) {
			Baza::usun( $id );
		}
	}
}
