<?php
/**
 * Panel: ustawienia w zakładkach. Każda zakładka to osobny formularz zapisujący tylko swoje pola.
 *
 * @var string $zakladka Bieżąca zakładka.
 * @var array  $u        Ustawienia (zapisane uzupełnione domyślnymi).
 */

use MP\Rezerwacje\Panel;

defined( 'ABSPATH' ) || exit;

$mp_strony = Panel::strony_z_kalendarzem();
?>
<div class="wrap mp-panel">
	<h1>Ustawienia rezerwacji</h1>
	<?php Panel::pokaz_komunikat(); ?>

	<p class="mp-gdzie">
		<?php if ( $mp_strony ) : ?>
			Kalendarz jest na stronie:
			<?php
			echo implode( // phpcs:ignore WordPress.Security.EscapeOutput
				', ',
				array_map( fn( $s ) => '<a href="' . esc_url( get_permalink( $s->ID ) ) . '" target="_blank">' . esc_html( $s->post_title ) . '</a>', $mp_strony )
			);
			?>
		<?php else : ?>
			Kalendarza nie ma jeszcze na żadnej stronie. Dodaj w edytorze blok „Rezerwacja terminu” albo shortcode <code>[mp_rezerwacja]</code>.
		<?php endif; ?>
	</p>

	<nav class="nav-tab-wrapper">
		<?php foreach ( Panel::ZAKLADKI as $mp_klucz => $mp_nazwa ) : ?>
		<a href="<?php echo esc_url( Panel::adres_ustawien( $mp_klucz ) ); ?>" class="nav-tab<?php echo $mp_klucz === $zakladka ? ' nav-tab-active' : ''; ?>"<?php echo $mp_klucz === $zakladka ? ' aria-current="page"' : ''; ?>><?php echo esc_html( $mp_nazwa ); ?></a>
		<?php endforeach; ?>
	</nav>

	<?php if ( 'narzedzia' === $zakladka ) : ?>
		<?php include __DIR__ . '/zakladki/narzedzia.php'; ?>
	<?php else : ?>
	<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" class="mp-formularz">
		<input type="hidden" name="action" value="mp_rez_zapisz">
		<input type="hidden" name="zakladka" value="<?php echo esc_attr( $zakladka ); ?>">
		<?php wp_nonce_field( 'mp_rez_zapisz' ); ?>
		<?php include __DIR__ . '/zakladki/' . $zakladka . '.php'; ?>
		<?php submit_button( 'Zapisz zmiany' ); ?>
	</form>
		<?php
		// Dodatkowe formularze zakładki (np. testowy e-mail) muszą stać poza formularzem ustawień.
		if ( is_file( __DIR__ . '/zakladki/' . $zakladka . '-po.php' ) ) {
			include __DIR__ . '/zakladki/' . $zakladka . '-po.php';
		}
		?>
	<?php endif; ?>
</div>
