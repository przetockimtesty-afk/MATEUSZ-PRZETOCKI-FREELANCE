<?php
/**
 * Panel: jedna odpowiedź.
 *
 * @var array|null $o Odpowiedź (Baza::po_id) albo null, gdy jej nie ma.
 */

use MP\Ankiety\Automat;
use MP\Ankiety\Panel;

defined( 'ABSPATH' ) || exit;

$mp_lista = admin_url( 'admin.php?page=' . Panel::STRONA );
?>
<div class="wrap mp-panel">
	<p><a href="<?php echo esc_url( $mp_lista ); ?>">← Wszystkie odpowiedzi</a></p>
	<?php if ( ! $o ) : ?>
	<h1>Nie ma takiej odpowiedzi</h1>
	<p>Mogła zostać usunięta.</p>
	<?php else : ?>
	<h1><?php echo esc_html( $o['nazwa'] ?: ( $o['email'] ?: 'Odpowiedź #' . $o['id'] ) ); ?></h1>
	<?php Panel::pokaz_komunikat(); ?>
	<p class="mp-meta">
		<?php echo esc_html( $o['tytul'] ); ?> · <?php echo esc_html( get_date_from_gmt( $o['utworzona'], 'd.m.Y, H:i' ) ); ?>
		<?php if ( is_email( $o['email'] ) ) : ?>
		· <a href="mailto:<?php echo esc_attr( $o['email'] ); ?>"><?php echo esc_html( $o['email'] ); ?></a>
		<?php endif; ?>
		<?php echo Panel::znaczek_automatu( $o ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
	</p>
	<?php if ( $o['zrodlo'] ) : ?>
	<p class="mp-maly">Wysłano ze strony: <a href="<?php echo esc_url( $o['zrodlo'] ); ?>"><?php echo esc_html( $o['zrodlo'] ); ?></a></p>
	<?php endif; ?>
	<?php if ( 'blad' === $o['automat'] && $o['blad'] ) : ?>
	<div class="notice notice-warning inline"><p><?php echo esc_html( $o['blad'] ); ?></p></div>
	<?php endif; ?>

	<div class="mp-odpowiedz">
		<?php
		$mp_krok = null;
		foreach ( $o['odpowiedzi'] as $mp_odp ) :
			if ( $mp_odp['krok'] !== $mp_krok ) :
				if ( null !== $mp_krok ) {
					echo '</dl>';
				}
				$mp_krok = $mp_odp['krok'];
				?>
		<h2><?php echo esc_html( $mp_krok ); ?></h2>
		<dl>
			<?php endif; ?>
			<dt><?php echo esc_html( $mp_odp['pytanie'] ); ?></dt>
			<dd><?php echo nl2br( esc_html( $mp_odp['tekst'] ) ); ?></dd>
		<?php endforeach; ?>
		<?php echo null !== $mp_krok ? '</dl>' : ''; ?>
	</div>

	<p class="mp-akcje-odpowiedzi">
		<?php if ( Automat::wlaczony() ) : ?>
		<a class="button" href="<?php echo esc_url( Panel::link_akcji( 'ponow', $o['id'] ) ); ?>">Wyślij ponownie do automatu</a>
		<?php endif; ?>
		<a class="button button-link-delete" href="<?php echo esc_url( Panel::link_akcji( 'usun', $o['id'] ) ); ?>" onclick="return window.confirm('Usunąć tę odpowiedź na zawsze?');">Usuń odpowiedź</a>
	</p>
	<?php endif; ?>
</div>
