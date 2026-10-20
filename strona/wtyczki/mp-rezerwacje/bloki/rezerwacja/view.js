/**
 * MP Rezerwacje: kalendarz na stronie. Bez bibliotek.
 * Kroki: termin → dane i pytania → „Do zobaczenia…”. W trybie „zmiana” (link z e-maila) tylko wybór nowego terminu.
 */
( function () {
	'use strict';

	function uruchom( korzen ) {
		if ( korzen.dataset.mpGotowy ) {
			return;
		}
		korzen.dataset.mpGotowy = '1';

		const dane = JSON.parse( korzen.querySelector( '.mp-rez__dane' ).textContent );
		const tresc = korzen.querySelector( '.mp-rez__tresc' );
		const ogloszenie = korzen.querySelector( '.mp-rez__sr' );
		const zmiana = dane.tryb === 'zmiana';
		const stan = {
			krok: 'termin',
			wizyta: dane.wizyty[ 0 ].id,
			tydzien: null,
			dzien: null,
			slot: null,
			laduje: false,
			blad: '',
			komunikat: '',
			wartosci: {},
			bledy: {},
			bladFormularza: '',
			wysyla: false,
			wynik: null,
			zapytanie: 0,
		};

		/* ---------- Pomocnicze ---------- */

		function svg( nazwa ) {
			return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + ( dane.ikony[ nazwa ] || '' ) + '</svg>';
		}

		function ikona( nazwa ) {
			const span = document.createElement( 'span' );
			span.className = 'mp-rez__ikona';
			span.innerHTML = svg( nazwa );
			return span;
		}

		/** Element DOM: h( 'button', { class: 'x', onclick: fn }, 'tekst', dziecko ). */
		function h( tag, atrybuty, ...dzieci ) {
			const el = document.createElement( tag );
			Object.entries( atrybuty || {} ).forEach( function ( [ klucz, wartosc ] ) {
				if ( wartosc === null || wartosc === undefined || wartosc === false ) {
					return;
				}
				if ( klucz === 'class' ) {
					el.className = wartosc;
				} else if ( klucz === 'html' ) {
					el.innerHTML = wartosc;
				} else if ( klucz.startsWith( 'on' ) ) {
					el.addEventListener( klucz.slice( 2 ), wartosc );
				} else if ( wartosc === true ) {
					el.setAttribute( klucz, '' );
				} else {
					el.setAttribute( klucz, wartosc );
				}
			} );
			dzieci.flat().forEach( function ( d ) {
				if ( d !== null && d !== undefined && d !== false ) {
					el.append( d instanceof Node ? d : String( d ) );
				}
			} );
			return el;
		}

		function wielka( tekst ) {
			return tekst ? tekst.charAt( 0 ).toUpperCase() + tekst.slice( 1 ) : '';
		}

		function wizyta() {
			return dane.wizyty.find( ( w ) => w.id === stan.wizyta ) || dane.wizyty[ 0 ];
		}

		function dzien() {
			return stan.tydzien ? stan.tydzien.dni.find( ( d ) => d.data === stan.dzien ) : null;
		}

		function oglos( tekst ) {
			ogloszenie.textContent = '';
			window.setTimeout( function () {
				ogloszenie.textContent = tekst;
			}, 60 );
		}

		/** Zapytanie do REST API. Odpowiedź, która nie jest JSON-em (np. strona antybota), to błąd, nie dane. */
		async function zapytaj( adres, opcje ) {
			let odp;
			try {
				odp = await fetch( adres, Object.assign( { credentials: 'same-origin', headers: { Accept: 'application/json' } }, opcje || {} ) );
			} catch ( e ) {
				throw { message: 'Brak połączenia. Sprawdź internet i spróbuj ponownie.' };
			}
			const typ = odp.headers.get( 'content-type' ) || '';
			if ( typ.indexOf( 'json' ) === -1 ) {
				throw { message: 'Serwer odpowiedział nietypowo. Odśwież stronę i spróbuj ponownie.' };
			}
			let json;
			try {
				json = await odp.json();
			} catch ( e ) {
				throw { message: 'Serwer odpowiedział nietypowo. Odśwież stronę i spróbuj ponownie.' };
			}
			if ( ! odp.ok ) {
				throw Object.assign( { status: odp.status }, json );
			}
			return json;
		}

		/* ---------- Dane ---------- */

		async function ladujTydzien( od ) {
			const nr = ++stan.zapytanie;
			stan.laduje = true;
			stan.blad = '';
			rysuj();
			const adres = new URL( dane.api.terminy, window.location.href );
			adres.searchParams.set( 'wizyta', stan.wizyta );
			if ( od ) {
				adres.searchParams.set( 'od', od );
			}
			if ( dane.token ) {
				adres.searchParams.set( 'token', dane.token );
			}
			try {
				const tydzien = await zapytaj( adres.toString() );
				if ( nr !== stan.zapytanie ) {
					return;
				}
				stan.tydzien = tydzien;
				const ten = tydzien.dni.find( ( d ) => d.data === stan.dzien && d.wolne > 0 );
				const pierwszy = tydzien.dni.find( ( d ) => d.wolne > 0 );
				stan.dzien = ten ? ten.data : ( pierwszy ? pierwszy.data : null );
				if ( stan.slot ) {
					const d = dzien();
					const slot = d ? d.godziny.find( ( g ) => g.start === stan.slot.start ) : null;
					stan.slot = slot && slot.wolny ? slot : null;
				}
			} catch ( e ) {
				if ( nr !== stan.zapytanie ) {
					return;
				}
				stan.blad = e.message || 'Nie udało się pobrać terminów.';
			}
			stan.laduje = false;
			rysuj();
		}

		/* ---------- Rysowanie ---------- */

		/** Przerysowuje krok, zachowując fokus na tym samym przycisku (data-klucz). */
		function rysuj( fokus ) {
			const poprzedni = document.activeElement && korzen.contains( document.activeElement ) ? document.activeElement : null;
			const aktywny = poprzedni ? poprzedni.getAttribute( 'data-klucz' ) : null;
			const widoczny = poprzedni ? poprzedni.matches( ':focus-visible' ) : false;
			const elementy = stan.krok === 'dane' ? krokDane() : ( stan.krok === 'gotowe' ? krokGotowe() : krokTermin() );
			tresc.replaceChildren( ...elementy );
			korzen.classList.toggle( 'mp-rez--laduje', stan.laduje );
			const cel = fokus ? tresc.querySelector( fokus ) : ( aktywny ? tresc.querySelector( '[data-klucz="' + aktywny + '"]' ) : null );
			if ( cel ) {
				cel.focus( { preventScroll: ! fokus, focusVisible: fokus ? undefined : widoczny } );
			}
		}

		/** Zmiana kroku: fokus na nagłówku, komunikat dla czytnika ekranu, karta w widoku. */
		function idz( krok ) {
			stan.krok = krok;
			rysuj( '.mp-rez__tytul' );
			const tytul = tresc.querySelector( '.mp-rez__tytul' );
			if ( tytul ) {
				oglos( tytul.textContent );
			}
			const gora = korzen.getBoundingClientRect().top;
			if ( gora < 0 ) {
				korzen.scrollIntoView( { block: 'start', behavior: window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ? 'auto' : 'smooth' } );
			}
		}

		function naglowek( tekst ) {
			return h( 'h3', { class: 'mp-rez__tytul', tabindex: '-1' }, tekst );
		}

		function pomoc( w ) {
			return h(
				'p',
				{ class: 'mp-rez__pomoc' },
				h( 'span', null, ikona( 'zegar' ), w.czas ),
				h( 'span', null, ikona( w.formy[ 0 ].ikona ), wielka( w.formy_tekst ) )
			);
		}

		function krokTermin() {
			const w = wizyta();
			const el = [ naglowek( zmiana ? 'Wybierz nowy termin' : dane.teksty.naglowek ), pomoc( w ) ];

			if ( dane.wizyty.length > 1 ) {
				el.push(
					h(
						'div',
						{ class: 'mp-rez__wizyty', role: 'group', 'aria-label': 'Rodzaj spotkania' },
						dane.wizyty.map( ( x ) =>
							h(
								'button',
								{
									type: 'button',
									class: 'mp-rez__wybor',
									'data-klucz': 'wizyta-' + x.id,
									'aria-pressed': String( x.id === stan.wizyta ),
									onclick: function () {
										if ( x.id !== stan.wizyta ) {
											stan.wizyta = x.id;
											stan.slot = null;
											ladujTydzien( stan.tydzien ? stan.tydzien.od : '' );
										}
									},
								},
								x.nazwa,
								h( 'small', null, x.czas )
							)
						)
					)
				);
			}
			if ( w.info ) {
				el.push( h( 'p', { class: 'mp-rez__opis' }, w.info ) );
			}
			if ( stan.komunikat ) {
				el.push( h( 'p', { class: 'mp-rez__info mp-rez__info--blad', role: 'alert' }, stan.komunikat ) );
			}
			if ( ! stan.tydzien ) {
				el.push( stan.blad ? bladLadowania() : szkielet() );
				return el;
			}

			const t = stan.tydzien;
			el.push(
				h(
					'div',
					{ class: 'mp-rez__miesiac' },
					h( 'span', null, t.miesiac ),
					h(
						'span',
						{ class: 'mp-rez__nawigacja' },
						strzalka( 'lewo', 'Poprzedni tydzień', t.poprzedni ),
						strzalka( 'prawo', 'Następny tydzień', t.nastepny )
					)
				)
			);
			el.push(
				h(
					'div',
					{ class: 'mp-rez__dni', style: '--mp-kolumny:' + t.dni.length, role: 'group', 'aria-label': 'Dzień' },
					t.dni.map( ( d ) =>
						h(
							'button',
							{
								type: 'button',
								class: 'mp-rez__dzien',
								'data-klucz': 'dzien-' + d.data,
								'aria-pressed': String( d.data === stan.dzien ),
								'aria-label': wielka( d.etykieta ) + ( d.wolne ? ', wolne godziny: ' + d.wolne : ', brak wolnych godzin' ),
								disabled: d.wolne === 0,
								onclick: function () {
									stan.dzien = d.data;
									stan.slot = null;
									stan.komunikat = '';
									rysuj();
								},
							},
							d.skrot,
							h( 'b', null, d.numer )
						)
					)
				)
			);
			if ( stan.blad ) {
				el.push( bladLadowania() );
			}

			const d = dzien();
			if ( d ) {
				el.push( h( 'p', { class: 'mp-rez__etykieta' }, wielka( d.etykieta ) ) );
				el.push(
					h(
						'div',
						{ class: 'mp-rez__godziny', role: 'group', 'aria-label': 'Godzina' },
						d.godziny.map( ( g ) =>
							h(
								'button',
								{
									type: 'button',
									class: 'mp-rez__godz',
									'data-klucz': 'godz-' + g.start,
									'aria-pressed': String( !! stan.slot && stan.slot.start === g.start ),
									'aria-label': g.wolny ? g.czas : g.czas + ', zajęte',
									disabled: ! g.wolny,
									onclick: function () {
										stan.slot = g;
										stan.komunikat = '';
										rysuj();
									},
								},
								g.czas
							)
						)
					)
				);
			} else if ( ! stan.laduje ) {
				el.push( brakTerminow( t ) );
			}

			const etykieta = zmiana ? ( stan.slot ? 'Przenieś na ' + d.etykieta.split( ', ' ).pop() + ', ' + stan.slot.czas : 'Wybierz godzinę' ) : dane.teksty.dalej;
			el.push(
				h(
					'button',
					{
						type: 'button',
						class: 'mp-rez__przycisk',
						'data-klucz': 'dalej',
						disabled: ! stan.slot || stan.wysyla,
						onclick: zmiana ? zmienTermin : function () {
							idz( 'dane' );
						},
					},
					stan.wysyla ? 'Zapisuję…' : etykieta,
					zmiana ? null : ikona( 'strzalka' )
				)
			);
			if ( ! zmiana && dane.teksty.zapowiedz ) {
				el.push( h( 'p', { class: 'mp-rez__zapowiedz' }, ikona( 'lista' ), dane.teksty.zapowiedz ) );
			}
			return el;
		}

		function strzalka( kierunek, opis, cel ) {
			return h(
				'button',
				{
					type: 'button',
					class: 'mp-rez__strzalka',
					'data-klucz': 'nawigacja-' + kierunek,
					'aria-label': opis,
					disabled: ! cel || stan.laduje,
					html: svg( kierunek ),
					onclick: function () {
						stan.slot = null;
						stan.komunikat = '';
						ladujTydzien( cel );
					},
				}
			);
		}

		function brakTerminow( t ) {
			if ( t.najblizszy ) {
				return h(
					'div',
					{ class: 'mp-rez__info' },
					h( 'p', null, 'W tym tygodniu nie ma już wolnych terminów.' ),
					h(
						'button',
						{
							type: 'button',
							class: 'mp-rez__link',
							'data-klucz': 'najblizszy',
							onclick: function () {
								stan.dzien = t.najblizszy.data;
								ladujTydzien( t.najblizszy.data );
							},
						},
						'Najbliższy wolny: ' + t.najblizszy.etykieta
					)
				);
			}
			return h( 'p', { class: 'mp-rez__info' }, t.nastepny ? 'W tym tygodniu nie ma już wolnych terminów. Sprawdź następny tydzień.' : 'Na razie nie ma wolnych terminów. Zajrzyj tu za kilka dni.' );
		}

		function szkielet() {
			const i = ( n ) => Array.from( { length: n }, () => h( 'i' ) );
			return h(
				'div',
				{ class: 'mp-rez__szkielet', 'aria-hidden': 'true' },
				h( 'i', { class: 'mp-rez__szkielet-miesiac' } ),
				h( 'span', { class: 'mp-rez__dni' }, i( 5 ) ),
				h( 'span', { class: 'mp-rez__godziny' }, i( 6 ) ),
				h( 'i', { class: 'mp-rez__szkielet-przycisk' } )
			);
		}

		function bladLadowania() {
			return h(
				'div',
				{ class: 'mp-rez__info mp-rez__info--blad', role: 'alert' },
				h( 'p', null, stan.blad ),
				h(
					'button',
					{
						type: 'button',
						class: 'mp-rez__link',
						'data-klucz': 'ponow',
						onclick: function () {
							ladujTydzien( stan.tydzien ? stan.tydzien.od : '' );
						},
					},
					'Spróbuj ponownie'
				)
			);
		}

		/* ---------- Krok 2: dane i pytania ---------- */

		function telefonWymagany() {
			return dane.telefon === 'wymagany' || stan.wartosci.forma === 'telefon';
		}

		function telefonWidoczny() {
			return dane.telefon !== 'ukryty' || stan.wartosci.forma === 'telefon';
		}

		function krokDane() {
			const w = wizyta();
			const d = dzien();
			const formy = w.formy.map( ( f ) => f.id );
			if ( formy.length === 1 ) {
				stan.wartosci.forma = formy[ 0 ];
			} else if ( formy.indexOf( stan.wartosci.forma ) === -1 ) {
				delete stan.wartosci.forma;
			}

			const formularz = h( 'form', { class: 'mp-rez__formularz', novalidate: true, onsubmit: wyslij } );
			if ( w.formy.length > 1 ) {
				formularz.append( poleOpcje( 'forma', 'Jak chcesz się spotkać?', w.formy.map( ( f ) => [ f.id, f.etykieta ] ), true ) );
			}
			formularz.append(
				poleTekst( 'imie', 'Imię i nazwisko', { autocomplete: 'name', wymagane: true } ),
				poleTekst( 'email', 'E-mail', { type: 'email', autocomplete: 'email', inputmode: 'email', wymagane: true } )
			);
			if ( telefonWidoczny() ) {
				formularz.append( poleTekst( 'telefon', 'Telefon', { type: 'tel', autocomplete: 'tel', inputmode: 'tel', wymagane: telefonWymagany(), opis: stan.wartosci.forma === 'telefon' ? 'Na ten numer zadzwonię o umówionej godzinie.' : '' } ) );
			}
			if ( dane.pytania.length ) {
				formularz.append( h( 'p', { class: 'mp-rez__sekcja' }, dane.teksty.pytania ) );
				dane.pytania.forEach( function ( p ) {
					const klucz = 'p_' + p.id;
					if ( p.typ === 'wybor' ) {
						formularz.append( poleOpcje( klucz, p.etykieta, p.opcje.map( ( o ) => [ o, o ] ), p.wymagane, p.podpowiedz ) );
					} else if ( p.typ === 'lista' ) {
						formularz.append( poleLista( klucz, p ) );
					} else {
						formularz.append( poleTekst( klucz, p.etykieta, { wymagane: p.wymagane, dlugie: p.typ === 'dlugi', podpowiedz: p.podpowiedz } ) );
					}
				} );
			}

			const zgodaId = korzen.id + '-zgoda';
			formularz.append(
				h(
					'div',
					{ class: 'mp-rez__pole mp-rez__zgoda' + ( stan.bledy.zgoda ? ' mp-rez__pole--blad' : '' ) },
					h( 'input', {
						type: 'checkbox',
						id: zgodaId,
						name: 'zgoda',
						checked: !! stan.wartosci.zgoda,
						'aria-invalid': stan.bledy.zgoda ? 'true' : null,
						'aria-describedby': stan.bledy.zgoda ? zgodaId + '-blad' : null,
						onchange: function ( e ) {
							stan.wartosci.zgoda = e.target.checked;
							wyczyscBlad( 'zgoda', e.target );
						},
					} ),
					h( 'label', { for: zgodaId, html: dane.teksty.zgoda } ),
					stan.bledy.zgoda ? h( 'p', { class: 'mp-rez__blad', id: zgodaId + '-blad' }, stan.bledy.zgoda ) : null
				),
				h(
					'div',
					{ class: 'mp-rez__pulapka', 'aria-hidden': 'true' },
					h( 'label', null, 'Strona www', h( 'input', { type: 'text', name: 'www', tabindex: '-1', autocomplete: 'off' } ) )
				)
			);
			if ( stan.bladFormularza ) {
				formularz.append( h( 'p', { class: 'mp-rez__info mp-rez__info--blad', role: 'alert' }, stan.bladFormularza ) );
			}
			formularz.append(
				h(
					'button',
					{ type: 'submit', class: 'mp-rez__przycisk', 'data-klucz': 'wyslij', disabled: stan.wysyla },
					stan.wysyla ? 'Rezerwuję…' : dane.teksty.przycisk,
					stan.wysyla ? null : ikona( 'strzalka' )
				),
				h( 'p', { class: 'mp-rez__drobne' }, 'Potwierdzenie przyjdzie na podany e-mail.' )
			);

			return [
				h(
					'div',
					{ class: 'mp-rez__wybrany' },
					ikona( 'kalendarz' ),
					h( 'span', null, h( 'strong', null, wielka( d.etykieta ) + ', ' + stan.slot.czas + '–' + stan.slot.koniec ), h( 'small', null, w.nazwa + ', ' + w.czas ) ),
					h(
						'button',
						{
							type: 'button',
							class: 'mp-rez__link',
							'data-klucz': 'wstecz',
							onclick: function () {
								zapamietaj( formularz );
								idz( 'termin' );
							},
						},
						'Zmień'
					)
				),
				naglowek( 'Twoje dane' ),
				formularz,
			];
		}

		function wyczyscBlad( klucz, el ) {
			if ( ! stan.bledy[ klucz ] ) {
				return;
			}
			delete stan.bledy[ klucz ];
			const pole = el.closest( '.mp-rez__pole' );
			if ( pole ) {
				pole.classList.remove( 'mp-rez__pole--blad' );
				pole.querySelectorAll( '.mp-rez__blad' ).forEach( ( b ) => b.remove() );
				[ pole, ...pole.querySelectorAll( '[aria-invalid], [aria-describedby]' ) ].forEach( function ( x ) {
					x.removeAttribute( 'aria-invalid' );
					x.removeAttribute( 'aria-describedby' );
				} );
			}
		}

		function id( klucz ) {
			return korzen.id + '-' + klucz;
		}

		function opisBledu( klucz ) {
			return stan.bledy[ klucz ] ? h( 'p', { class: 'mp-rez__blad', id: id( klucz ) + '-blad' }, stan.bledy[ klucz ] ) : null;
		}

		function etykietaPola( klucz, tekst, wymagane, tag ) {
			return h( tag || 'label', tag ? { class: 'mp-rez__etykieta-pola', id: id( klucz ) + '-etykieta' } : { for: id( klucz ) }, tekst, wymagane ? null : h( 'span', { class: 'mp-rez__opcjonalne' }, ' (opcjonalnie)' ) );
		}

		function poleTekst( klucz, etykieta, o ) {
			const atrybuty = {
				id: id( klucz ),
				name: klucz,
				value: stan.wartosci[ klucz ] || '',
				autocomplete: o.autocomplete || null,
				inputmode: o.inputmode || null,
				placeholder: o.podpowiedz || null,
				required: !! o.wymagane,
				maxlength: o.dlugie ? '2000' : '300',
				'aria-invalid': stan.bledy[ klucz ] ? 'true' : null,
				'aria-describedby': stan.bledy[ klucz ] ? id( klucz ) + '-blad' : null,
				oninput: function ( e ) {
					stan.wartosci[ klucz ] = e.target.value;
					wyczyscBlad( klucz, e.target );
				},
			};
			let pole;
			if ( o.dlugie ) {
				delete atrybuty.value;
				pole = h( 'textarea', Object.assign( atrybuty, { rows: '3' } ), stan.wartosci[ klucz ] || '' );
			} else {
				pole = h( 'input', Object.assign( atrybuty, { type: o.type || 'text' } ) );
			}
			return h( 'div', { class: 'mp-rez__pole' + ( stan.bledy[ klucz ] ? ' mp-rez__pole--blad' : '' ) }, etykietaPola( klucz, etykieta, o.wymagane ), o.opis ? h( 'p', { class: 'mp-rez__podpowiedz' }, o.opis ) : null, pole, opisBledu( klucz ) );
		}

		function poleLista( klucz, p ) {
			const wybor = h(
				'select',
				{
					id: id( klucz ),
					name: klucz,
					required: !! p.wymagane,
					'aria-invalid': stan.bledy[ klucz ] ? 'true' : null,
					'aria-describedby': stan.bledy[ klucz ] ? id( klucz ) + '-blad' : null,
					onchange: function ( e ) {
						stan.wartosci[ klucz ] = e.target.value;
						wyczyscBlad( klucz, e.target );
					},
				},
				h( 'option', { value: '' }, p.podpowiedz || 'Wybierz…' ),
				p.opcje.map( ( o ) => h( 'option', { value: o, selected: stan.wartosci[ klucz ] === o }, o ) )
			);
			return h( 'div', { class: 'mp-rez__pole' + ( stan.bledy[ klucz ] ? ' mp-rez__pole--blad' : '' ) }, etykietaPola( klucz, p.etykieta, p.wymagane ), wybor, opisBledu( klucz ) );
		}

		/** Opcje jako przyciski-pigułki (radio). */
		function poleOpcje( klucz, etykieta, opcje, wymagane, podpowiedz ) {
			return h(
				'div',
				{
					class: 'mp-rez__pole' + ( stan.bledy[ klucz ] ? ' mp-rez__pole--blad' : '' ),
					role: 'radiogroup',
					'aria-labelledby': id( klucz ) + '-etykieta',
					'aria-describedby': stan.bledy[ klucz ] ? id( klucz ) + '-blad' : null,
				},
				etykietaPola( klucz, etykieta, wymagane, 'p' ),
				podpowiedz ? h( 'p', { class: 'mp-rez__podpowiedz' }, podpowiedz ) : null,
				h(
					'div',
					{ class: 'mp-rez__opcje' },
					opcje.map( ( [ wartosc, napis ] ) =>
						h(
							'label',
							{ class: 'mp-rez__opcja' },
							h( 'input', {
								type: 'radio',
								name: klucz,
								value: wartosc,
								checked: stan.wartosci[ klucz ] === wartosc,
								onchange: function () {
									stan.wartosci[ klucz ] = wartosc;
									wyczyscBlad( klucz, this );
									if ( klucz === 'forma' ) {
										zapamietaj( this.form );
										rysuj( 'input[name="forma"]:checked' );
									}
								},
							} ),
							h( 'span', null, napis )
						)
					)
				),
				opisBledu( klucz )
			);
		}

		function zapamietaj( formularz ) {
			new FormData( formularz ).forEach( function ( wartosc, klucz ) {
				if ( klucz !== 'www' ) {
					stan.wartosci[ klucz ] = wartosc;
				}
			} );
			const zgoda = formularz.querySelector( '[name="zgoda"]' );
			stan.wartosci.zgoda = !! ( zgoda && zgoda.checked );
		}

		function sprawdz() {
			const b = {};
			const v = stan.wartosci;
			const w = wizyta();
			if ( w.formy.length > 1 && ! v.forma ) {
				b.forma = 'Wybierz, jak chcesz się spotkać.';
			}
			if ( ! v.imie || v.imie.trim().length < 2 ) {
				b.imie = 'Podaj imię i nazwisko.';
			}
			if ( ! /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test( ( v.email || '' ).trim() ) ) {
				b.email = 'Sprawdź adres e-mail.';
			}
			const tel = ( v.telefon || '' ).trim();
			if ( telefonWidoczny() ) {
				if ( tel && tel.replace( /\D/g, '' ).length < 9 ) {
					b.telefon = 'Sprawdź numer telefonu.';
				} else if ( ! tel && telefonWymagany() ) {
					b.telefon = 'Podaj numer telefonu.';
				}
			}
			dane.pytania.forEach( function ( p ) {
				if ( p.wymagane && ! ( v[ 'p_' + p.id ] || '' ).trim() ) {
					b[ 'p_' + p.id ] = 'To pytanie jest wymagane.';
				}
			} );
			if ( ! v.zgoda ) {
				b.zgoda = 'Bez tej zgody nie mogę przyjąć rezerwacji.';
			}
			return b;
		}

		function pokazBledy() {
			rysuj();
			const pierwszy = tresc.querySelector( '[aria-invalid="true"], .mp-rez__pole--blad input' );
			if ( pierwszy ) {
				pierwszy.focus();
			}
			oglos( 'Popraw zaznaczone pola.' );
		}

		async function wyslij( e ) {
			e.preventDefault();
			if ( stan.wysyla ) {
				return;
			}
			const formularz = e.target;
			zapamietaj( formularz );
			stan.bladFormularza = '';
			stan.bledy = sprawdz();
			if ( Object.keys( stan.bledy ).length ) {
				pokazBledy();
				return;
			}

			const v = stan.wartosci;
			const odpowiedzi = {};
			dane.pytania.forEach( function ( p ) {
				odpowiedzi[ p.id ] = ( v[ 'p_' + p.id ] || '' ).trim();
			} );
			const www = formularz.querySelector( '[name="www"]' );

			stan.wysyla = true;
			rysuj( '[data-klucz="wyslij"]' );
			try {
				stan.wynik = await zapytaj( dane.api.rezerwacje, {
					method: 'POST',
					headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
					body: JSON.stringify( {
						wizyta: stan.wizyta,
						start: stan.slot.start,
						forma: v.forma || '',
						imie: ( v.imie || '' ).trim(),
						email: ( v.email || '' ).trim(),
						telefon: ( v.telefon || '' ).trim(),
						odpowiedzi: odpowiedzi,
						zgoda: !! v.zgoda,
						www: www ? www.value : '',
						strona: dane.strona,
					} ),
				} );
				stan.wysyla = false;
				idz( 'gotowe' );
			} catch ( blad ) {
				stan.wysyla = false;
				if ( blad.code === 'termin_zajety' ) {
					stan.slot = null;
					stan.komunikat = blad.message;
					idz( 'termin' );
					ladujTydzien( stan.tydzien ? stan.tydzien.od : '' );
					return;
				}
				stan.bledy = ( blad.data && blad.data.pola ) || {};
				stan.bladFormularza = Object.keys( stan.bledy ).length ? '' : ( blad.message || 'Nie udało się zapisać rezerwacji. Spróbuj ponownie.' );
				pokazBledy();
			}
		}

		/* ---------- Krok 3: gotowe ---------- */

		function krokGotowe() {
			const w = stan.wynik;
			const el = [
				h( 'span', { class: 'mp-rez__ok', html: svg( 'ok' ) } ),
				h( 'h3', { class: 'mp-rez__tytul mp-rez__tytul--srodek', tabindex: '-1' }, 'Do zobaczenia ' + w.kiedy ),
				dane.teksty.sukces ? h( 'p', { class: 'mp-rez__pomoc mp-rez__pomoc--srodek' }, dane.teksty.sukces ) : null,
				h(
					'dl',
					{ class: 'mp-rez__szczegoly' },
					wiersz( 'Termin', w.termin ),
					wiersz( 'Spotkanie', w.wizyta ),
					wiersz( 'Forma', w.link ? [ w.forma, h( 'br' ), h( 'a', { href: w.link, target: '_blank', rel: 'noopener' }, w.link.replace( /^https?:\/\//, '' ) ) ] : w.forma ),
					wiersz( 'E-mail', w.email )
				),
			];
			if ( w.odpowiedzi.length ) {
				el.push(
					h(
						'details',
						{ class: 'mp-rez__odpowiedzi' },
						h( 'summary', null, 'Twoje odpowiedzi' ),
						h( 'dl', { class: 'mp-rez__szczegoly' }, w.odpowiedzi.map( ( [ pytanie, odpowiedz ] ) => wiersz( pytanie, odpowiedz ) ) )
					)
				);
			}
			el.push(
				h(
					'div',
					{ class: 'mp-rez__akcje' },
					h( 'a', { class: 'mp-rez__przycisk mp-rez__przycisk--obrys', href: w.google, target: '_blank', rel: 'noopener' }, 'Dodaj do Kalendarza Google' ),
					h( 'a', { class: 'mp-rez__przycisk mp-rez__przycisk--obrys', href: w.ics }, 'Pobierz plik .ics' )
				),
				h( 'p', { class: 'mp-rez__drobne mp-rez__drobne--srodek' }, 'Zmienić termin albo odwołać spotkanie możesz przez link w e-mailu.' )
			);
			return el;
		}

		function wiersz( etykieta, wartosc ) {
			return h( 'div', null, h( 'dt', null, etykieta ), h( 'dd', null, wartosc ) );
		}

		/* ---------- Zmiana terminu (strona z linku w e-mailu) ---------- */

		async function zmienTermin() {
			if ( ! stan.slot || stan.wysyla ) {
				return;
			}
			stan.wysyla = true;
			rysuj( '[data-klucz="dalej"]' );
			try {
				await zapytaj( dane.api.zmien, {
					method: 'POST',
					headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
					body: JSON.stringify( { start: stan.slot.start } ),
				} );
				window.location.assign( dane.po );
			} catch ( blad ) {
				stan.wysyla = false;
				stan.slot = null;
				stan.komunikat = blad.message || 'Nie udało się zmienić terminu. Spróbuj ponownie.';
				ladujTydzien( stan.tydzien ? stan.tydzien.od : '' );
				oglos( stan.komunikat );
			}
		}

		if ( ! korzen.id ) {
			korzen.id = 'mp-rez-' + Math.random().toString( 36 ).slice( 2, 8 );
		}
		ladujTydzien( '' );
	}

	function start() {
		document.querySelectorAll( '[data-mp-rez]' ).forEach( uruchom );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', start );
	} else {
		start();
	}
} )();
