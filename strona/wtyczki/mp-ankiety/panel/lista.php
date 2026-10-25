<?php
/**
 * Panel: lista odpowiedzi.
 *
 * @var array  $odpowiedzi Odpowiedzi na tej stronie listy.
 * @var int    $razem      Wszystkich pasujących.
 * @var int    $stron      Liczba stron listy.
 * @var int    $strona     Bieżąca strona.
 * @var string $ankieta    Wybrana ankieta (pusta = wszystkie).
 * @var string $szukaj     Szukana fraza.
 * @var array  $ankiety    Identyfikator => [tytuł, liczba odpowiedzi].
 */

use MP\Ankiety\Panel;

defined( 'ABSPATH' ) || exit;

$mp_adres = admin_url( 'admin.php?page=' . Panel::STRONA );
?>
<div class="wrap mp-panel">
	<h1 class="wp-heading-inline">Odpowiedzi z ankiet</h1>
	<a class="page-title-action" href="<?php echo esc_url( Panel::link_akcji( 'csv', 0, array( 'ankieta' => $ankieta ) ) ); ?>">Pobierz CSV</a>
	<?php if ( current_user_can( 'manage_options' ) ) : ?>
	<a class="page-title-action" href="<?php echo esc_url( admin_url( 'admin.php?page=' . Panel::USTAWIENIA ) ); ?>">Ustawienia</a>
	<?php endif; ?>
	<hr class="wp-header-end">

	<?php Panel::pokaz_komunikat(); ?>

	<div class="mp-pasek">
		<ul class="subsubsub">
			<li><a href="<?php echo esc_url( $mp_adres ); ?>"<?php echo '' === $ankieta ? ' class="current" aria-current="page"' : ''; ?>>Wszystkie <span class="count">(<?php echo (int) array_sum( array_column( $ankiety, 1 ) ); ?>)</span></a></li>
			<?php foreach ( $ankiety as $mp_id => list( $mp_tytul, $mp_ile ) ) : ?>
			<li> | <a href="<?php echo esc_url( add_query_arg( 'ankieta', $mp_id, $mp_adres ) ); ?>"<?php echo $mp_id === $ankieta ? ' class="current" aria-current="page"' : ''; ?>><?php echo esc_html( $mp_tytul ); ?> <span class="count">(<?php echo (int) $mp_ile; ?>)</span></a></li>
			<?php endforeach; ?>
		</ul>
		<form class="search-box" method="get">
			<input type="hidden" name="page" value="<?php echo esc_attr( Panel::STRONA ); ?>">
			<?php if ( $ankieta ) : ?>
			<input type="hidden" name="ankieta" value="<?php echo esc_attr( $ankieta ); ?>">
			<?php endif; ?>
			<label class="screen-reader-text" for="mp-szukaj">Szukaj w odpowiedziach</label>
			<input type="search" id="mp-szukaj" name="s" value="<?php echo esc_attr( $szukaj ); ?>" placeholder="Nazwa, e-mail albo słowo z odpowiedzi">
			<button class="button">Szukaj</button>
		</form>
	</div>

	<?php if ( ! $odpowiedzi ) : ?>
	<div class="mp-pusto">
		<p><strong><?php echo $szukaj ? 'Nic nie pasuje do wyszukiwania.' : 'Nie ma jeszcze odpowiedzi.'; ?></strong></p>
		<p>Ankietę dodajesz na stronie blokiem „Ankieta”. Każda wysłana odpowiedź pojawi się tutaj, a powiadomienie przyjdzie e-mailem.</p>
	</div>
	<?php else : ?>
	<table class="widefat striped mp-tabela">
		<thead>
			<tr>
				<th scope="col" class="mp-kol-data">Data</th>
				<th scope="col">Kto</th>
				<th scope="col">Ankieta</th>
				<th scope="col">Skąd</th>
				<th scope="col" class="mp-kol-akcje"><span class="screen-reader-text">Akcje</span></th>
			</tr>
		</thead>
		<tbody>
			<?php foreach ( $odpowiedzi as $mp_o ) : ?>
				<?php $mp_link = add_query_arg( 'odpowiedz', $mp_o['id'], $mp_adres ); ?>
			<tr class="<?php echo 'nowa' === $mp_o['status'] ? 'mp-nowa' : ''; ?>">
				<td class="mp-kol-data" data-etykieta="Data"><strong><?php echo esc_html( get_date_from_gmt( $mp_o['utworzona'], 'd.m.Y' ) ); ?></strong><span class="mp-maly"><?php echo esc_html( get_date_from_gmt( $mp_o['utworzona'], 'H:i' ) ); ?></span></td>
				<td data-etykieta="Kto">
					<a href="<?php echo esc_url( $mp_link ); ?>"><strong><?php echo esc_html( $mp_o['nazwa'] ?: ( $mp_o['email'] ?: 'Odpowiedź #' . $mp_o['id'] ) ); ?></strong></a>
					<?php if ( 'nowa' === $mp_o['status'] ) : ?>
					<span class="mp-znaczek">nowa</span>
					<?php endif; ?>
					<?php if ( $mp_o['email'] && $mp_o['nazwa'] ) : ?>
					<span class="mp-maly"><?php echo esc_html( $mp_o['email'] ); ?></span>
					<?php endif; ?>
				</td>
				<td data-etykieta="Ankieta"><?php echo esc_html( $mp_o['tytul'] ); ?><?php echo Panel::znaczek_automatu( $mp_o ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo 2 === $mp_o['maile'] ? '<span class="mp-znaczek mp-znaczek--blad">e-mail nie wyszedł</span>' : ''; ?></td>
				<td data-etykieta="Skąd"><span class="mp-maly mp-zrodlo"><?php echo esc_html( $mp_o['zrodlo'] ? preg_replace( '#^https?://[^/]+#', '', $mp_o['zrodlo'] ) : '—' ); ?></span></td>
				<td class="mp-kol-akcje"><a class="button" href="<?php echo esc_url( $mp_link ); ?>">Zobacz</a></td>
			</tr>
			<?php endforeach; ?>
		</tbody>
	</table>

		<?php if ( $stron > 1 ) : ?>
	<div class="tablenav bottom"><div class="tablenav-pages">
			<?php
			echo wp_kses_post(
				paginate_links(
					array(
						'base'    => add_query_arg( 'paged', '%#%' ),
						'format'  => '',
						'current' => $strona,
						'total'   => $stron,
					)
				)
			);
			?>
	</div></div>
		<?php endif; ?>
	<?php endif; ?>
</div>
