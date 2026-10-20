<?php
/**
 * Zakładka „Narzędzia”: branże, eksport i import ustawień, RODO, dziennik problemów, informacje.
 * Każda część to osobny formularz.
 *
 * @var array $u Ustawienia.
 */

use MP\Rezerwacje\Dziennik;
use MP\Rezerwacje\Ustawienia;

defined( 'ABSPATH' ) || exit;

$mp_branze     = Ustawienia::branze();
$mp_wpisy      = Dziennik::wpisy();
$mp_przypomn   = wp_next_scheduled( 'mp_rezerwacje_co_godzine' );
$mp_akcja_url  = esc_url( admin_url( 'admin-post.php' ) );
?>
<h2>Gotowe ustawienia dla branży</h2>
<form method="post" action="<?php echo $mp_akcja_url; // phpcs:ignore WordPress.Security.EscapeOutput ?>" class="mp-narzedzie">
	<input type="hidden" name="action" value="mp_rez_akcja">
	<input type="hidden" name="akcja" value="branza">
	<?php wp_nonce_field( 'mp_rez_branza' ); ?>
	<label for="mp-branza" class="screen-reader-text">Branża</label>
	<select id="mp-branza" name="branza">
		<?php foreach ( $mp_branze as $mp_slug => $mp_b ) : ?>
		<option value="<?php echo esc_attr( $mp_slug ); ?>" <?php selected( $u['branza'], $mp_slug ); ?>><?php echo esc_html( $mp_b['nazwa'] ); ?></option>
		<?php endforeach; ?>
	</select>
	<button class="button" onclick="return confirm('Zastąpić rodzaje spotkań, godziny, pytania i teksty ustawieniami tej branży?');">Wczytaj</button>
	<ul class="mp-branze">
		<?php foreach ( $mp_branze as $mp_b ) : ?>
		<li><strong><?php echo esc_html( $mp_b['nazwa'] ); ?>:</strong> <?php echo esc_html( $mp_b['opis'] ?? '' ); ?></li>
		<?php endforeach; ?>
	</ul>
	<p class="description">Zastępuje rodzaje spotkań, godziny, zasady, pytania i teksty. Osoba, miejsce, Google i wygląd zostają. Własną branżę dodasz plikiem JSON w katalogu <code>branze/</code> wtyczki.</p>
</form>

<h2>Przeniesienie ustawień</h2>
<p>Ustawienia jako plik: pobierz tutaj i wczytaj na innej stronie z tą wtyczką. Klucza Google nie ma w pliku.</p>
<p><a class="button" href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=mp_rez_akcja&akcja=eksport' ), 'mp_rez_eksport' ) ); ?>">Pobierz plik ustawień</a></p>
<form method="post" action="<?php echo $mp_akcja_url; // phpcs:ignore WordPress.Security.EscapeOutput ?>" enctype="multipart/form-data" class="mp-narzedzie">
	<input type="hidden" name="action" value="mp_rez_akcja">
	<input type="hidden" name="akcja" value="import">
	<?php wp_nonce_field( 'mp_rez_import' ); ?>
	<label for="mp-plik">Wczytaj plik ustawień:</label>
	<input type="file" id="mp-plik" name="plik" accept=".json,application/json" required>
	<button class="button" onclick="return confirm('Zastąpić obecne ustawienia ustawieniami z pliku?');">Wczytaj</button>
</form>

<h2>Dane osobowe (RODO)</h2>
<form method="post" action="<?php echo $mp_akcja_url; // phpcs:ignore WordPress.Security.EscapeOutput ?>">
	<input type="hidden" name="action" value="mp_rez_zapisz">
	<input type="hidden" name="zakladka" value="narzedzia">
	<?php wp_nonce_field( 'mp_rez_zapisz' ); ?>
	<table class="form-table" role="presentation">
		<tr>
			<th scope="row"><label for="mp-przechowywanie">Usuwaj dane klientów</label></th>
			<td>
				<input type="number" id="mp-przechowywanie" class="small-text" name="u[rodo][przechowywanie]" value="<?php echo esc_attr( (string) $u['rodo']['przechowywanie'] ); ?>" min="0" max="3650"> dni po spotkaniu
				<p class="description">Zostaje termin i rodzaj spotkania, bez imienia, e-maila, telefonu i odpowiedzi. 0 = nie usuwaj automatycznie.</p>
			</td>
		</tr>
		<tr>
			<th scope="row">Usunięcie wtyczki</th>
			<td>
				<input type="hidden" name="u[rodo][usun_przy_odinstalowaniu]" value="0">
				<label class="mp-check"><input type="checkbox" name="u[rodo][usun_przy_odinstalowaniu]" value="1" <?php checked( $u['rodo']['usun_przy_odinstalowaniu'] ); ?>> Przy usuwaniu wtyczki usuń też wszystkie rezerwacje i ustawienia</label>
			</td>
		</tr>
	</table>
	<p class="description">Prośby klientów o kopię albo usunięcie danych obsłużysz w Narzędzia → Eksport danych osobowych / Usuwanie danych osobowych. Propozycja tekstu do polityki prywatności jest w Ustawienia → Prywatność → Przewodnik po polityce.</p>
	<?php submit_button( 'Zapisz' ); ?>
</form>

<h2>Dziennik problemów</h2>
<?php if ( $mp_wpisy ) : ?>
<table class="widefat striped mp-dziennik">
	<tbody>
	<?php foreach ( $mp_wpisy as $mp_wpis ) : ?>
		<tr><td class="mp-kol-czas"><?php echo esc_html( wp_date( 'j.m.Y H:i', $mp_wpis['czas'] ) ); ?></td><td><?php echo esc_html( $mp_wpis['tekst'] ); ?></td></tr>
	<?php endforeach; ?>
	</tbody>
</table>
<form method="post" action="<?php echo $mp_akcja_url; // phpcs:ignore WordPress.Security.EscapeOutput ?>">
	<input type="hidden" name="action" value="mp_rez_akcja">
	<input type="hidden" name="akcja" value="dziennik">
	<?php wp_nonce_field( 'mp_rez_dziennik' ); ?>
	<p><button class="button">Wyczyść dziennik</button></p>
</form>
<?php else : ?>
<p>Brak problemów z Google i e-mailami.</p>
<?php endif; ?>

<h2>Informacje</h2>
<table class="form-table" role="presentation">
	<tr><th scope="row">Wersja wtyczki</th><td><?php echo esc_html( \MP\Rezerwacje\WERSJA ); ?></td></tr>
	<tr><th scope="row">Strefa czasowa</th><td><?php echo esc_html( wp_timezone_string() ); ?> (<a href="<?php echo esc_url( admin_url( 'options-general.php' ) ); ?>">Ustawienia → Ogólne</a>)</td></tr>
	<tr>
		<th scope="row">Przypomnienia</th>
		<td>
			<?php echo $mp_przypomn ? esc_html( 'Następne sprawdzenie: ' . wp_date( 'j.m.Y H:i', $mp_przypomn ) ) : 'Zadanie nie jest zaplanowane (włącz wtyczkę ponownie).'; ?>
			<p class="description">WordPress uruchamia zadania przy odwiedzinach strony. Przy małym ruchu dodaj w panelu hostingu zadanie cron co 15 minut: <code><?php echo esc_html( 'wget -q -O - ' . site_url( 'wp-cron.php?doing_wp_cron' ) . ' >/dev/null 2>&1' ); ?></code></p>
		</td>
	</tr>
</table>
