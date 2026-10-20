<?php
/**
 * Zakładka „Google”: konto usługi, kalendarz, arkusz i test połączenia.
 *
 * @var array $u Ustawienia.
 */

use MP\Rezerwacje\Google;

defined( 'ABSPATH' ) || exit;

$mp_klucz    = Google::klucz();
$mp_w_config = defined( 'MP_REZERWACJE_GOOGLE_KLUCZ' );
?>
<h2>Kalendarz Google</h2>
<?php \MP\Rezerwacje\Panel::problem_google(); ?>
<div class="mp-status<?php echo Google::polaczony() ? ' mp-status--ok' : ''; ?>">
	<?php if ( Google::polaczony() ) : ?>
		<strong>Połączony z kalendarzem <?php echo esc_html( Google::kalendarz() ); ?>.</strong>
		Nowe spotkania trafiają do tego kalendarza, a zajęte w nim godziny znikają z kalendarza na stronie.
	<?php elseif ( $mp_klucz ) : ?>
		<strong>Jest klucz, brakuje adresu kalendarza.</strong> Wpisz go poniżej i zapisz.
	<?php else : ?>
		<strong>Niepołączony.</strong> Bez Google wtyczka też działa: rezerwacje są w WordPressie i w e-mailach (z plikiem .ics), a terminy blokują się tylko rezerwacjami ze strony.
	<?php endif; ?>
	<?php if ( $mp_klucz ) : ?>
	<p>Adres konta usługi do udostępnienia: <code class="mp-kopiuj"><?php echo esc_html( $mp_klucz['client_email'] ); ?></code> <button type="button" class="button-link" data-mp-kopiuj="<?php echo esc_attr( $mp_klucz['client_email'] ); ?>">Kopiuj</button></p>
	<?php endif; ?>
</div>

<ol class="mp-kroki">
	<li><strong>Raz, po stronie wykonawcy:</strong> w Google Cloud Console projekt z włączonym Google Calendar API (i Google Sheets API, jeśli ma być arkusz), w nim konto usługi i jego klucz JSON. Każdy klient dostaje osobne konto usługi.</li>
	<li><strong>Klient:</strong> Kalendarz Google → Ustawienia kalendarza → Udostępnij określonym osobom → adres konta usługi z uprawnieniem „Wprowadzanie zmian w wydarzeniach”. Hasło do konta Google nie jest potrzebne.</li>
	<li>Wklej klucz, wpisz adres kalendarza, zapisz i kliknij „Sprawdź połączenie”.</li>
</ol>

<table class="form-table" role="presentation">
	<tr>
		<th scope="row"><label for="mp-klucz">Klucz konta usługi</label></th>
		<td>
			<?php if ( $mp_w_config ) : ?>
			<p>Klucz jest w pliku wp-config.php (stała <code>MP_REZERWACJE_GOOGLE_KLUCZ</code>)<?php echo $mp_klucz ? '' : ', ale nie da się go odczytać'; ?>.</p>
			<?php else : ?>
				<?php if ( $mp_klucz ) : ?>
			<p>Zapisany klucz konta <code><?php echo esc_html( $mp_klucz['client_email'] ); ?></code>. Wklej nowy tylko wtedy, gdy chcesz go zamienić.</p>
				<?php endif; ?>
			<textarea id="mp-klucz" class="large-text code" name="google_klucz" rows="4" autocomplete="off" spellcheck="false" placeholder="{&quot;type&quot;: &quot;service_account&quot;, &quot;client_email&quot;: …}"></textarea>
			<p class="description">Cała zawartość pobranego pliku .json. Klucz nie trafia do eksportu ustawień.</p>
				<?php if ( $mp_klucz ) : ?>
			<label class="mp-check"><input type="checkbox" name="google_klucz_usun" value="1"> Usuń zapisany klucz (rozłącza Google)</label>
				<?php endif; ?>
			<?php endif; ?>
		</td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-kalendarz">Kalendarz</label></th>
		<td>
			<input type="text" id="mp-kalendarz" class="regular-text" name="u[google][kalendarz]" value="<?php echo esc_attr( $u['google']['kalendarz'] ); ?>" placeholder="np. anna.nowak@gmail.com">
			<p class="description">Adres Gmail klienta (kalendarz główny) albo identyfikator innego kalendarza z jego ustawień. Tu trafiają spotkania i stąd brana jest zajętość.</p>
		</td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-zajetosc">Inne kalendarze zajętości</label></th>
		<td>
			<textarea id="mp-zajetosc" class="large-text" name="u[google][zajetosc]" rows="2" placeholder="np. prywatny@gmail.com"><?php echo esc_textarea( implode( "\n", (array) $u['google']['zajetosc'] ) ); ?></textarea>
			<p class="description">Opcjonalnie, po jednym w linii: kalendarze, które też blokują terminy (do nich nic nie zapisujemy). Wystarczy udostępnić je z uprawnieniem „Wyświetlanie tylko informacji o wolnych/zajętych terminach”.</p>
		</td>
	</tr>
	<tr>
		<th scope="row">Opis wydarzenia</th>
		<td>
			<label class="mp-check"><input type="radio" name="u[google][opis]" value="pelny" <?php checked( $u['google']['opis'], 'pelny' ); ?>> Pełny: imię, e-mail, telefon i odpowiedzi klienta</label><br>
			<label class="mp-check"><input type="radio" name="u[google][opis]" value="minimalny" <?php checked( $u['google']['opis'], 'minimalny' ); ?>> Minimalny: tylko rodzaj spotkania (dane klienta zostają w WordPressie)</label>
		</td>
	</tr>
</table>

<h2>Arkusz Google (opcjonalnie)</h2>
<table class="form-table" role="presentation">
	<tr>
		<th scope="row"><label for="mp-arkusz">Arkusz</label></th>
		<td>
			<input type="text" id="mp-arkusz" class="large-text" name="u[google][arkusz]" value="<?php echo esc_attr( $u['google']['arkusz'] ); ?>" placeholder="Link do arkusza albo jego identyfikator">
			<p class="description">Arkusz udostępniony kontu usługi jako Edytor. Każda rezerwacja, zmiana terminu i odwołanie dopisuje wiersz.</p>
		</td>
	</tr>
	<tr>
		<th scope="row"><label for="mp-zakladka-arkusza">Nazwa zakładki</label></th>
		<td><input type="text" id="mp-zakladka-arkusza" class="regular-text" name="u[google][zakladka]" value="<?php echo esc_attr( $u['google']['zakladka'] ); ?>"></td>
	</tr>
</table>

<div class="mp-test">
	<button type="button" class="button button-secondary" data-mp-test-google<?php echo $mp_klucz ? '' : ' disabled'; ?>>Sprawdź połączenie</button>
	<p class="description">Sprawdza zapisane ustawienia: logowanie, odczyt zajętości, zapis wydarzenia (dodaje i od razu usuwa testowe) i arkusz.</p>
	<ul class="mp-wyniki" data-mp-wyniki aria-live="polite"></ul>
</div>
