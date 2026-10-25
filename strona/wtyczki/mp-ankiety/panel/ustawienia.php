<?php
/**
 * Panel: ustawienia ankiet.
 *
 * @var array $u     Ustawienia::wszystkie().
 * @var array $wpisy Dziennik problemów.
 */

use MP\Ankiety\Automat;
use MP\Ankiety\Panel;

defined( 'ABSPATH' ) || exit;
?>
<div class="wrap mp-panel">
	<h1>Ustawienia ankiet</h1>
	<?php Panel::pokaz_komunikat(); ?>
	<p class="mp-gdzie">Pytania każdej ankiety są w jej bloku „Ankieta” na stronie (panel boczny edytora). Tutaj są tylko powiadomienia, automat i przechowywanie danych.</p>

	<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
		<input type="hidden" name="action" value="mp_ank_zapisz">
		<?php wp_nonce_field( 'mp_ank_zapisz' ); ?>

		<h2>Powiadomienia</h2>
		<table class="form-table" role="presentation">
			<tr>
				<th scope="row"><label for="mp-powiadomienia">Wysyłaj odpowiedzi na</label></th>
				<td>
					<input type="text" id="mp-powiadomienia" class="regular-text" name="u[powiadomienia]" value="<?php echo esc_attr( $u['powiadomienia'] ); ?>" placeholder="adres@domena.pl">
					<p class="description">Kilka adresów oddziel przecinkami. Puste = adres administratora WordPressa.</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="mp-nadawca">Nadawca e-maili</label></th>
				<td>
					<input type="text" id="mp-nadawca" class="regular-text" name="u[nadawca]" value="<?php echo esc_attr( $u['nadawca'] ); ?>" placeholder="<?php echo esc_attr( wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ) ); ?>">
					<p class="description">Nazwa widoczna przy potwierdzeniu dla osoby, która wypełniła ankietę. Adres nadawcy ustawia wtyczka SMTP.</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="mp-podpis">Podpis w potwierdzeniu</label></th>
				<td><textarea id="mp-podpis" class="large-text" rows="2" name="u[podpis]"><?php echo esc_textarea( $u['podpis'] ); ?></textarea></td>
			</tr>
		</table>

		<h2>Automat (opcjonalnie)</h2>
		<p>Kopia każdej odpowiedzi z ankiet, które mają w definicji <code>"automat": true</code>, idzie na ten adres, np. do aplikacji internetowej Google Apps Script. Wiadomość jest podpisana sekretem; automat musi znać ten sam sekret.</p>
		<table class="form-table" role="presentation">
			<tr>
				<th scope="row"><label for="mp-automat">Adres automatu</label></th>
				<td><input type="url" id="mp-automat" class="large-text" name="u[automat][adres]" value="<?php echo esc_attr( $u['automat']['adres'] ); ?>" placeholder="https://script.google.com/macros/s/…/exec"></td>
			</tr>
			<tr>
				<th scope="row"><label for="mp-sekret">Sekret</label></th>
				<td>
					<input type="password" id="mp-sekret" class="regular-text" name="u[automat][sekret]" value="" autocomplete="new-password" placeholder="<?php echo $u['automat']['sekret'] ? esc_attr( 'zapisany, zostaw puste, żeby nie zmieniać' ) : ''; ?>">
					<?php if ( $u['automat']['sekret'] ) : ?>
					<label class="mp-check"><input type="checkbox" name="u[automat][usun_sekret]" value="1"> usuń zapisany sekret</label>
					<?php endif; ?>
					<p class="description">Długi losowy ciąg znaków, ten sam co we właściwościach skryptu. Nie wysyłaj go e-mailem ani na czacie.</p>
				</td>
			</tr>
		</table>

		<h2>Dane osobowe</h2>
		<table class="form-table" role="presentation">
			<tr>
				<th scope="row"><label for="mp-dni">Usuwaj odpowiedzi po</label></th>
				<td><input type="number" id="mp-dni" class="small-text" min="0" max="3650" name="u[przechowywanie]" value="<?php echo (int) $u['przechowywanie']; ?>"> dniach <p class="description">0 = nie usuwaj automatycznie.</p></td>
			</tr>
			<tr>
				<th scope="row"><label for="mp-polityka">Polityka prywatności</label></th>
				<td>
					<input type="url" id="mp-polityka" class="large-text" name="u[polityka]" value="<?php echo esc_attr( $u['polityka'] ); ?>" placeholder="<?php echo esc_attr( get_privacy_policy_url() ); ?>">
					<p class="description">Link pod ankietą. Puste = strona polityki prywatności ustawiona w WordPressie.</p>
				</td>
			</tr>
			<tr>
				<th scope="row">Przy usunięciu wtyczki</th>
				<td><label class="mp-check"><input type="checkbox" name="u[usun_przy_odinstalowaniu]" value="1"<?php checked( $u['usun_przy_odinstalowaniu'] ); ?>> usuń też wszystkie odpowiedzi i ustawienia</label></td>
			</tr>
		</table>

		<?php submit_button( 'Zapisz ustawienia' ); ?>
	</form>

	<?php if ( Automat::wlaczony() ) : ?>
	<p><a class="button" href="<?php echo esc_url( Panel::link_akcji( 'test' ) ); ?>">Sprawdź połączenie z automatem</a></p>
	<?php endif; ?>

	<h2>Dziennik problemów</h2>
	<?php if ( ! $wpisy ) : ?>
	<p>Brak problemów.</p>
	<?php else : ?>
	<table class="widefat striped mp-dziennik">
		<tbody>
			<?php foreach ( $wpisy as $mp_wpis ) : ?>
			<tr><td class="mp-kol-data"><?php echo esc_html( wp_date( 'd.m.Y H:i', (int) $mp_wpis['czas'] ) ); ?></td><td><?php echo esc_html( $mp_wpis['tekst'] ); ?></td></tr>
			<?php endforeach; ?>
		</tbody>
	</table>
	<p><a class="button" href="<?php echo esc_url( Panel::link_akcji( 'dziennik' ) ); ?>">Wyczyść dziennik</a></p>
	<?php endif; ?>
</div>
