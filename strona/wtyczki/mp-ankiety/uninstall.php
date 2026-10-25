<?php
/**
 * Usunięcie wtyczki. Odpowiedzi i ustawienia znikają tylko wtedy, gdy zaznaczono to
 * w Ankiety → Ustawienia; domyślnie zostają (ponowna instalacja je odzyska).
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

wp_clear_scheduled_hook( 'mp_ankiety_co_godzine' );
wp_clear_scheduled_hook( 'mp_ankiety_codziennie' );

$mp_ustawienia = get_option( 'mp_ankiety', array() );
if ( empty( $mp_ustawienia['usun_przy_odinstalowaniu'] ) ) {
	return;
}

global $wpdb;
$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}mp_ankiety" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
foreach ( array( 'mp_ankiety', 'mp_ankiety_db', 'mp_ankiety_dziennik' ) as $mp_opcja ) {
	delete_option( $mp_opcja );
}
delete_post_meta_by_key( '_mp_ankieta_ukryta' );
