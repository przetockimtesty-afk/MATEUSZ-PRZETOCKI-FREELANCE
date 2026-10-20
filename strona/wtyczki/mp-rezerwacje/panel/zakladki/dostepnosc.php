<?php
/**
 * Zakładka „Dostępność”: godziny pracy, święta, wyjątki i zasady terminów.
 *
 * @var array $u Ustawienia.
 */

use MP\Rezerwacje\Czas;

defined( 'ABSPATH' ) || exit;

$mp_dzis   = Czas::dzis()->format( 'Y-m-d' );
$mp_swieta = array();
foreach ( Czas::swieta( (int) gmdate( 'Y' ) ) + Czas::swieta( (int) gmdate( 'Y' ) + 1 ) as $mp_data => $mp_nazwa ) {
	if ( $mp_data >= $mp_dzis && count( $mp_swieta ) < 5 ) {
		$mp_swieta[] = Czas::dzien( $mp_data )->format( 'j' ) . ' ' . Czas::MIESIACE_D[ (int) substr( $mp_data, 5, 2 ) ] . ' (' . $mp_nazwa . ')';
	}
}
$mp_bledy = Czas::wyjatki( (string) $u['wyjatki'] )['bledy'];
$mp_liczba = function ( string $klucz, int $min, int $max, string $jednostka, string $opis = '', int $krok = 1 ) use ( $u ) {
	?>
	<input type="number" id="mp-zasady-<?php echo esc_attr( $klucz ); ?>" class="small-text" name="u[zasady][<?php echo esc_attr( $klucz ); ?>]" value="<?php echo esc_attr( (string) $u['zasady'][ $klucz ] ); ?>" min="<?php echo (int) $min; ?>" max="<?php echo (int) $max; ?>" step="<?php echo (int) $krok; ?>"> <?php echo esc_html( $jednostka ); ?>
	<?php if ( $opis ) : ?>
	<p class="description"><?php echo esc_html( $opis ); ?></p>
	<?php endif; ?>
	<?php
};
?>
<h2>Godziny pracy</h2>
<p class="description">Np. <code>9:00-17:00</code> albo z przerwą <code>9:00-12:00, 13:00-17:00</code>. Puste pole = w ten dzień nie przyjmujesz.</p>
<table class="form-table mp-godziny" role="presentation">
	<?php for ( $mp_d = 1; $mp_d <= 7; $mp_d++ ) : ?>
	<tr>
		<th scope="row"><label for="mp-godziny-<?php echo (int) $mp_d; ?>"><?php echo esc_html( Czas::wielka( Czas::DNI[ $mp_d ] ) ); ?></label></th>
		<td><input type="text" id="mp-godziny-<?php echo (int) $mp_d; ?>" class="regular-text" name="u[godziny][<?php echo (int) $mp_d; ?>]" value="<?php echo esc_attr( (string) ( $u['godziny'][ $mp_d ] ?? '' ) ); ?>" placeholder="nie przyjmuję"></td>
	</tr>
	<?php endfor; ?>
</table>

<h2>Wolne dni</h2>
<table class="form-table" role="presentation">
	<tr>
		<th scope="row">Święta</th>
		<td>
			<input type="hidden" name="u[swieta]" value="0">
			<label class="mp-check"><input type="checkbox" name="u[swieta]" value="1" <?php checked( $u['swieta'] ); ?>> Nie przyjmuję w dni ustawowo wolne od pracy</label>
			<p class="description">Najbliższe: <?php echo esc_html( implode( ', ', $mp_swieta ) ); ?>.</p>
		</td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-wyjatki">Urlop i wyjątki</label></th>
		<td>
			<textarea id="mp-wyjatki" class="large-text code" name="u[wyjatki]" rows="6" placeholder="2026-12-31&#10;2027-07-01 - 2027-07-14&#10;2026-11-14 10:00-14:00"><?php echo esc_textarea( (string) $u['wyjatki'] ); ?></textarea>
			<p class="description">Po jednym w linii: dzień wolny (<code>2026-12-31</code>), urlop (<code>2027-07-01 - 2027-07-14</code>) albo inne godziny w dany dzień, np. sobota (<code>2026-11-14 10:00-14:00</code>). Daty można też wpisać jako 31.12.2026. Tekst po # to komentarz.</p>
			<?php if ( $mp_bledy ) : ?>
			<p class="mp-blad">Nie rozumiem i pomijam: <?php echo esc_html( implode( '; ', $mp_bledy ) ); ?></p>
			<?php endif; ?>
		</td>
	</tr>
</table>

<h2>Zasady</h2>
<table class="form-table" role="presentation">
	<tr>
		<th scope="row"><label for="mp-zasady-krok">Terminy co</label></th>
		<td><?php $mp_liczba( 'krok', 5, 240, 'minut', 'Np. 30: terminy o 10:00, 10:30, 11:00.', 5 ); ?></td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-zasady-przerwa">Przerwa między spotkaniami</label></th>
		<td><?php $mp_liczba( 'przerwa', 0, 240, 'minut', 'Wolny czas przed i po każdym spotkaniu, także przed wydarzeniami z Kalendarza Google.', 5 ); ?></td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-zasady-wyprzedzenie">Najwcześniej</label></th>
		<td><?php $mp_liczba( 'wyprzedzenie', 0, 720, 'godzin przed spotkaniem', 'Żeby nikt nie umówił się na za kwadrans.' ); ?></td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-zasady-okno">Najdalej</label></th>
		<td><?php $mp_liczba( 'okno', 1, 365, 'dni do przodu' ); ?></td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-zasady-limit">Limit spotkań</label></th>
		<td><?php $mp_liczba( 'limit', 0, 50, 'dziennie', '0 = bez limitu.' ); ?></td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-zasady-zmiany">Zmiana i odwołanie przez klienta</label></th>
		<td><?php $mp_liczba( 'zmiany', 0, 168, 'godzin przed spotkaniem', 'Do tej chwili klient sam zmieni termin albo odwoła spotkanie linkiem z e-maila. Później musi napisać.' ); ?></td>
	</tr>
</table>
