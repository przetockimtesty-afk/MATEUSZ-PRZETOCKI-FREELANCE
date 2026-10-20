<?php
/**
 * Zakładka „Spotkania”: kto przyjmuje, rodzaje spotkań, miejsce i link online.
 *
 * @var array $u Ustawienia.
 */

defined( 'ABSPATH' ) || exit;

$mp_zdjecie = (int) $u['osoba']['zdjecie'];
$mp_formy   = array(
	'online'     => 'Online',
	'na-miejscu' => 'Na miejscu',
	'telefon'    => 'Telefonicznie',
);
$mp_wiersz  = function ( string $i, array $w ) use ( $mp_formy ) {
	$n = 'u[wizyty][' . $i . ']';
	?>
	<div class="mp-wiersz">
		<input type="hidden" name="<?php echo esc_attr( $n ); ?>[id]" value="<?php echo esc_attr( $w['id'] ?? '' ); ?>">
		<div class="mp-pola">
			<label class="mp-pole mp-pole--szerokie">Nazwa
				<input type="text" name="<?php echo esc_attr( $n ); ?>[nazwa]" value="<?php echo esc_attr( $w['nazwa'] ?? '' ); ?>" placeholder="Np. Konsultacja kredytowa">
			</label>
			<label class="mp-pole">Czas (minuty)
				<input type="number" name="<?php echo esc_attr( $n ); ?>[czas]" value="<?php echo esc_attr( (string) ( $w['czas'] ?? 30 ) ); ?>" min="5" max="480" step="5">
			</label>
			<fieldset class="mp-pole mp-pole--cale">
				<legend>Forma spotkania</legend>
				<?php foreach ( $mp_formy as $f => $etykieta ) : ?>
				<label class="mp-check"><input type="checkbox" name="<?php echo esc_attr( $n ); ?>[formy][]" value="<?php echo esc_attr( $f ); ?>" <?php checked( in_array( $f, $w['formy'] ?? array( 'online' ), true ) ); ?>> <?php echo esc_html( $etykieta ); ?></label>
				<?php endforeach; ?>
			</fieldset>
			<label class="mp-pole mp-pole--cale">Krótki opis pod nagłówkiem (opcjonalnie)
				<input type="text" name="<?php echo esc_attr( $n ); ?>[opis]" value="<?php echo esc_attr( $w['opis'] ?? '' ); ?>" placeholder="Np. Pierwsza rozmowa jest bezpłatna.">
			</label>
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
<h2>Kto przyjmuje</h2>
<p class="description">Imię, podpis i zdjęcie nad kalendarzem. Puste imię = kalendarz bez tej części.</p>
<table class="form-table" role="presentation">
	<tr>
		<th scope="row"><label for="mp-imie">Imię i nazwisko</label></th>
		<td><input type="text" id="mp-imie" class="regular-text" name="u[osoba][imie]" value="<?php echo esc_attr( $u['osoba']['imie'] ); ?>" placeholder="Np. Anna Nowak"></td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-podpis">Podpis</label></th>
		<td><input type="text" id="mp-podpis" class="regular-text" name="u[osoba][opis]" value="<?php echo esc_attr( $u['osoba']['opis'] ); ?>" placeholder="Np. Ekspertka kredytowa, Kraków"></td>
	</tr>
	<tr>
		<th scope="row">Zdjęcie</th>
		<td>
			<div class="mp-zdjecie" data-mp-zdjecie>
				<span class="mp-zdjecie-podglad"><?php echo $mp_zdjecie ? wp_get_attachment_image( $mp_zdjecie, array( 64, 64 ) ) : ''; ?></span>
				<input type="hidden" name="u[osoba][zdjecie]" value="<?php echo esc_attr( (string) $mp_zdjecie ); ?>">
				<button type="button" class="button" data-mp-wybierz>Wybierz z biblioteki</button>
				<button type="button" class="button-link mp-usun" data-mp-bez-zdjecia<?php echo $mp_zdjecie ? '' : ' hidden'; ?>>Usuń zdjęcie</button>
			</div>
			<p class="description">Kwadratowe, najlepiej co najmniej 200 × 200 px.</p>
		</td>
	</tr>
</table>

<h2>Rodzaje spotkań</h2>
<p class="description">Gdy jest więcej niż jeden, klient wybiera rodzaj nad kalendarzem. Pierwszy jest domyślny.</p>
<input type="hidden" name="listy[]" value="wizyty">
<div class="mp-wiersze" id="mp-wizyty">
	<?php
	foreach ( array_values( $u['wizyty'] ) as $mp_i => $mp_w ) {
		$mp_wiersz( (string) $mp_i, $mp_w );
	}
	?>
</div>
<p><button type="button" class="button" data-mp-dodaj="mp-szablon-wizyta" data-mp-lista="#mp-wizyty">Dodaj rodzaj spotkania</button></p>
<template id="mp-szablon-wizyta"><?php $mp_wiersz( '__i__', array() ); ?></template>

<h2>Gdzie</h2>
<table class="form-table" role="presentation">
	<tr>
		<th scope="row"><label for="mp-etykieta">Spotkanie na miejscu</label></th>
		<td>
			<input type="text" id="mp-etykieta" class="regular-text" name="u[miejsce][etykieta]" value="<?php echo esc_attr( $u['miejsce']['etykieta'] ); ?>" placeholder="W biurze">
			<p class="description">Jak to nazwać przy wyborze: „W biurze”, „W gabinecie”, „U klienta”.</p>
		</td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-adres">Adres</label></th>
		<td><input type="text" id="mp-adres" class="large-text" name="u[miejsce][adres]" value="<?php echo esc_attr( $u['miejsce']['adres'] ); ?>" placeholder="Np. ul. Długa 1/3, Kraków"></td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-online">Link do spotkań online</label></th>
		<td>
			<input type="url" id="mp-online" class="large-text" name="u[miejsce][online]" value="<?php echo esc_attr( $u['miejsce']['online'] ); ?>" placeholder="https://meet.google.com/…">
			<p class="description">Stały link Google Meet, Zoom albo Teams. Trafia do potwierdzenia i do pliku .ics. Puste = link wysyłasz sam przed spotkaniem.</p>
		</td>
	</tr>
</table>
