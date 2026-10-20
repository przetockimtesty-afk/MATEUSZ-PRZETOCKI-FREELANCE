/**
 * MP Rezerwacje: blok w edytorze. Pokazuje podgląd w stylu strony z przykładowym tygodniem;
 * prawdziwe terminy rysuje view.js na stronie. Bez kroku budowania (globalne wp.*).
 */
( function ( wp ) {
	'use strict';

	const el = wp.element.createElement;
	const { InspectorControls, useBlockProps } = wp.blockEditor;
	const { PanelBody, SelectControl, TextControl, ToggleControl, ExternalLink } = wp.components;
	const dane = window.mpRezerwacjeEdytor || { wizyty: [], naglowek: 'Umów konsultację', dalej: 'Dalej', zapowiedz: '', osoba: null, ustawienia: '', ikony: {} };

	function ikona( nazwa ) {
		return el( 'span', {
			className: 'mp-rez__ikona',
			dangerouslySetInnerHTML: {
				__html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + ( dane.ikony[ nazwa ] || '' ) + '</svg>',
			},
		} );
	}

	function Ustawienia( { attributes: a, setAttributes } ) {
		return el(
			InspectorControls,
			null,
			el(
				PanelBody,
				{ title: 'Kalendarz' },
				dane.wizyty.length > 1
					? el( SelectControl, {
						label: 'Rodzaj spotkania',
						value: a.wizyta,
						options: [ { label: 'Wszystkie (klient wybiera)', value: '' } ].concat( dane.wizyty.map( ( w ) => ( { label: w.nazwa, value: w.id } ) ) ),
						onChange: ( v ) => setAttributes( { wizyta: v } ),
					} )
					: null,
				el( TextControl, {
					label: 'Nagłówek',
					value: a.naglowek,
					placeholder: dane.naglowek,
					help: 'Puste = nagłówek z ustawień.',
					onChange: ( v ) => setAttributes( { naglowek: v } ),
				} ),
				el( ToggleControl, {
					label: 'Imię i zdjęcie nad kalendarzem',
					checked: a.osoba,
					onChange: ( v ) => setAttributes( { osoba: v } ),
				} ),
				dane.ustawienia ? el( 'p', null, el( ExternalLink, { href: dane.ustawienia }, 'Godziny, pytania i wygląd' ) ) : null
			)
		);
	}

	function Podglad( { attributes: a } ) {
		const wizyta = dane.wizyty.find( ( w ) => w.id === a.wizyta ) || dane.wizyty[ 0 ] || { opis: '' };
		const osoba = a.osoba ? dane.osoba : null;
		const dni = [ [ 'pn', 26 ], [ 'wt', 27 ], [ 'śr', 28 ], [ 'czw', 29 ], [ 'pt', 30 ] ];
		const godziny = [ '17:00', '18:00', '19:30', '20:00', '20:30', '21:00' ];

		return el(
			'div',
			{ className: 'mp-rez__karta' },
			osoba
				? el(
					'div',
					{ className: 'mp-rez__osoba' },
					el( 'span', { className: 'mp-rez__awatar' }, osoba.adres ? el( 'img', { src: osoba.adres, alt: '' } ) : ikona( 'osoba' ) ),
					el( 'span', null, el( 'strong', null, osoba.imie ), osoba.opis ? el( 'small', null, osoba.opis ) : null )
				)
				: null,
			el( 'h3', { className: 'mp-rez__tytul' }, a.naglowek || dane.naglowek ),
			el( 'p', { className: 'mp-rez__pomoc' }, el( 'span', null, ikona( 'zegar' ), wizyta.opis ) ),
			el(
				'div',
				{ className: 'mp-rez__miesiac' },
				el( 'span', null, 'Podgląd: prawdziwe terminy pojawią się na stronie' ),
				el( 'span', { className: 'mp-rez__nawigacja' }, el( 'span', { className: 'mp-rez__strzalka' }, ikona( 'lewo' ) ), el( 'span', { className: 'mp-rez__strzalka' }, ikona( 'prawo' ) ) )
			),
			el(
				'div',
				{ className: 'mp-rez__dni' },
				dni.map( ( d, i ) => el( 'span', { key: d[ 0 ], className: 'mp-rez__dzien', 'aria-pressed': String( i === 3 ) }, d[ 0 ], el( 'b', null, d[ 1 ] ) ) )
			),
			el(
				'div',
				{ className: 'mp-rez__godziny' },
				godziny.map( ( g, i ) => el( 'span', { key: g, className: 'mp-rez__godz', 'aria-pressed': String( i === 2 ) }, g ) )
			),
			el( 'span', { className: 'mp-rez__przycisk' }, dane.dalej, ikona( 'strzalka' ) ),
			dane.zapowiedz ? el( 'p', { className: 'mp-rez__zapowiedz' }, ikona( 'lista' ), dane.zapowiedz ) : null
		);
	}

	wp.blocks.registerBlockType( 'mp/rezerwacja', {
		edit( props ) {
			return el( wp.element.Fragment, null, el( Ustawienia, props ), el( 'div', useBlockProps( { className: 'mp-rez' } ), el( Podglad, props ) ) );
		},
		save() {
			return null;
		},
	} );
} )( window.wp );
