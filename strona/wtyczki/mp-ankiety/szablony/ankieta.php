<?php
/**
 * Ankieta w krokach. Wszystkie pytania są w HTML od razu; bloki/ankieta/view.js pokazuje
 * jeden krok naraz, ukrywa pytania, których warunek „gdy” nie jest spełniony, i wysyła odpowiedzi.
 *
 * @var array  $d        Definicja (Definicja::normalizuj).
 * @var array  $dane     Konfiguracja dla skryptu.
 * @var string $wrapper  Atrybuty głównego elementu.
 * @var string $prefiks  Prefiks identyfikatorów (kilka ankiet na stronie).
 * @var string $polityka Adres polityki prywatności.
 */

use MP\Ankiety\Definicja;
use MP\Ankiety\Front;

defined( 'ABSPATH' ) || exit;

$mp_prywatnosc = esc_html( $d['prywatnosc'] );
if ( $polityka ) {
	$mp_prywatnosc = str_replace( '{polityka}', '<a href="' . esc_url( $polityka ) . '" target="_blank" rel="noopener">polityce prywatności</a>', $mp_prywatnosc );
} else {
	$mp_prywatnosc = str_replace( '{polityka}', 'polityce prywatności', $mp_prywatnosc );
}
?>
<div <?php echo $wrapper; // phpcs:ignore WordPress.Security.EscapeOutput -- atrybuty z get_block_wrapper_attributes(). ?> data-mp-ank>
	<script type="application/json" class="mp-ank__dane"><?php echo wp_json_encode( $dane, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ); ?></script>
	<form class="mp-ank__karta" novalidate>
		<?php if ( $d['naglowek'] || $d['wstep'] ) : ?>
		<div class="mp-ank__wstep">
			<?php if ( $d['naglowek'] ) : ?>
			<p class="mp-ank__naglowek"><?php echo esc_html( $d['naglowek'] ); ?></p>
			<?php endif; ?>
			<?php if ( $d['wstep'] ) : ?>
			<p class="mp-ank__opis"><?php echo esc_html( $d['wstep'] ); ?></p>
			<?php endif; ?>
		</div>
		<?php endif; ?>

		<div class="mp-ank__postep">
			<p><span class="mp-ank__postep-tekst">Krok 1</span><?php echo $d['czas'] ? '<span class="mp-ank__czas">' . Front::ikona( 'zegar' ) . esc_html( $d['czas'] ) . '</span>' : ''; // phpcs:ignore WordPress.Security.EscapeOutput ?></p>
			<span class="mp-ank__pasek" aria-hidden="true"><span></span></span>
		</div>

		<div class="mp-ank__przywrocone" hidden>
			<p>Wróciły odpowiedzi z Twojej poprzedniej wizyty na tym urządzeniu.</p>
			<button type="button" class="mp-ank__link mp-ank__od-nowa">Zacznij od nowa</button>
		</div>

		<?php foreach ( $d['kroki'] as $mp_i => $mp_krok ) : ?>
		<section class="mp-ank__krok" data-krok="<?php echo (int) $mp_i; ?>"<?php echo Front::warunek( $mp_krok['gdy'] ); // phpcs:ignore WordPress.Security.EscapeOutput ?> hidden>
			<h2 class="mp-ank__tytul" tabindex="-1"><?php echo esc_html( $mp_krok['tytul'] ); ?></h2>
			<?php if ( $mp_krok['opis'] ) : ?>
			<p class="mp-ank__opis"><?php echo esc_html( $mp_krok['opis'] ); ?></p>
			<?php endif; ?>

			<?php
			foreach ( $mp_krok['pytania'] as $mp_p ) :
				$mp_id      = $prefiks . '-p' . $mp_p['n'];
				$mp_nazwa   = 'p' . $mp_p['n'];
				$mp_grupa   = in_array( $mp_p['typ'], array( 'jeden', 'wiele', 'skala' ), true );
				$mp_tag     = $mp_grupa ? 'fieldset' : 'div';
				$mp_opisane = trim( ( $mp_p['pomoc'] ? $mp_id . '-pomoc ' : '' ) . $mp_id . '-blad' );
				$mp_atrybuty = sprintf(
					' class="mp-ank__pytanie mp-ank__pytanie--%1$s" data-n="%2$d" data-id="%3$s" data-typ="%1$s"%4$s%5$s%6$s',
					esc_attr( $mp_p['typ'] ),
					(int) $mp_p['n'],
					esc_attr( $mp_p['id'] ),
					$mp_p['wymagane'] ? ' data-wymagane' : '',
					$mp_p['z_adresu'] ? ' data-z-adresu="' . esc_attr( $mp_p['z_adresu'] ) . '"' : '',
					Front::warunek( $mp_p['gdy'] )
				) . ( 'liczba' === $mp_p['typ'] && null !== $mp_p['max'] ? ' data-max="' . esc_attr( (string) $mp_p['max'] ) . '"' : '' )
					. ( 'liczba' === $mp_p['typ'] && null !== $mp_p['min'] ? ' data-min="' . esc_attr( (string) $mp_p['min'] ) . '"' : '' )
					. ( $mp_p['gdy'] ? ' hidden' : '' );
				$mp_etykieta = esc_html( $mp_p['tytul'] ) . ( $mp_p['wymagane'] || in_array( $mp_p['typ'], array( 'info', 'zgoda' ), true ) ? '' : ' <span class="mp-ank__opcjonalne">(możesz pominąć)</span>' );
				?>
				<?php if ( 'info' === $mp_p['typ'] ) : ?>
			<div<?php echo $mp_atrybuty; // phpcs:ignore WordPress.Security.EscapeOutput ?>>
				<p class="mp-ank__info"><?php echo Front::ikona( 'info' ); // phpcs:ignore WordPress.Security.EscapeOutput ?><span><?php echo $mp_p['tytul'] ? '<strong>' . esc_html( $mp_p['tytul'] ) . '</strong> ' : ''; ?><?php echo esc_html( $mp_p['pomoc'] ); ?></span></p>
			</div>
				<?php continue; endif; ?>
			<<?php echo $mp_tag; // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo $mp_atrybuty; // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo $mp_grupa ? ' aria-describedby="' . esc_attr( $mp_opisane ) . '"' : ''; ?>>
				<?php if ( $mp_grupa ) : ?>
				<legend class="mp-ank__etykieta"><?php echo $mp_etykieta; // phpcs:ignore WordPress.Security.EscapeOutput ?></legend>
				<?php elseif ( 'zgoda' !== $mp_p['typ'] ) : ?>
				<label class="mp-ank__etykieta" for="<?php echo esc_attr( $mp_id ); ?>"><?php echo $mp_etykieta; // phpcs:ignore WordPress.Security.EscapeOutput ?></label>
				<?php endif; ?>
				<?php if ( $mp_p['pomoc'] && 'zgoda' !== $mp_p['typ'] ) : ?>
				<p class="mp-ank__pomoc" id="<?php echo esc_attr( $mp_id ); ?>-pomoc"><?php echo esc_html( $mp_p['pomoc'] ); ?></p>
				<?php endif; ?>

				<?php if ( 'jeden' === $mp_p['typ'] || 'wiele' === $mp_p['typ'] ) : ?>
					<?php $mp_rodzaj = 'jeden' === $mp_p['typ'] ? 'radio' : 'checkbox'; ?>
				<div class="mp-ank__opcje">
					<?php foreach ( $mp_p['opcje'] as $mp_o ) : ?>
					<label class="mp-ank__opcja"><input type="<?php echo esc_attr( $mp_rodzaj ); ?>" name="<?php echo esc_attr( $mp_nazwa ); ?>" value="<?php echo esc_attr( $mp_o['w'] ); ?>"<?php echo $mp_o['sam'] ? ' data-sam' : ''; ?>><span><?php echo esc_html( $mp_o['t'] ); ?></span></label>
					<?php endforeach; ?>
					<?php if ( $mp_p['inne'] ) : ?>
					<label class="mp-ank__opcja"><input type="<?php echo esc_attr( $mp_rodzaj ); ?>" name="<?php echo esc_attr( $mp_nazwa ); ?>" value="<?php echo esc_attr( Definicja::INNE ); ?>"><span><?php echo esc_html( $mp_p['inne'] ); ?></span></label>
					<?php endif; ?>
				</div>
					<?php if ( $mp_p['inne'] ) : ?>
				<input type="text" class="mp-ank__inne" name="<?php echo esc_attr( $mp_nazwa . Definicja::INNE ); ?>" aria-label="<?php echo esc_attr( $mp_p['inne'] . ': wpisz' ); ?>" placeholder="<?php echo esc_attr( $mp_p['podpowiedz'] ?: 'Wpisz, jaka' ); ?>" maxlength="190" hidden>
					<?php endif; ?>

				<?php elseif ( 'skala' === $mp_p['typ'] ) : ?>
				<div class="mp-ank__opcje mp-ank__opcje--skala">
					<?php for ( $mp_x = (int) $mp_p['min']; $mp_x <= (int) $mp_p['max']; $mp_x++ ) : ?>
					<label class="mp-ank__opcja"><input type="radio" name="<?php echo esc_attr( $mp_nazwa ); ?>" value="<?php echo (int) $mp_x; ?>"><span><?php echo (int) $mp_x; ?></span></label>
					<?php endfor; ?>
				</div>
				<p class="mp-ank__skala-opis" aria-hidden="true"><span>wcale</span><span>na pewno</span></p>

				<?php elseif ( 'akapit' === $mp_p['typ'] ) : ?>
				<textarea id="<?php echo esc_attr( $mp_id ); ?>" name="<?php echo esc_attr( $mp_nazwa ); ?>" rows="4" maxlength="5000" placeholder="<?php echo esc_attr( $mp_p['podpowiedz'] ); ?>" aria-describedby="<?php echo esc_attr( $mp_opisane ); ?>"></textarea>

				<?php elseif ( 'zgoda' === $mp_p['typ'] ) : ?>
				<div class="mp-ank__zgoda">
					<input type="checkbox" id="<?php echo esc_attr( $mp_id ); ?>" name="<?php echo esc_attr( $mp_nazwa ); ?>" value="tak" aria-describedby="<?php echo esc_attr( $mp_opisane ); ?>">
					<label for="<?php echo esc_attr( $mp_id ); ?>"><?php echo esc_html( $mp_p['tytul'] ); ?><?php echo $mp_p['pomoc'] ? ' <span class="mp-ank__opcjonalne">' . esc_html( $mp_p['pomoc'] ) . '</span>' : ''; ?></label>
				</div>

				<?php
				else :
					$mp_typy = array(
						'email'   => array( 'email', 'email', 'email' ),
						'telefon' => array( 'tel', 'tel', 'tel' ),
						'liczba'  => array( 'text', 'off', 'decimal' ),
						'tekst'   => array( 'text', 'on', 'text' ),
					);
					list( $mp_typ_pola, $mp_auto, $mp_klawiatura ) = $mp_typy[ $mp_p['typ'] ];
					?>
				<input type="<?php echo esc_attr( $mp_typ_pola ); ?>" id="<?php echo esc_attr( $mp_id ); ?>" name="<?php echo esc_attr( $mp_nazwa ); ?>" autocomplete="<?php echo esc_attr( $mp_auto ); ?>" inputmode="<?php echo esc_attr( $mp_klawiatura ); ?>" maxlength="<?php echo 'liczba' === $mp_p['typ'] ? 12 : 300; ?>" placeholder="<?php echo esc_attr( $mp_p['podpowiedz'] ); ?>" aria-describedby="<?php echo esc_attr( $mp_opisane ); ?>"<?php echo 'liczba' === $mp_p['typ'] ? ' class="mp-ank__liczba"' : ''; ?>>
				<?php endif; ?>
				<p class="mp-ank__blad" id="<?php echo esc_attr( $mp_id ); ?>-blad" hidden></p>
			</<?php echo $mp_tag; // phpcs:ignore WordPress.Security.EscapeOutput ?>>
			<?php endforeach; ?>
		</section>
		<?php endforeach; ?>

		<div class="mp-ank__pulapka" aria-hidden="true">
			<label>Zostaw to pole puste <input type="text" name="www" tabindex="-1" autocomplete="off"></label>
		</div>

		<p class="mp-ank__komunikat" role="alert" hidden></p>

		<div class="mp-ank__nawigacja">
			<button type="submit" class="mp-ank__przycisk mp-ank__dalej"><span>Dalej</span><?php echo Front::ikona( 'strzalka' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
			<button type="button" class="mp-ank__wstecz" hidden><?php echo Front::ikona( 'lewo' ); // phpcs:ignore WordPress.Security.EscapeOutput ?><span>Wstecz</span></button>
		</div>
		<?php if ( $d['prywatnosc'] ) : ?>
		<p class="mp-ank__prywatnosc" hidden><?php echo $mp_prywatnosc; // phpcs:ignore WordPress.Security.EscapeOutput -- escapowane wyżej. ?></p>
		<?php endif; ?>
	</form>

	<div class="mp-ank__sukces" hidden>
		<span class="mp-ank__ok"><?php echo Front::ikona( 'ok' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
		<p class="mp-ank__naglowek mp-ank__naglowek--srodek" tabindex="-1"><?php echo esc_html( $d['dziekuje']['naglowek'] ); ?></p>
		<?php if ( $d['dziekuje']['tekst'] ) : ?>
		<p class="mp-ank__opis mp-ank__opis--srodek mp-ank__sukces-tekst" data-wzor="<?php echo esc_attr( $d['dziekuje']['tekst'] ); ?>"><?php echo esc_html( str_replace( '{email}', 'podany adres', $d['dziekuje']['tekst'] ) ); ?></p>
		<?php endif; ?>
		<?php if ( $d['dziekuje']['przycisk'] && $d['dziekuje']['adres'] ) : ?>
		<a class="mp-ank__przycisk mp-ank__przycisk--obrys" href="<?php echo esc_url( $d['dziekuje']['adres'] ); ?>"><span><?php echo esc_html( $d['dziekuje']['przycisk'] ); ?></span><?php echo Front::ikona( 'strzalka' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
		<?php endif; ?>
	</div>

	<p class="mp-ank__bez-js">Ankieta potrzebuje włączonego JavaScriptu. Jeśli go masz, odśwież stronę.</p>
	<p class="mp-ank__sr" aria-live="polite"></p>
</div>
