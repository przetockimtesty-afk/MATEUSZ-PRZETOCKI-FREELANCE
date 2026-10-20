<?php
/**
 * Zakładka „Powiadomienia”: adresy, nadawca, teksty e-maili, przypomnienie.
 *
 * @var array $u Ustawienia.
 */

use MP\Rezerwacje\Ustawienia;

defined( 'ABSPATH' ) || exit;
?>
<h2>E-maile</h2>
<table class="form-table" role="presentation">
	<tr>
		<th scope="row"><label for="mp-do">Powiadomienia o rezerwacjach</label></th>
		<td>
			<input type="text" id="mp-do" class="regular-text" name="u[maile][do]" value="<?php echo esc_attr( $u['maile']['do'] ); ?>" placeholder="<?php echo esc_attr( get_option( 'admin_email' ) ); ?>">
			<p class="description">Kilka adresów oddziel przecinkiem. Puste = adres administratora strony.</p>
		</td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-nadawca">Nadawca</label></th>
		<td>
			<input type="text" id="mp-nadawca" class="regular-text" name="u[maile][nadawca]" value="<?php echo esc_attr( $u['maile']['nadawca'] ); ?>" placeholder="<?php echo esc_attr( Ustawienia::nazwa_wlasciciela() ); ?>">
			<p class="description">Nazwa widoczna w skrzynce klienta. Odpowiedź klienta trafi na pierwszy adres powiadomień.</p>
		</td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-potwierdzenie">Potwierdzenie</label></th>
		<td>
			<textarea id="mp-potwierdzenie" class="large-text" name="u[maile][potwierdzenie]" rows="3"><?php echo esc_textarea( $u['maile']['potwierdzenie'] ); ?></textarea>
			<p class="description">Tekst pod „Dzień dobry, Jan!”. Pod nim są szczegóły spotkania, przycisk do Kalendarza Google, plik .ics i link do zmiany terminu. Możesz użyć <code>{imie}</code>, <code>{wizyta}</code>, <code>{kiedy}</code>, <code>{termin}</code>.</p>
		</td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-przypomnienie">Przypomnienie</label></th>
		<td>
			<input type="number" id="mp-przypomnienie" class="small-text" name="u[maile][przypomnienie]" value="<?php echo esc_attr( (string) $u['maile']['przypomnienie'] ); ?>" min="0" max="168"> godzin przed spotkaniem
			<p class="description">0 = bez przypomnień. Kto umówi się już w tym czasie, dostaje tylko potwierdzenie.</p>
		</td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-przypomnienie-tekst">Treść przypomnienia</label></th>
		<td><textarea id="mp-przypomnienie-tekst" class="large-text" name="u[maile][przypomnienie_tekst]" rows="3"><?php echo esc_textarea( $u['maile']['przypomnienie_tekst'] ); ?></textarea></td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-podpis-maila">Podpis</label></th>
		<td>
			<textarea id="mp-podpis-maila" class="large-text" name="u[maile][podpis]" rows="3" placeholder="<?php echo esc_attr( Ustawienia::nazwa_wlasciciela() ); ?>"><?php echo esc_textarea( $u['maile']['podpis'] ); ?></textarea>
			<p class="description">Puste = imię z zakładki Spotkania.</p>
		</td>
	</tr>
</table>
