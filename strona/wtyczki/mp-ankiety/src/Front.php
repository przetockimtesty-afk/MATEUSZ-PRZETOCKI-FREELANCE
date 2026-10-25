<?php
namespace MP\Ankiety;

defined( 'ABSPATH' ) || exit;

/**
 * Strona: blok „Ankieta”, ukrywanie stron z ankietami „tylko z linku” przed wyszukiwarkami.
 */
final class Front {

	/** Ikony z zestawu strony (Lucide, obrys 1,5). */
	const IKONY = array(
		'ok'       => '<path d="M20 6 9 17l-5-5"/>',
		'lewo'     => '<path d="m15 18-6-6 6-6"/>',
		'strzalka' => '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
		'info'     => '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
		'zegar'    => '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
	);

	const META_UKRYTA = '_mp_ankieta_ukryta';

	public static function start(): void {
		add_action( 'init', array( self::class, 'rejestruj' ) );
		add_filter( 'wp_robots', array( self::class, 'roboty' ) );
		add_filter( 'wp_sitemaps_posts_query_args', array( self::class, 'mapa_strony' ), 10, 2 );
		add_action( 'save_post', array( self::class, 'oznacz' ), 10, 2 );
	}

	public static function rejestruj(): void {
		register_block_type( dirname( PLIK ) . '/bloki/ankieta', array( 'render_callback' => array( self::class, 'blok' ) ) );
	}

	public static function blok( array $atrybuty ): string {
		$d = Definicja::normalizuj( (array) ( $atrybuty['definicja'] ?? array() ) );
		if ( ! $d ) {
			return current_user_can( 'edit_posts' ) ? '<p><em>Ankieta: brak pytań albo identyfikatora w definicji bloku.</em></p>' : '';
		}
		wp_enqueue_script( 'mp-ankieta-view-script' );
		wp_enqueue_style( 'mp-ankieta-style' );

		static $numer = 0;
		++$numer;
		$prefiks = 'mp-ank-' . $numer;
		$wrapper = get_block_wrapper_attributes( array( 'class' => 'mp-ank' ) );
		$dane    = array(
			'api'       => rest_url( Rest::NS . '/odpowiedzi' ),
			'strona'    => (int) get_the_ID(),
			'ankieta'   => $d['id'],
			'wyslij'    => $d['wyslij'],
			'dziekuje'  => $d['dziekuje'],
			'zdarzenia' => $d['zdarzenia'],
			'ikony'     => self::IKONY,
		);
		$polityka = Ustawienia::polityka();
		ob_start();
		include dirname( PLIK ) . '/szablony/ankieta.php';
		return (string) ob_get_clean();
	}

	/** Atrybut data-gdy z warunkiem (JSON) albo pusty tekst. */
	public static function warunek( array $gdy ): string {
		return $gdy ? ' data-gdy="' . esc_attr( (string) wp_json_encode( $gdy, JSON_UNESCAPED_UNICODE ) ) . '"' : '';
	}

	public static function ikona( string $nazwa ): string {
		return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' . ( self::IKONY[ $nazwa ] ?? '' ) . '</svg>';
	}

	/** Strona z ankietą „tylko z linku” (np. materiały dla klienta) nie trafia do wyszukiwarek. */
	public static function roboty( array $roboty ): array {
		if ( is_singular() && self::ukryta( get_post( (int) get_queried_object_id() ) ) ) {
			$roboty['noindex']  = true;
			$roboty['nofollow'] = true;
			unset( $roboty['max-image-preview'] );
		}
		return $roboty;
	}

	/** …i nie ma jej w mapie strony WordPressa (wp-sitemap.xml). */
	public static function mapa_strony( array $argumenty, string $typ ): array {
		$ukryte = get_posts(
			array(
				'post_type'      => $typ,
				'posts_per_page' => 200,
				'fields'         => 'ids',
				'meta_key'       => self::META_UKRYTA, // phpcs:ignore WordPress.DB.SlowDBQuery
				'no_found_rows'  => true,
			)
		);
		if ( $ukryte ) {
			$argumenty['post__not_in'] = array_merge( (array) ( $argumenty['post__not_in'] ?? array() ), $ukryte );
		}
		return $argumenty;
	}

	/** Czy strona ma ankietę z opcją „Ukryj tę stronę przed Google”. */
	public static function ukryta( ?\WP_Post $post ): bool {
		if ( ! $post || ! has_block( 'mp/ankieta', $post ) ) {
			return false;
		}
		foreach ( Definicja::bloki( parse_blocks( $post->post_content ) ) as $blok ) {
			if ( ! empty( $blok['attrs']['ukryta'] ) ) {
				return true;
			}
		}
		return false;
	}

	/** Po zapisie strony: zapamiętuje w meta, czy ukryć ją w mapie strony. */
	public static function oznacz( int $id, \WP_Post $post ): void {
		if ( wp_is_post_revision( $id ) || wp_is_post_autosave( $id ) ) {
			return;
		}
		if ( self::ukryta( $post ) ) {
			update_post_meta( $id, self::META_UKRYTA, 1 );
		} else {
			delete_post_meta( $id, self::META_UKRYTA );
		}
	}

	/** Przy włączeniu wtyczki: strony z ankietami zapisane wcześniej. */
	public static function oznacz_wszystkie(): void {
		foreach ( get_posts(
			array(
				'post_type'      => 'any',
				'post_status'    => array( 'publish', 'draft', 'private', 'pending', 'future' ),
				'posts_per_page' => 500,
				's'              => 'wp:mp/ankieta',
			)
		) as $post ) {
			self::oznacz( $post->ID, $post );
		}
	}
}
