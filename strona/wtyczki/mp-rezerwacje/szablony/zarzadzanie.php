<?php
/**
 * Strona „Twoja rezerwacja” z linku w e-mailu: szczegóły, zmiana terminu, odwołanie.
 *
 * @var array|null $rez       Rezerwacja albo null, gdy link jest zły.
 * @var string     $kalendarz Kalendarz w trybie zmiany terminu (pusty, gdy zmiana jest już niemożliwa).
 * @var string     $komunikat Błąd odwołania.
 */

use MP\Rezerwacje\Front;
use MP\Rezerwacje\Rezerwacje;

defined( 'ABSPATH' ) || exit;

$mp_podsumowanie = $rez ? Rezerwacje::podsumowanie( $rez ) : null;
$mp_odbyla       = $rez && strtotime( $rez['koniec'] . ' UTC' ) < time();
// phpcs:disable WordPress.Security.NonceVerification
$mp_odwolana_teraz = isset( $_GET['odwolana'] );
$mp_zmieniona      = isset( $_GET['zmieniona'] );
// phpcs:enable
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?php echo esc_html( 'Twoja rezerwacja · ' . wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ) ); ?></title>
<?php wp_head(); ?>
</head>
<body <?php body_class( 'mp-rez-strona' ); ?>>
<?php wp_body_open(); ?>
<div class="mp-rez-strona__srodek">
	<a class="mp-rez-strona__logo" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php bloginfo( 'name' ); ?></a>

	<div class="mp-rez mp-rez--strona" style="<?php echo esc_attr( Front::zmienne() ); ?>">
		<div class="mp-rez__karta">

		<?php if ( ! $rez ) : ?>
			<h1 class="mp-rez__tytul">Nie znaleziono rezerwacji</h1>
			<p class="mp-rez__pomoc">Link może być niepełny albo dane tej rezerwacji zostały już usunięte.</p>
			<a class="mp-rez__przycisk" href="<?php echo esc_url( home_url( '/' ) ); ?>">Przejdź na stronę</a>

		<?php elseif ( 'odwolana' === $rez['status'] ) : ?>
			<p class="mp-rez__nadtytul">Twoja rezerwacja</p>
			<h1 class="mp-rez__tytul">Spotkanie odwołane</h1>
			<p class="mp-rez__pomoc"><?php echo $mp_odwolana_teraz ? 'Gotowe. Potwierdzenie odwołania jest w Twojej skrzynce.' : 'To spotkanie zostało odwołane.'; ?></p>
			<dl class="mp-rez__szczegoly mp-rez__szczegoly--odwolane">
				<div><dt>Termin</dt><dd><s><?php echo esc_html( $mp_podsumowanie['termin'] ); ?></s></dd></div>
				<div><dt>Spotkanie</dt><dd><?php echo esc_html( $mp_podsumowanie['wizyta'] ); ?></dd></div>
			</dl>
			<a class="mp-rez__przycisk" href="<?php echo esc_url( $rez['zrodlo'] ?: home_url( '/' ) ); ?>">Umów nowy termin</a>

		<?php else : ?>
			<p class="mp-rez__nadtytul">Twoja rezerwacja</p>
			<h1 class="mp-rez__tytul"><?php echo esc_html( $mp_odbyla ? 'To spotkanie już się odbyło' : 'Do zobaczenia ' . $mp_podsumowanie['kiedy'] ); ?></h1>
			<?php if ( $mp_zmieniona ) : ?>
			<p class="mp-rez__info mp-rez__info--ok">Termin zmieniony. Nowe potwierdzenie jest w Twojej skrzynce.</p>
			<?php endif; ?>
			<dl class="mp-rez__szczegoly">
				<div><dt>Termin</dt><dd><?php echo esc_html( $mp_podsumowanie['termin'] ); ?></dd></div>
				<div><dt>Spotkanie</dt><dd><?php echo esc_html( $mp_podsumowanie['wizyta'] ); ?></dd></div>
				<div><dt>Forma</dt><dd>
					<?php echo esc_html( $mp_podsumowanie['forma'] ); ?>
					<?php if ( $mp_podsumowanie['link'] ) : ?>
					<br><a href="<?php echo esc_url( $mp_podsumowanie['link'] ); ?>" target="_blank" rel="noopener"><?php echo esc_html( preg_replace( '#^https?://#', '', $mp_podsumowanie['link'] ) ); ?></a>
					<?php endif; ?>
				</dd></div>
			</dl>

			<?php if ( ! $mp_odbyla ) : ?>
			<div class="mp-rez__akcje">
				<a class="mp-rez__przycisk mp-rez__przycisk--obrys" href="<?php echo esc_url( $mp_podsumowanie['google'] ); ?>" target="_blank" rel="noopener">Dodaj do Kalendarza Google</a>
				<a class="mp-rez__przycisk mp-rez__przycisk--obrys" href="<?php echo esc_url( $mp_podsumowanie['ics'] ); ?>">Pobierz plik .ics</a>
			</div>
			<?php endif; ?>

			<?php if ( $komunikat ) : ?>
			<p class="mp-rez__info mp-rez__info--blad" role="alert"><?php echo esc_html( $komunikat ); ?></p>
			<?php endif; ?>

			<?php if ( $kalendarz ) : ?>
			<div class="mp-rez__zmiany">
				<details class="mp-rez__rozwin">
					<summary>Zmień termin</summary>
					<?php echo $kalendarz; // phpcs:ignore WordPress.Security.EscapeOutput -- gotowy HTML z Front::html(). ?>
				</details>
				<details class="mp-rez__rozwin">
					<summary>Odwołaj spotkanie</summary>
					<form method="post" class="mp-rez__formularz">
						<div class="mp-rez__pole">
							<label for="mp-powod">Powód <span class="mp-rez__opcjonalne">(opcjonalnie)</span></label>
							<textarea id="mp-powod" name="powod" rows="3" maxlength="1000"></textarea>
						</div>
						<button type="submit" name="mp_odwolaj" value="1" class="mp-rez__przycisk">Tak, odwołuję spotkanie</button>
					</form>
				</details>
			</div>
			<?php elseif ( ! $mp_odbyla ) : ?>
			<p class="mp-rez__info"><?php echo esc_html( Rezerwacje::powod_blokady( $rez ) ); ?></p>
			<?php endif; ?>
		<?php endif; ?>

		</div>
	</div>
</div>
<?php wp_footer(); ?>
</body>
</html>
