/**
 * MP Rezerwacje: panel. Wiersze do dodawania i przesuwania, zdjęcie z biblioteki,
 * test połączenia z Google i kolory z podglądem na żywo.
 */
( function ( $ ) {
	'use strict';

	let licznik = 0;
	const podglad = document.querySelector( '.mp-podglad' );

	document.addEventListener( 'click', function ( e ) {
		const dodaj = e.target.closest( '[data-mp-dodaj]' );
		if ( dodaj ) {
			const szablon = document.getElementById( dodaj.dataset.mpDodaj );
			const lista = document.querySelector( dodaj.dataset.mpLista );
			lista.insertAdjacentHTML( 'beforeend', szablon.innerHTML.replace( /__i__/g, 'n' + Date.now() + licznik++ ) );
			const pole = lista.lastElementChild.querySelector( 'input[type="text"]' );
			if ( pole ) {
				pole.focus();
			}
			return;
		}

		const wiersz = e.target.closest( '.mp-wiersz' );
		if ( wiersz && e.target.closest( '[data-mp-usun]' ) ) {
			wiersz.remove();
			return;
		}
		if ( wiersz && e.target.closest( '[data-mp-gora]' ) && wiersz.previousElementSibling ) {
			wiersz.parentNode.insertBefore( wiersz, wiersz.previousElementSibling );
			e.target.focus();
			return;
		}
		if ( wiersz && e.target.closest( '[data-mp-dol]' ) && wiersz.nextElementSibling ) {
			wiersz.parentNode.insertBefore( wiersz.nextElementSibling, wiersz );
			e.target.focus();
			return;
		}

		const wybierz = e.target.closest( '[data-mp-wybierz]' );
		if ( wybierz && window.wp && wp.media ) {
			const pudelko = wybierz.closest( '[data-mp-zdjecie]' );
			const ramka = wp.media( { title: 'Zdjęcie nad kalendarzem', library: { type: 'image' }, button: { text: 'Wybierz' }, multiple: false } );
			ramka.on( 'select', function () {
				const plik = ramka.state().get( 'selection' ).first().toJSON();
				const img = document.createElement( 'img' );
				img.src = plik.sizes && plik.sizes.thumbnail ? plik.sizes.thumbnail.url : plik.url;
				img.alt = '';
				pudelko.querySelector( 'input' ).value = plik.id;
				pudelko.querySelector( '.mp-zdjecie-podglad' ).replaceChildren( img );
				pudelko.querySelector( '[data-mp-bez-zdjecia]' ).hidden = false;
			} );
			ramka.open();
			return;
		}
		const bezZdjecia = e.target.closest( '[data-mp-bez-zdjecia]' );
		if ( bezZdjecia ) {
			const pudelko = bezZdjecia.closest( '[data-mp-zdjecie]' );
			pudelko.querySelector( 'input' ).value = '';
			pudelko.querySelector( '.mp-zdjecie-podglad' ).replaceChildren();
			bezZdjecia.hidden = true;
			return;
		}

		const kopiuj = e.target.closest( '[data-mp-kopiuj]' );
		if ( kopiuj && navigator.clipboard ) {
			navigator.clipboard.writeText( kopiuj.dataset.mpKopiuj ).then( function () {
				kopiuj.textContent = 'Skopiowane';
				window.setTimeout( function () {
					kopiuj.textContent = 'Kopiuj';
				}, 2000 );
			} );
			return;
		}

		const test = e.target.closest( '[data-mp-test-google]' );
		if ( test ) {
			testGoogle( test );
		}
	} );

	document.addEventListener( 'change', function ( e ) {
		if ( e.target.matches( '[data-mp-typ]' ) ) {
			const opcje = e.target.closest( '.mp-wiersz' ).querySelector( '[data-mp-opcje]' );
			opcje.hidden = [ 'wybor', 'lista' ].indexOf( e.target.value ) === -1;
		}
	} );

	function testGoogle( przycisk ) {
		const lista = document.querySelector( '[data-mp-wyniki]' );
		const wpis = function ( klasa, nazwa, opis ) {
			const li = document.createElement( 'li' );
			li.className = klasa;
			const b = document.createElement( 'strong' );
			b.textContent = nazwa;
			li.append( b, ' ', opis );
			return li;
		};
		przycisk.disabled = true;
		lista.replaceChildren( wpis( '', 'Sprawdzam…', '' ) );
		fetch( window.mpPanel.test, { method: 'POST', credentials: 'same-origin', headers: { 'X-WP-Nonce': window.mpPanel.nonce } } )
			.then( function ( odp ) {
				return odp.json();
			} )
			.then( function ( wyniki ) {
				const lista2 = Array.isArray( wyniki ) ? wyniki : [ { nazwa: 'Błąd', ok: false, opis: wyniki.message || 'Nieznany błąd.' } ];
				lista.replaceChildren( ...lista2.map( ( w ) => wpis( w.ok ? 'mp-ok' : 'mp-zle', ( w.ok ? '✓ ' : '✗ ' ) + w.nazwa + ':', w.opis ) ) );
			} )
			.catch( function () {
				lista.replaceChildren( wpis( 'mp-zle', '✗', 'Nie udało się połączyć z WordPressem. Odśwież stronę.' ) );
			} )
			.finally( function () {
				przycisk.disabled = false;
			} );
	}

	/* Wygląd: kolory i zaokrąglenie od razu w podglądzie. */

	function jasny( hex ) {
		const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec( hex || '' );
		if ( ! m ) {
			return false;
		}
		const h = m[ 1 ].length === 3 ? m[ 1 ].split( '' ).map( ( c ) => c + c ).join( '' ) : m[ 1 ];
		const kanal = function ( i ) {
			const c = parseInt( h.substr( i, 2 ), 16 ) / 255;
			return c <= 0.03928 ? c / 12.92 : Math.pow( ( c + 0.055 ) / 1.055, 2.4 );
		};
		return 0.2126 * kanal( 0 ) + 0.7152 * kanal( 2 ) + 0.0722 * kanal( 4 ) > 0.2;
	}

	function ustaw( pole, wartosc ) {
		if ( ! podglad || ! pole ) {
			return;
		}
		const zmienna = pole.dataset.mpZmienna;
		if ( ! wartosc ) {
			podglad.style.removeProperty( zmienna );
			if ( zmienna === '--mp-glowny' ) {
				podglad.style.removeProperty( '--mp-na-glownym' );
			}
			return;
		}
		podglad.style.setProperty( zmienna, zmienna === '--mp-promien' ? wartosc + 'px' : wartosc );
		if ( zmienna === '--mp-glowny' ) {
			podglad.style.setProperty( '--mp-na-glownym', jasny( wartosc ) ? '#161514' : '#f5f2ec' );
		}
	}

	if ( $ && $.fn.wpColorPicker ) {
		$( '.mp-kolor' ).wpColorPicker( {
			change( e, ui ) {
				ustaw( e.target, ui.color.toString() );
			},
			clear( e ) {
				ustaw( $( e.target ).closest( '.wp-picker-container' ).find( '.mp-kolor' )[ 0 ], '' );
			},
		} );
	}
	// Lista spotkań: „zaznacz wszystkie” i przycisk „Usuń zaznaczone” aktywny dopiero po zaznaczeniu.
	const zbiorczo = document.getElementById( 'mp-zbiorczo' );
	if ( zbiorczo ) {
		const pola = () => Array.from( document.querySelectorAll( 'input[form="mp-zbiorczo"][name="ids[]"]' ) );
		const przycisk = zbiorczo.querySelector( '[data-mp-zbiorczo]' );
		const odswiez = function () {
			const ile = pola().filter( ( p ) => p.checked ).length;
			przycisk.disabled = ! ile;
			przycisk.textContent = ile ? 'Usuń zaznaczone (' + ile + ')' : 'Usuń zaznaczone';
		};
		document.addEventListener( 'change', function ( e ) {
			if ( e.target.matches( '[data-mp-wszystkie]' ) ) {
				pola().forEach( ( p ) => {
					p.checked = e.target.checked;
				} );
			}
			if ( e.target.matches( '[data-mp-wszystkie], input[form="mp-zbiorczo"]' ) ) {
				odswiez();
			}
		} );
		odswiez();
	}

	const promien = document.getElementById( 'mp-promien' );
	if ( promien ) {
		promien.addEventListener( 'input', function () {
			ustaw( promien, promien.value );
		} );
	}
} )( window.jQuery );
