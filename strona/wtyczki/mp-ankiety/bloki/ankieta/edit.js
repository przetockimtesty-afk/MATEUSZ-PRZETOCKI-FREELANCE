/**
 * MP Ankiety: blok w edytorze. Pokazuje spis kroków i pytań; pytania zmienia się w definicji (JSON)
 * w panelu bocznym. Bez kroku budowania (globalne wp.*).
 */
( function ( wp ) {
	'use strict';

	const el = wp.element.createElement;
	const { useState } = wp.element;
	const { InspectorControls, useBlockProps } = wp.blockEditor;
	const { PanelBody, ToggleControl, TextareaControl, Notice, Button } = wp.components;

	function Ustawienia( { attributes: a, setAttributes } ) {
		const [ tekst, setTekst ] = useState( JSON.stringify( a.definicja || {}, null, 2 ) );
		const [ blad, setBlad ] = useState( '' );

		function zastosuj() {
			try {
				const d = JSON.parse( tekst );
				if ( ! d || typeof d !== 'object' || Array.isArray( d ) ) {
					throw new Error( 'Definicja musi być obiektem JSON.' );
				}
				setAttributes( { definicja: d } );
				setBlad( '' );
			} catch ( e ) {
				setBlad( 'Błąd w JSON: ' + e.message );
			}
		}

		return el(
			InspectorControls,
			null,
			el(
				PanelBody,
				{ title: 'Ankieta' },
				el( ToggleControl, {
					label: 'Ukryj tę stronę przed Google',
					help: 'Dla ankiet wysyłanych klientom linkiem (np. materiały, odbiór). Strona dostaje noindex i znika z mapy strony.',
					checked: !! a.ukryta,
					onChange: ( v ) => setAttributes( { ukryta: v } ),
				} )
			),
			el(
				PanelBody,
				{ title: 'Pytania (JSON)', initialOpen: false },
				el( TextareaControl, {
					label: 'Definicja ankiety',
					help: 'Kroki, pytania i warunki. Opis formatu: README wtyczki MP Ankiety.',
					value: tekst,
					rows: 16,
					onChange: setTekst,
				} ),
				blad ? el( Notice, { status: 'error', isDismissible: false }, blad ) : null,
				el( Button, { variant: 'secondary', onClick: zastosuj }, 'Zastosuj zmiany' )
			)
		);
	}

	function Podglad( { attributes: a } ) {
		const d = a.definicja || {};
		const kroki = Array.isArray( d.kroki ) ? d.kroki : [];
		if ( ! d.id || ! kroki.length ) {
			return el( 'div', { className: 'mp-ank__karta' }, el( 'p', null, 'Ankieta: wklej definicję (JSON) w panelu bocznym „Pytania”.' ) );
		}
		const pytan = kroki.reduce( ( suma, k ) => suma + ( Array.isArray( k.pytania ) ? k.pytania.filter( ( p ) => p.typ !== 'info' ).length : 0 ), 0 );
		return el(
			'div',
			{ className: 'mp-ank__karta' },
			el( 'p', { className: 'mp-ank__naglowek' }, d.nazwa || d.id ),
			el( 'p', { className: 'mp-ank__opis' }, kroki.length + ' kroków, ' + pytan + ' pytań (część pokazuje się tylko przy wybranych odpowiedziach)' + ( a.ukryta ? ' · ukryta przed Google' : '' ) ),
			el(
				'ol',
				{ className: 'mp-ank__spis' },
				kroki.map( ( k, i ) => el( 'li', { key: i }, k.tytul || 'Krok ' + ( i + 1 ), k.gdy ? el( 'small', null, ' (warunkowy)' ) : null ) )
			),
			el( 'span', { className: 'mp-ank__przycisk' }, 'Dalej' )
		);
	}

	wp.blocks.registerBlockType( 'mp/ankieta', {
		edit( props ) {
			return el( wp.element.Fragment, null, el( Ustawienia, props ), el( 'div', useBlockProps( { className: 'mp-ank mp-ank--js' } ), el( Podglad, props ) ) );
		},
		save() {
			return null;
		},
	} );
} )( window.wp );
