<?php
/**
 * Pod zakładką „Powiadomienia”: testowy e-mail (osobny formularz).
 */

defined( 'ABSPATH' ) || exit;
?>
<div class="mp-ramka">
	<h2>Sprawdź, jak wygląda e-mail</h2>
	<p>Wiadomości wysyła WordPress. Żeby nie trafiały do spamu, ustaw wysyłkę przez skrzynkę w domenie (np. wtyczka WP Mail SMTP z danymi skrzynki z hostingu).</p>
	<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
		<input type="hidden" name="action" value="mp_rez_akcja">
		<input type="hidden" name="akcja" value="test_maila">
		<?php wp_nonce_field( 'mp_rez_test_maila' ); ?>
		<button class="button">Wyślij mi testowe potwierdzenie</button>
		<span class="description">Na adres <?php echo esc_html( wp_get_current_user()->user_email ); ?>, z przykładowymi danymi i zapisanymi ustawieniami.</span>
	</form>
</div>
