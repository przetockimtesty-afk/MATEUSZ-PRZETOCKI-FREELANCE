<?php
/**
 * Panel: lista spotkań.
 *
 * @var array  $rezerwacje   Spotkania na tej stronie listy.
 * @var int    $razem        Wszystkich w tym widoku.
 * @var int    $stron        Liczba stron listy.
 * @var int    $strona       Bieżąca strona.
 * @var string $widok        nadchodzace | minione | odwolane | wszystkie
 * @var string $szukaj       Szukana fraza.
 * @var array  $liczniki     Liczba spotkań w każdym widoku.
 * @var array  $statystyki   Etykieta => liczba.
 * @var int    $bledy_google Spotkania, których nie udało się zapisać w Kalendarzu Google.
 */

use MP\Rezerwacje\Czas;
use MP\Rezerwacje\Panel;
use MP\Rezerwacje\Ustawienia;

defined( 'ABSPATH' ) || exit;

$mp_formy = Ustawienia::formy();
$mp_adres = admin_url( 'admin.php?page=' . Panel::STRONA );
$mp_dzien = '';
?>
<div class="wrap mp-panel">
	<h1 class="wp-heading-inline">Spotkania</h1>
	<a class="page-title-action" href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=mp_rez_akcja&akcja=csv&widok=' . $widok ), 'mp_rez_csv' ) ); ?>">Pobierz CSV</a>
	<?php if ( current_user_can( 'manage_options' ) ) : ?>
	<a class="page-title-action" href="<?php echo esc_url( Panel::adres_ustawien() ); ?>">Ustawienia</a>
	<?php endif; ?>
	<hr class="wp-header-end">

	<?php Panel::pokaz_komunikat(); ?>

	<?php Panel::problem_google(); ?>

	<?php if ( $bledy_google ) : ?>
	<div class="notice notice-warning">
		<p>
			<?php echo esc_html( sprintf( 'Spotkania z problemem w Kalendarzu Google: %d (nowe, których nie udało się zapisać, albo odwołane, które nadal tam stoją i blokują termin).', $bledy_google ) ); ?>
		</p>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="mp_rez_akcja">
			<input type="hidden" name="akcja" value="ponow_google">
			<?php wp_nonce_field( 'mp_rez_ponow_google' ); ?>
			<p><button class="button">Zapisz je ponownie w Google</button></p>
		</form>
	</div>
	<?php endif; ?>

	<div class="mp-karty">
		<?php foreach ( $statystyki as $mp_etykieta => $mp_liczba ) : ?>
		<div class="mp-karta"><span><?php echo esc_html( $mp_etykieta ); ?></span><strong><?php echo (int) $mp_liczba; ?></strong></div>
		<?php endforeach; ?>
	</div>

	<div class="mp-pasek">
		<ul class="subsubsub">
			<?php
			$mp_linki = array();
			foreach ( Panel::WIDOKI as $mp_klucz => $mp_nazwa ) {
				$mp_linki[] = sprintf(
					'<li><a href="%s"%s>%s <span class="count">(%d)</span></a>',
					esc_url( add_query_arg( 'widok', $mp_klucz, $mp_adres ) ),
					$mp_klucz === $widok ? ' class="current" aria-current="page"' : '',
					esc_html( $mp_nazwa ),
					(int) $liczniki[ $mp_klucz ]
				);
			}
			echo implode( ' |</li>', $mp_linki ) . '</li>'; // phpcs:ignore WordPress.Security.EscapeOutput
			?>
		</ul>
		<form method="get" class="search-box">
			<input type="hidden" name="page" value="<?php echo esc_attr( Panel::STRONA ); ?>">
			<input type="hidden" name="widok" value="<?php echo esc_attr( $widok ); ?>">
			<label class="screen-reader-text" for="mp-szukaj">Szukaj klienta</label>
			<input type="search" id="mp-szukaj" name="s" value="<?php echo esc_attr( $szukaj ); ?>" placeholder="Imię, e-mail albo telefon">
			<button class="button">Szukaj</button>
		</form>
	</div>

	<?php if ( ! $rezerwacje ) : ?>
	<div class="mp-pusto">
		<p><strong><?php echo $szukaj ? 'Nic nie znalazłem.' : ( 'nadchodzace' === $widok ? 'Na razie nie ma umówionych spotkań.' : 'Tu jeszcze nic nie ma.' ); ?></strong></p>
		<?php if ( 'nadchodzace' === $widok && ! $szukaj && ! Panel::strony_z_kalendarzem() ) : ?>
		<p>Dodaj blok „Rezerwacja terminu” na stronie (albo shortcode <code>[mp_rezerwacja]</code>), a nowe spotkania pojawią się tutaj.</p>
		<?php endif; ?>
	</div>
	<?php else : ?>
	<form id="mp-zbiorczo" class="mp-zbiorczo" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" onsubmit="return window.confirm('Usunąć zaznaczone spotkania na zawsze? Klienci nie dostaną e-maila, a nadchodzące spotkania znikną też z Kalendarza Google.');">
		<input type="hidden" name="action" value="mp_rez_akcja">
		<input type="hidden" name="akcja" value="usun_zaznaczone">
		<?php wp_nonce_field( 'mp_rez_usun_zaznaczone' ); ?>
		<button class="button" data-mp-zbiorczo disabled>Usuń zaznaczone</button>
		<span class="mp-maly">Np. próbne rezerwacje. Liczniki i statystyki liczą się od nowa.</span>
	</form>
	<table class="widefat mp-tabela">
		<thead>
			<tr>
				<td class="check-column"><input type="checkbox" data-mp-wszystkie aria-label="Zaznacz wszystkie na tej stronie"></td>
				<th scope="col" class="mp-kol-termin">Termin</th>
				<th scope="col">Klient</th>
				<th scope="col">Spotkanie</th>
				<th scope="col">Odpowiedzi</th>
				<th scope="col" class="mp-kol-akcje"><span class="screen-reader-text">Akcje</span></th>
			</tr>
		</thead>
		<tbody>
		<?php
		foreach ( $rezerwacje as $rez ) :
			$mp_od    = Czas::z_bazy( $rez['poczatek'] );
			$mp_data  = $mp_od->format( 'Y-m-d' );
			$mp_kiedy = Panel::kiedy( $rez );
			$mp_bylo  = strtotime( $rez['koniec'] . ' UTC' ) < time();
			if ( $mp_data !== $mp_dzien ) :
				$mp_dzien = $mp_data;
				?>
			<tr class="mp-dzien"><th colspan="6" scope="rowgroup"><?php echo esc_html( Czas::wielka( Czas::data( $mp_od ) ) ); ?></th></tr>
			<?php endif; ?>
			<tr class="<?php echo 'odwolana' === $rez['status'] ? 'mp-odwolana' : ''; ?>">
				<th scope="row" class="check-column"><input type="checkbox" name="ids[]" value="<?php echo (int) $rez['id']; ?>" form="mp-zbiorczo" aria-label="<?php echo esc_attr( 'Zaznacz: ' . ( $rez['imie'] ?: 'spotkanie' ) . ', ' . $mp_kiedy[0] ); ?>"></th>
				<td class="mp-kol-termin" data-etykieta="Termin">
					<strong><?php echo esc_html( $mp_kiedy[0] ); ?></strong>
					<span class="mp-maly"><?php echo esc_html( $mp_kiedy[1] ); ?></span>
				</td>
				<td data-etykieta="Klient">
					<?php if ( '' === $rez['email'] && '' === $rez['imie'] ) : ?>
					<span class="mp-maly">Dane usunięte (RODO)</span>
					<?php else : ?>
					<strong><?php echo esc_html( $rez['imie'] ); ?></strong>
					<span class="mp-maly"><a href="mailto:<?php echo esc_attr( $rez['email'] ); ?>"><?php echo esc_html( $rez['email'] ); ?></a></span>
						<?php if ( $rez['telefon'] ) : ?>
					<span class="mp-maly"><a href="tel:<?php echo esc_attr( preg_replace( '/[^\d+]/', '', $rez['telefon'] ) ); ?>"><?php echo esc_html( $rez['telefon'] ); ?></a></span>
						<?php endif; ?>
					<?php endif; ?>
				</td>
				<td data-etykieta="Spotkanie">
					<?php echo esc_html( Ustawienia::wizyta( $rez['wizyta'] )['nazwa'] ?? $rez['wizyta'] ); ?>
					<span class="mp-znaczek"><?php echo esc_html( $mp_formy[ $rez['forma'] ]['etykieta'] ?? $rez['forma'] ); ?></span>
					<?php if ( 'odwolana' === $rez['status'] ) : ?>
					<span class="mp-znaczek mp-znaczek--odwolana"><?php echo 'klient' === $rez['odwolal'] ? 'Odwołał klient' : 'Odwołane przez Ciebie'; ?></span>
					<?php endif; ?>
					<?php if ( '' !== $rez['google_blad'] ) : ?>
					<span class="mp-znaczek mp-znaczek--blad" title="<?php echo esc_attr( $rez['google_blad'] ); ?>"><?php echo 'odwolana' === $rez['status'] ? 'Zostało w Google' : 'Brak w Google'; ?></span>
					<?php endif; ?>
				</td>
				<td data-etykieta="Odpowiedzi">
					<?php if ( $rez['odpowiedzi'] ) : ?>
					<details class="mp-odpowiedzi">
						<summary><?php echo esc_html( count( $rez['odpowiedzi'] ) . ' ' . Czas::odmiana( count( $rez['odpowiedzi'] ), 'odpowiedź', 'odpowiedzi', 'odpowiedzi' ) ); ?></summary>
						<dl>
							<?php foreach ( $rez['odpowiedzi'] as $mp_o ) : ?>
							<dt><?php echo esc_html( $mp_o['etykieta'] ); ?></dt>
							<dd><?php echo nl2br( esc_html( $mp_o['wartosc'] ) ); ?></dd>
							<?php endforeach; ?>
						</dl>
					</details>
					<?php else : ?>
					<span class="mp-maly">—</span>
					<?php endif; ?>
				</td>
				<td class="mp-kol-akcje">
					<?php if ( 'potwierdzona' === $rez['status'] && ! $mp_bylo ) : ?>
					<details class="mp-odwolaj">
						<summary class="button">Odwołaj</summary>
						<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
							<input type="hidden" name="action" value="mp_rez_akcja">
							<input type="hidden" name="akcja" value="odwolaj">
							<input type="hidden" name="id" value="<?php echo (int) $rez['id']; ?>">
							<?php wp_nonce_field( 'mp_rez_odwolaj' ); ?>
							<label for="mp-powod-<?php echo (int) $rez['id']; ?>">Wiadomość do klienta (opcjonalnie)</label>
							<textarea id="mp-powod-<?php echo (int) $rez['id']; ?>" name="powod" rows="3" placeholder="Np. powód i propozycja innego terminu"></textarea>
							<label class="mp-check"><input type="checkbox" name="powiadom" value="1" checked> Wyślij klientowi e-mail</label>
							<button class="button button-primary">Odwołaj spotkanie</button>
						</form>
					</details>
					<?php endif; ?>
					<form method="post" class="mp-usun" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" onsubmit="return window.confirm('<?php echo esc_js( 'potwierdzona' === $rez['status'] && ! $mp_bylo ? 'Usunąć to spotkanie na zawsze? Klient nie dostanie e-maila (żeby go powiadomić, użyj „Odwołaj”). Spotkanie zniknie też z Kalendarza Google.' : 'Usunąć to spotkanie z listy na zawsze?' ); ?>');">
						<input type="hidden" name="action" value="mp_rez_akcja">
						<input type="hidden" name="akcja" value="usun">
						<input type="hidden" name="id" value="<?php echo (int) $rez['id']; ?>">
						<?php wp_nonce_field( 'mp_rez_usun' ); ?>
						<button class="button-link button-link-delete">Usuń</button>
					</form>
				</td>
			</tr>
		<?php endforeach; ?>
		</tbody>
	</table>

		<?php if ( $stron > 1 ) : ?>
	<div class="tablenav"><div class="tablenav-pages">
			<?php
			echo paginate_links( // phpcs:ignore WordPress.Security.EscapeOutput
				array(
					'base'    => add_query_arg( 'paged', '%#%' ),
					'format'  => '',
					'current' => $strona,
					'total'   => $stron,
				)
			);
			?>
	</div></div>
		<?php endif; ?>
	<?php endif; ?>
</div>
