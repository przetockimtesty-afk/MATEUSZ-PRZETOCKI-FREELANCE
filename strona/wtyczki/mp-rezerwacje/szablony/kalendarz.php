<?php
/**
 * Kalendarz rezerwacji. Pierwszy widok (nagłówek i szkielet) jest gotowy od razu,
 * resztę rysuje bloki/rezerwacja/view.js z danymi z REST API.
 *
 * @var string     $wrapper Atrybuty głównego elementu.
 * @var array      $dane    Konfiguracja dla skryptu.
 * @var array|null $osoba   Imię, podpis i zdjęcie nad kalendarzem.
 */

use MP\Rezerwacje\Czas;
use MP\Rezerwacje\Front;
use MP\Rezerwacje\Ustawienia;

defined( 'ABSPATH' ) || exit;

$mp_wizyta = $dane['wizyty'][0];
?>
<div <?php echo $wrapper; // phpcs:ignore WordPress.Security.EscapeOutput -- atrybuty z get_block_wrapper_attributes() albo esc_attr(). ?> data-mp-rez>
	<script type="application/json" class="mp-rez__dane"><?php echo wp_json_encode( $dane, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ); ?></script>
	<div class="mp-rez__karta">
		<?php if ( $osoba ) : ?>
		<div class="mp-rez__osoba">
			<span class="mp-rez__awatar"><?php echo $osoba['zdjecie'] ? $osoba['zdjecie'] : Front::ikona( 'osoba' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
			<span>
				<strong><?php echo esc_html( $osoba['imie'] ); ?></strong>
				<?php if ( $osoba['opis'] ) : ?>
				<small><?php echo esc_html( $osoba['opis'] ); ?></small>
				<?php endif; ?>
			</span>
		</div>
		<?php endif; ?>
		<div class="mp-rez__tresc">
			<h3 class="mp-rez__tytul"><?php echo esc_html( 'zmiana' === $dane['tryb'] ? 'Wybierz nowy termin' : $dane['teksty']['naglowek'] ); ?></h3>
			<p class="mp-rez__pomoc">
				<span><span class="mp-rez__ikona"><?php echo Front::ikona( 'zegar' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span><?php echo esc_html( $mp_wizyta['czas'] ); ?></span>
				<span><span class="mp-rez__ikona"><?php echo Front::ikona( $mp_wizyta['formy'][0]['ikona'] ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span><?php echo esc_html( Czas::wielka( $mp_wizyta['formy_tekst'] ) ); ?></span>
			</p>
			<div class="mp-rez__szkielet" aria-hidden="true">
				<i class="mp-rez__szkielet-miesiac"></i>
				<span class="mp-rez__dni"><i></i><i></i><i></i><i></i><i></i></span>
				<span class="mp-rez__godziny"><i></i><i></i><i></i><i></i><i></i><i></i></span>
				<i class="mp-rez__szkielet-przycisk"></i>
			</div>
			<noscript>
				<p class="mp-rez__info">Kalendarz potrzebuje włączonego JavaScriptu. Możesz też napisać: <?php echo esc_html( antispambot( Ustawienia::adresy_wlasciciela()[0] ) ); ?></p>
			</noscript>
		</div>
	</div>
	<p class="mp-rez__sr" aria-live="polite"></p>
</div>
