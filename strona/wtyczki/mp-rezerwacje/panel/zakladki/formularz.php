<?php
/**
 * Zakładka „Formularz”: teksty kalendarza, telefon, zgoda i pytania przed spotkaniem.
 *
 * @var array $u Ustawienia.
 */

use MP\Rezerwacje\Ustawienia;

defined( 'ABSPATH' ) || exit;

$mp_wiersz = function ( string $i, array $p ) {
	$n    = 'u[pytania][' . $i . ']';
	$typ  = $p['typ'] ?? 'tekst';
	$opcj = in_array( $typ, array( 'wybor', 'lista' ), true );
	?>
	<div class="mp-wiersz">
		<input type="hidden" name="<?php echo esc_attr( $n ); ?>[id]" value="<?php echo esc_attr( $p['id'] ?? '' ); ?>">
		<div class="mp-pola">
			<label class="mp-pole mp-pole--szerokie">Pytanie
				<input type="text" name="<?php echo esc_attr( $n ); ?>[etykieta]" value="<?php echo esc_attr( $p['etykieta'] ?? '' ); ?>" placeholder="Np. Ile masz wkładu własnego?">
			</label>
			<label class="mp-pole">Odpowiedź
				<select name="<?php echo esc_attr( $n ); ?>[typ]" data-mp-typ>
					<?php foreach ( Ustawienia::TYPY as $wartosc => $etykieta ) : ?>
					<option value="<?php echo esc_attr( $wartosc ); ?>" <?php selected( $typ, $wartosc ); ?>><?php echo esc_html( $etykieta ); ?></option>
					<?php endforeach; ?>
				</select>
			</label>
			<label class="mp-pole mp-pole--cale" data-mp-opcje<?php echo $opcj ? '' : ' hidden'; ?>>Opcje do wyboru, po jednej w linii
				<textarea name="<?php echo esc_attr( $n ); ?>[opcje]" rows="<?php echo (int) max( 3, count( $p['opcje'] ?? array() ) + 1 ); ?>"><?php echo esc_textarea( implode( "\n", $p['opcje'] ?? array() ) ); ?></textarea>
			</label>
			<label class="mp-pole mp-pole--szerokie">Podpowiedź (opcjonalnie)
				<input type="text" name="<?php echo esc_attr( $n ); ?>[podpowiedz]" value="<?php echo esc_attr( $p['podpowiedz'] ?? '' ); ?>" placeholder="Np. Wystarczy w przybliżeniu">
			</label>
			<div class="mp-pole">
				<input type="hidden" name="<?php echo esc_attr( $n ); ?>[wymagane]" value="0">
				<label class="mp-check"><input type="checkbox" name="<?php echo esc_attr( $n ); ?>[wymagane]" value="1" <?php checked( ! empty( $p['wymagane'] ) ); ?>> Wymagane</label>
			</div>
		</div>
		<div class="mp-wiersz-akcje">
			<button type="button" class="button-link" data-mp-gora aria-label="Przesuń wyżej">↑</button>
			<button type="button" class="button-link" data-mp-dol aria-label="Przesuń niżej">↓</button>
			<button type="button" class="button-link mp-usun" data-mp-usun>Usuń</button>
		</div>
	</div>
	<?php
};
?>
<h2>Teksty kalendarza</h2>
<table class="form-table" role="presentation">
	<tr>
		<th scope="row"><label for="mp-naglowek">Nagłówek</label></th>
		<td><input type="text" id="mp-naglowek" class="regular-text" name="u[teksty][naglowek]" value="<?php echo esc_attr( $u['teksty']['naglowek'] ); ?>"></td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-zapowiedz">Zapowiedź pytań</label></th>
		<td>
			<input type="text" id="mp-zapowiedz" class="large-text" name="u[teksty][zapowiedz]" value="<?php echo esc_attr( $u['teksty']['zapowiedz'] ); ?>" placeholder="Np. Kwota, wkład własny, forma zatrudnienia">
			<p class="description">Pod przyciskiem „Dalej”, żeby klient wiedział, o co zapytasz.</p>
		</td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-przycisk">Przycisk rezerwacji</label></th>
		<td><input type="text" id="mp-przycisk" class="regular-text" name="u[teksty][przycisk]" value="<?php echo esc_attr( $u['teksty']['przycisk'] ); ?>"></td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-sukces">Tekst po rezerwacji</label></th>
		<td><input type="text" id="mp-sukces" class="large-text" name="u[teksty][sukces]" value="<?php echo esc_attr( $u['teksty']['sukces'] ); ?>"></td>
	</tr>
</table>

<h2>Dane klienta</h2>
<table class="form-table" role="presentation">
	<tr>
		<th scope="row"><label for="mp-telefon">Telefon</label></th>
		<td>
			<select id="mp-telefon" name="u[telefon]">
				<option value="wymagany" <?php selected( $u['telefon'], 'wymagany' ); ?>>Wymagany</option>
				<option value="opcjonalny" <?php selected( $u['telefon'], 'opcjonalny' ); ?>>Opcjonalny</option>
				<option value="ukryty" <?php selected( $u['telefon'], 'ukryty' ); ?>>Nie pytaj</option>
			</select>
			<p class="description">Przy spotkaniu telefonicznym numer jest zawsze wymagany. Imię i e-mail są wymagane zawsze.</p>
		</td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-zgoda">Zgoda</label></th>
		<td>
			<textarea id="mp-zgoda" class="large-text" name="u[teksty][zgoda]" rows="3"><?php echo esc_textarea( $u['teksty']['zgoda'] ); ?></textarea>
			<p class="description"><code>{polityka}</code> zamienia się w link „polityce prywatności”.</p>
		</td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-polityka">Polityka prywatności</label></th>
		<td>
			<input type="url" id="mp-polityka" class="large-text" name="u[teksty][polityka]" value="<?php echo esc_attr( $u['teksty']['polityka'] ); ?>" placeholder="<?php echo esc_attr( get_privacy_policy_url() ?: 'https://…' ); ?>">
			<p class="description">Puste = strona ustawiona w Ustawienia → Prywatność.</p>
		</td>
	</tr>
</table>

<h2>Pytania przed spotkaniem</h2>
<p class="description">Najlepiej 2–4 krótkie pytania z gotowymi odpowiedziami do kliknięcia. Nie pytaj o zdrowie ani inne dane szczególne (RODO, art. 9).</p>
<input type="hidden" name="listy[]" value="pytania">
<div class="mp-wiersze" id="mp-pytania">
	<?php
	foreach ( array_values( $u['pytania'] ) as $mp_i => $mp_p ) {
		$mp_wiersz( (string) $mp_i, $mp_p );
	}
	?>
</div>
<p><button type="button" class="button" data-mp-dodaj="mp-szablon-pytanie" data-mp-lista="#mp-pytania">Dodaj pytanie</button></p>
<template id="mp-szablon-pytanie"><?php $mp_wiersz( '__i__', array( 'wymagane' => true ) ); ?></template>
