<?php
/**
 * Szablon e-maila (tabele i style w linii, bo tak czytają je programy pocztowe).
 *
 * @var array $m temat, zajawka, naglowek, wstep, sekcje [[krok, [[pytanie, odpowiedź]]]], przyciski [[napis, adres, glowny]], po (html), podpis, stopka
 */

defined( 'ABSPATH' ) || exit;

$font  = 'Inter,-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif';
$tekst = '#161514';
$szary = '#5c574f';
$linia = '#d9d0c3';
$krem  = '#f5f2ec';
?>
<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title><?php echo esc_html( $m['temat'] ); ?></title>
</head>
<body style="margin:0;padding:0;background:<?php echo esc_attr( $krem ); ?>;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;"><?php echo esc_html( $m['zajawka'] ); ?></div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:<?php echo esc_attr( $krem ); ?>;">
<tr><td align="center" style="padding:32px 16px;">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid <?php echo esc_attr( $linia ); ?>;border-radius:24px;">
	<tr><td style="padding:32px 32px 28px;font-family:<?php echo esc_attr( $font ); ?>;font-size:16px;line-height:1.55;color:<?php echo esc_attr( $tekst ); ?>;">

		<h1 style="margin:0 0 16px;font-family:<?php echo esc_attr( $font ); ?>;font-size:24px;line-height:1.25;font-weight:600;letter-spacing:-0.01em;color:<?php echo esc_attr( $tekst ); ?>;"><?php echo esc_html( $m['naglowek'] ); ?></h1>

		<?php foreach ( preg_split( '/\n{2,}/', trim( $m['wstep'] ) ) as $akapit ) : ?>
			<?php if ( '' !== trim( $akapit ) ) : ?>
			<p style="margin:0 0 14px;"><?php echo nl2br( esc_html( $akapit ) ); ?></p>
			<?php endif; ?>
		<?php endforeach; ?>

		<?php foreach ( $m['sekcje'] as list( $krok, $wiersze ) ) : ?>
			<?php if ( '' !== $krok ) : ?>
			<p style="margin:24px 0 4px;font-size:12px;line-height:1.3;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:<?php echo esc_attr( $szary ); ?>;"><?php echo esc_html( $krok ); ?></p>
			<?php endif; ?>
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid <?php echo esc_attr( $linia ); ?>;">
				<?php foreach ( $wiersze as list( $pytanie, $odpowiedz ) ) : ?>
				<tr>
					<td style="padding:10px 12px 10px 0;border-bottom:1px solid <?php echo esc_attr( $linia ); ?>;font-family:<?php echo esc_attr( $font ); ?>;font-size:14px;line-height:1.45;color:<?php echo esc_attr( $szary ); ?>;vertical-align:top;width:42%;"><?php echo esc_html( $pytanie ); ?></td>
					<td style="padding:10px 0;border-bottom:1px solid <?php echo esc_attr( $linia ); ?>;font-family:<?php echo esc_attr( $font ); ?>;font-size:15px;line-height:1.45;color:<?php echo esc_attr( $tekst ); ?>;vertical-align:top;"><?php echo nl2br( esc_html( $odpowiedz ) ); ?></td>
				</tr>
				<?php endforeach; ?>
			</table>
		<?php endforeach; ?>

		<?php if ( $m['przyciski'] ) : ?>
		<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px;">
			<tr>
			<?php foreach ( $m['przyciski'] as list( $napis, $adres, $glowny ) ) : ?>
				<td style="padding:0 10px 10px 0;">
					<a href="<?php echo esc_url( $adres ); ?>" style="display:inline-block;padding:14px 24px;border-radius:999px;border:1.5px solid <?php echo esc_attr( $tekst ); ?>;background:<?php echo esc_attr( $glowny ? $tekst : '#ffffff' ); ?>;color:<?php echo esc_attr( $glowny ? $krem : $tekst ); ?>;font-family:<?php echo esc_attr( $font ); ?>;font-size:15px;font-weight:600;line-height:1;text-decoration:none;"><?php echo esc_html( $napis ); ?></a>
				</td>
			<?php endforeach; ?>
			</tr>
		</table>
		<?php endif; ?>

		<?php if ( $m['po'] ) : ?>
		<p style="margin:14px 0 0;font-size:14px;line-height:1.55;color:<?php echo esc_attr( $szary ); ?>;overflow-wrap:anywhere;"><?php echo wp_kses( str_replace( '<a ', '<a style="color:' . $tekst . ';text-decoration:underline;" ', $m['po'] ), array( 'a' => array( 'href' => array(), 'style' => array() ) ) ); ?></p>
		<?php endif; ?>

		<?php if ( $m['podpis'] ) : ?>
		<p style="margin:24px 0 0;font-size:15px;line-height:1.55;"><?php echo nl2br( esc_html( $m['podpis'] ) ); ?></p>
		<?php endif; ?>

	</td></tr>
	</table>
	<p style="max-width:600px;margin:16px auto 0;font-family:<?php echo esc_attr( $font ); ?>;font-size:12px;line-height:1.5;color:<?php echo esc_attr( $szary ); ?>;"><?php echo esc_html( $m['stopka'] ); ?></p>
</td></tr>
</table>
</body>
</html>
