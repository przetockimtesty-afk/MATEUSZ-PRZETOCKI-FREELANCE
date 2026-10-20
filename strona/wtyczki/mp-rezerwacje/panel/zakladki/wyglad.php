<?php
/**
 * Zakładka „Wygląd”: kolory i zaokrąglenie z podglądem na żywo.
 *
 * @var array $u Ustawienia.
 */

use MP\Rezerwacje\Czas;
use MP\Rezerwacje\Front;
use MP\Rezerwacje\Ustawienia;

defined( 'ABSPATH' ) || exit;

$mp_pn     = Czas::dzis()->modify( 'monday next week' );
$mp_wizyta = Ustawienia::wizyta();
$mp_osoba  = Front::osoba();
$mp_liczba = Front::liczba_pytan( count( Ustawienia::pytania() ) );
$mp_kolory = array(
	'glowny' => array( 'Kolor główny', 'Przyciski i wybrany dzień.', '--mp-glowny' ),
	'akcent' => array( 'Akcent', 'Wybrana godzina i znaczek potwierdzenia.', '--mp-akcent' ),
	'tlo'    => array( 'Tło karty', 'Zwykle białe.', '--mp-tlo' ),
);
?>
<h2>Kolory i kształt</h2>
<p class="description">Puste pola = kolory z palety motywu strony (Wygląd → Edytor → Style). Ustaw je tylko wtedy, gdy kalendarz ma wyglądać inaczej niż reszta strony.</p>
<div class="mp-wyglad">
	<table class="form-table" role="presentation">
		<?php foreach ( $mp_kolory as $mp_klucz => list( $mp_nazwa, $mp_opis, $mp_zmienna ) ) : ?>
		<tr>
			<th scope="row"><label for="mp-kolor-<?php echo esc_attr( $mp_klucz ); ?>"><?php echo esc_html( $mp_nazwa ); ?></label></th>
			<td>
				<input type="text" id="mp-kolor-<?php echo esc_attr( $mp_klucz ); ?>" class="mp-kolor" name="u[wyglad][<?php echo esc_attr( $mp_klucz ); ?>]" value="<?php echo esc_attr( $u['wyglad'][ $mp_klucz ] ); ?>" data-mp-zmienna="<?php echo esc_attr( $mp_zmienna ); ?>">
				<p class="description"><?php echo esc_html( $mp_opis ); ?></p>
			</td>
		</tr>
		<?php endforeach; ?>
		<tr>
			<th scope="row"><label for="mp-promien">Zaokrąglenie rogów</label></th>
			<td>
				<input type="number" id="mp-promien" class="small-text" name="u[wyglad][promien]" value="<?php echo esc_attr( (string) $u['wyglad']['promien'] ); ?>" min="0" max="40" placeholder="24" data-mp-zmienna="--mp-promien"> px
				<p class="description">Puste = 24 px, jak karty na stronie.</p>
			</td>
		</tr>
	</table>

	<div class="mp-podglad-ramka">
		<p class="mp-podglad-tytul">Podgląd</p>
		<div class="mp-rez mp-podglad" style="<?php echo esc_attr( Front::zmienne() ); ?>" aria-hidden="true">
			<div class="mp-rez__karta">
				<?php if ( $mp_osoba ) : ?>
				<div class="mp-rez__osoba">
					<span class="mp-rez__awatar"><?php echo $mp_osoba['zdjecie'] ? $mp_osoba['zdjecie'] : Front::ikona( 'osoba' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
					<span><strong><?php echo esc_html( $mp_osoba['imie'] ); ?></strong><small><?php echo esc_html( $mp_osoba['opis'] ); ?></small></span>
				</div>
				<?php endif; ?>
				<h3 class="mp-rez__tytul"><?php echo esc_html( Ustawienia::get( 'teksty.naglowek' ) ); ?></h3>
				<p class="mp-rez__pomoc"><span><span class="mp-rez__ikona"><?php echo Front::ikona( 'zegar' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span><?php echo esc_html( Ustawienia::opis_wizyty( $mp_wizyta ) ); ?></span></p>
				<div class="mp-rez__miesiac">
					<span><?php echo esc_html( Czas::miesiace( $mp_pn, $mp_pn->modify( '+4 days' ) ) ); ?></span>
					<span class="mp-rez__nawigacja"><span class="mp-rez__strzalka"><?php echo Front::ikona( 'lewo' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span><span class="mp-rez__strzalka"><?php echo Front::ikona( 'prawo' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span></span>
				</div>
				<div class="mp-rez__dni">
					<?php for ( $mp_i = 0; $mp_i < 5; $mp_i++ ) : ?>
						<?php $mp_d = $mp_pn->modify( "+{$mp_i} days" ); ?>
					<span class="mp-rez__dzien" aria-pressed="<?php echo 3 === $mp_i ? 'true' : 'false'; ?>"><?php echo esc_html( Czas::DNI_SKROT[ (int) $mp_d->format( 'N' ) ] ); ?><b><?php echo esc_html( $mp_d->format( 'j' ) ); ?></b></span>
					<?php endfor; ?>
				</div>
				<div class="mp-rez__godziny">
					<span class="mp-rez__godz" aria-pressed="false">17:00</span>
					<span class="mp-rez__godz" aria-pressed="false">17:30</span>
					<span class="mp-rez__godz" aria-pressed="true">18:00</span>
					<span class="mp-rez__godz mp-rez__godz--zajeta">18:30</span>
					<span class="mp-rez__godz" aria-pressed="false">19:00</span>
					<span class="mp-rez__godz" aria-pressed="false">19:30</span>
				</div>
				<span class="mp-rez__przycisk"><?php echo esc_html( $mp_liczba ? 'Dalej: ' . $mp_liczba : 'Dalej' ); ?><span class="mp-rez__ikona"><?php echo Front::ikona( 'strzalka' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span></span>
			</div>
		</div>
	</div>
</div>
