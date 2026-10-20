<?php
/**
 * Usunięcie wtyczki. Rezerwacje i ustawienia znikają tylko wtedy, gdy zaznaczono to
 * w Rezerwacje → Ustawienia → Narzędzia; domyślnie zostają (ponowna instalacja je odzyska).
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

wp_clear_scheduled_hook( 'mp_rezerwacje_co_godzine' );
wp_clear_scheduled_hook( 'mp_rezerwacje_codziennie' );

$mp_ustawienia = get_option( 'mp_rezerwacje', array() );
if ( empty( $mp_ustawienia['rodo']['usun_przy_odinstalowaniu'] ) ) {
	return;
}

global $wpdb;
$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}mp_rezerwacje" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
foreach ( array( 'mp_rezerwacje', 'mp_rezerwacje_db', 'mp_rezerwacje_google_klucz', 'mp_rezerwacje_dziennik', 'mp_rezerwacje_google_pamiec', 'mp_rezerwacje_google_ok' ) as $mp_opcja ) {
	delete_option( $mp_opcja );
}
delete_metadata( 'user', 0, 'mp_rez_widziane', '', true );
