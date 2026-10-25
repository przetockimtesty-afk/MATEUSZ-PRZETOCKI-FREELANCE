/**
 * MP Ankiety: ankieta w krokach na stronie. Bez bibliotek.
 * Pytania są w HTML od razu (szablony/ankieta.php); tu: jeden krok naraz, warunki „gdy”,
 * sprawdzanie pól, zapamiętywanie odpowiedzi w przeglądarce i wysyłka do REST API.
 */
( function () {
	'use strict';

	const INNE = '__inne';
	const WAZNOSC_SZKICU = 14 * 24 * 3600 * 1000;

	function uruchom( korzen ) {
		if ( korzen.dataset.mpGotowy ) {
			return;
		}
		korzen.dataset.mpGotowy = '1';

		const dane = JSON.parse( korzen.querySelector( '.mp-ank__dane' ).textContent );
		const formularz = korzen.querySelector( '.mp-ank__karta' );
		const kroki = Array.from( korzen.querySelectorAll( '.mp-ank__krok' ) );
		const dalej = korzen.querySelector( '.mp-ank__dalej' );
		const wstecz = korzen.querySelector( '.mp-ank__wstecz' );
		const komunikat = korzen.querySelector( '.mp-ank__komunikat' );
		const prywatnosc = korzen.querySelector( '.mp-ank__prywatnosc' );
		const postep = korzen.querySelector( '.mp-ank__postep-tekst' );
		const pasek = korzen.querySelector( '.mp-ank__pasek > span' );
		const sukces = korzen.querySelector( '.mp-ank__sukces' );
		const przywrocone = korzen.querySelector( '.mp-ank__przywrocone' );
		const ogloszenie = korzen.querySelector( '.mp-ank__sr' );
		const kluczSzkicu = 'mp-ankieta:' + dane.strona + ':' + dane.ankieta;
		const warunki = new Map();
		const start = Date.now();
		const spokojnie = window.matchMedia && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
		let biezacy = 0;
		let wysyla = false;
		let klucz = losowy();
		let zapis = 0;

		korzen.classList.add( 'mp-ank--js' );

		/* ---------- Pomocnicze ---------- */

		function losowy() {
			if ( window.crypto && window.crypto.randomUUID ) {
				return window.crypto.randomUUID();
			}
			return 'k' + Date.now().toString( 36 ) + Math.random().toString( 36 ).slice( 2 ) + Math.random().toString( 36 ).slice( 2 );
		}

		function oglos( tekst ) {
			ogloszenie.textContent = '';
			window.setTimeout( function () {
				ogloszenie.textContent = tekst;
			}, 60 );
		}

		function gdy( el ) {
			if ( ! warunki.has( el ) ) {
				let w = [];
				try {
					w = JSON.parse( el.dataset.gdy || '[]' );
				} catch ( e ) {
					w = [];
				}
				warunki.set( el, w );
			}
			return warunki.get( el );
		}

		/** Warunek spełniony, gdy pasuje choć jedna alternatywa; w alternatywie wszystkie pola. */
		function spelnia( warunek, wartosci ) {
			if ( ! warunek.length ) {
				return true;
			}
			return warunek.some( function ( alternatywa ) {
				return Object.keys( alternatywa ).every( function ( pole ) {
					const jest = wartosci[ pole ];
					if ( jest === undefined || jest === null || ( Array.isArray( jest ) && ! jest.length ) ) {
						return false;
					}
					const dozwolone = alternatywa[ pole ];
					return dozwolone.indexOf( '*' ) !== -1 || [].concat( jest ).some( ( w ) => dozwolone.indexOf( w ) !== -1 );
				} );
			} );
		}

		function pytaniaKroku( krok ) {
			return Array.from( krok.querySelectorAll( '.mp-ank__pytanie' ) );
		}

		function wartosc( q ) {
			const typ = q.dataset.typ;
			if ( typ === 'info' ) {
				return null;
			}
			if ( typ === 'jeden' || typ === 'skala' ) {
				const z = q.querySelector( 'input[type="radio"]:checked' );
				return z ? z.value : null;
			}
			if ( typ === 'wiele' ) {
				const z = Array.from( q.querySelectorAll( '.mp-ank__opcje input:checked' ) ).map( ( i ) => i.value );
				return z.length ? z : null;
			}
			if ( typ === 'zgoda' ) {
				const z = q.querySelector( 'input[type="checkbox"]' );
				return z && z.checked ? 'tak' : null;
			}
			const pole = q.querySelector( 'input, textarea' );
			const v = pole ? pole.value.trim() : '';
			return v === '' ? null : v;
		}

		function tekstInne( q ) {
			const pole = q.querySelector( '.mp-ank__inne' );
			return pole ? pole.value.trim() : '';
		}

		/* ---------- Widoczność (ta sama logika co Definicja::sprawdz w PHP) ---------- */

		/** Widoczne pytania bez odpowiedzi: od nich może jeszcze zależeć, które kroki się pokażą. */
		let oczekujace = new Set();

		function odswiez() {
			const wartosci = {};
			const widoczneId = {};
			oczekujace = new Set();
			kroki.forEach( function ( krok ) {
				const krokWidoczny = spelnia( gdy( krok ), wartosci );
				krok.dataset.widoczny = krokWidoczny ? '1' : '';
				pytaniaKroku( krok ).forEach( function ( q ) {
					let widoczne = krokWidoczny && spelnia( gdy( q ), wartosci );
					if ( widoczne && q.dataset.typ !== 'info' ) {
						if ( widoczneId[ q.dataset.id ] ) {
							widoczne = false;
						} else {
							widoczneId[ q.dataset.id ] = true;
						}
					}
					q.hidden = ! widoczne;
					q.querySelectorAll( 'input, textarea' ).forEach( function ( pole ) {
						if ( ! pole.classList.contains( 'mp-ank__inne' ) ) {
							pole.disabled = ! widoczne;
						}
					} );
					const w = widoczne ? wartosc( q ) : null;
					const poleInne = q.querySelector( '.mp-ank__inne' );
					if ( poleInne ) {
						const pokaz = [].concat( w || [] ).indexOf( INNE ) !== -1;
						poleInne.hidden = ! pokaz;
						poleInne.disabled = ! pokaz;
					}
					if ( w !== null ) {
						wartosci[ q.dataset.id ] = w;
					} else if ( widoczne && q.dataset.typ !== 'info' ) {
						oczekujace.add( q.dataset.id );
					}
				} );
			} );
			return wartosci;
		}

		/** Czy liczba kroków jest już pewna (żaden ukryty krok nie czeka na odpowiedź z tej strony ankiety). */
		function liczbaPewna() {
			return kroki.every( function ( krok ) {
				return krok.dataset.widoczny || ! gdy( krok ).some( ( alternatywa ) => Object.keys( alternatywa ).some( ( pole ) => oczekujace.has( pole ) ) );
			} );
		}

		function widoczneKroki() {
			return kroki.filter( ( k ) => k.dataset.widoczny );
		}

		function sasiedni( kierunek ) {
			for ( let i = biezacy + kierunek; i >= 0 && i < kroki.length; i += kierunek ) {
				if ( kroki[ i ].dataset.widoczny ) {
					return i;
				}
			}
			return -1;
		}

		function aktualizujPostep() {
			const widoczne = widoczneKroki();
			const nr = Math.max( 1, widoczne.indexOf( kroki[ biezacy ] ) + 1 );
			const ostatni = nr === widoczne.length && liczbaPewna();
			const pewna = liczbaPewna();
			postep.textContent = pewna ? 'Krok ' + nr + ' z ' + widoczne.length : 'Krok ' + nr;
			pasek.style.width = Math.round( ( nr / ( pewna ? widoczne.length : widoczne.length + 2 ) ) * 100 ) + '%';
			dalej.querySelector( 'span' ).textContent = ostatni ? dane.wyslij : 'Dalej';
			wstecz.hidden = nr === 1;
			if ( prywatnosc ) {
				prywatnosc.hidden = ! ostatni;
			}
			return { nr, razem: widoczne.length };
		}

		function pokazKrok( i, fokus ) {
			biezacy = i;
			kroki.forEach( ( k, j ) => {
				k.hidden = j !== i;
			} );
			komunikat.hidden = true;
			const p = aktualizujPostep();
			if ( fokus ) {
				przewin();
				const tytul = kroki[ i ].querySelector( '.mp-ank__tytul' );
				tytul.focus( { preventScroll: true } );
				oglos( postep.textContent + ': ' + tytul.textContent );
			}
		}

		function przewin() {
			const gora = korzen.getBoundingClientRect().top;
			if ( gora < 0 || gora > window.innerHeight * 0.5 ) {
				korzen.scrollIntoView( { block: 'start', behavior: spokojnie ? 'auto' : 'smooth' } );
			}
		}

		/* ---------- Sprawdzanie pól ---------- */

		function liczba( tekst ) {
			const czysty = tekst.replace( /[\s ]/g, '' ).replace( ',', '.' );
			return czysty === '' ? NaN : Number( czysty );
		}

		function blad( q ) {
			const typ = q.dataset.typ;
			const w = wartosc( q );
			if ( w === null ) {
				if ( ! q.hasAttribute( 'data-wymagane' ) ) {
					return '';
				}
				return typ === 'zgoda' ? 'Zaznacz, żeby przejść dalej.' : 'To pytanie jest wymagane.';
			}
			if ( ( typ === 'jeden' || typ === 'wiele' ) && [].concat( w ).indexOf( INNE ) !== -1 && ! tekstInne( q ) ) {
				return typ === 'jeden' ? 'Wpisz, jaka to odpowiedź.' : 'Wpisz, co jeszcze.';
			}
			if ( typ === 'email' && ! /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test( w ) ) {
				return 'Wpisz poprawny adres e-mail, np. imie@firma.pl.';
			}
			if ( typ === 'telefon' ) {
				const cyfry = w.replace( /\D/g, '' ).length;
				if ( ! /^[0-9 +().-]+$/.test( w ) || cyfry < 7 || cyfry > 15 ) {
					return 'Wpisz numer telefonu, np. 600 100 200.';
				}
			}
			if ( typ === 'liczba' ) {
				const n = liczba( w );
				if ( isNaN( n ) ) {
					return 'Wpisz samą liczbę, np. 12.';
				}
				const min = q.dataset.min !== undefined ? Number( q.dataset.min ) : null;
				const max = q.dataset.max !== undefined ? Number( q.dataset.max ) : null;
				if ( ( min !== null && n < min ) || ( max !== null && n > max ) ) {
					return 'Wpisz liczbę od ' + ( min || 0 ) + ( max !== null ? ' do ' + max : ' w górę' ) + '.';
				}
			}
			return '';
		}

		function pokazBlad( q, tekst ) {
			const p = q.querySelector( '.mp-ank__blad' );
			p.textContent = tekst;
			p.hidden = ! tekst;
			q.classList.toggle( 'mp-ank__pytanie--blad', !! tekst );
			q.querySelectorAll( 'input, textarea' ).forEach( function ( pole ) {
				if ( tekst ) {
					pole.setAttribute( 'aria-invalid', 'true' );
				} else {
					pole.removeAttribute( 'aria-invalid' );
				}
			} );
		}

		function bledyKroku( krok ) {
			return pytaniaKroku( krok ).filter( function ( q ) {
				if ( q.hidden || q.dataset.typ === 'info' ) {
					return false;
				}
				const tekst = blad( q );
				pokazBlad( q, tekst );
				return !! tekst;
			} );
		}

		function fokusNaBlad( q ) {
			const pole = q.querySelector( '.mp-ank__inne:not([hidden])' ) && tekstInne( q ) === '' && wartosc( q ) !== null
				? q.querySelector( '.mp-ank__inne' )
				: q.querySelector( 'input:not([type="hidden"]), textarea' );
			q.scrollIntoView( { block: 'center', behavior: spokojnie ? 'auto' : 'smooth' } );
			if ( pole ) {
				pole.focus( { preventScroll: true } );
			}
			oglos( q.querySelector( '.mp-ank__blad' ).textContent );
		}

		/* ---------- Zapamiętane odpowiedzi (tylko w tej przeglądarce) ---------- */

		function polaFormularza() {
			return Array.from( formularz.querySelectorAll( 'input[name], textarea[name]' ) ).filter( ( p ) => p.name !== 'www' );
		}

		function zapiszSzkic() {
			window.clearTimeout( zapis );
			zapis = window.setTimeout( function () {
				const w = {};
				polaFormularza().forEach( function ( p ) {
					if ( p.type === 'radio' || p.type === 'checkbox' ) {
						if ( p.checked ) {
							w[ p.name ] = ( w[ p.name ] || [] ).concat( p.value );
						}
					} else if ( p.value !== '' ) {
						w[ p.name ] = p.value;
					}
				} );
				try {
					window.localStorage.setItem( kluczSzkicu, JSON.stringify( { w, k: biezacy, klucz, t: Date.now() } ) );
				} catch ( e ) {
					// prywatne okno albo zablokowana pamięć: ankieta działa dalej, tylko bez zapamiętywania
				}
			}, 300 );
		}

		function usunSzkic() {
			window.clearTimeout( zapis );
			try {
				window.localStorage.removeItem( kluczSzkicu );
			} catch ( e ) {
				// bez pamięci przeglądarki nie ma czego usuwać
			}
		}

		function wczytajSzkic() {
			let s = null;
			try {
				s = JSON.parse( window.localStorage.getItem( kluczSzkicu ) || 'null' );
			} catch ( e ) {
				s = null;
			}
			if ( ! s || ! s.w || Date.now() - ( s.t || 0 ) > WAZNOSC_SZKICU ) {
				return null;
			}
			let cos = false;
			polaFormularza().forEach( function ( p ) {
				const v = s.w[ p.name ];
				if ( v === undefined ) {
					return;
				}
				if ( p.type === 'radio' || p.type === 'checkbox' ) {
					p.checked = [].concat( v ).indexOf( p.value ) !== -1;
				} else {
					p.value = String( v );
				}
				cos = true;
			} );
			if ( ! cos ) {
				return null;
			}
			if ( typeof s.klucz === 'string' ) {
				klucz = s.klucz;
			}
			return s;
		}

		/** Odpowiedź z adresu strony, np. ?zrodlo=email albo ?branza=doradca (gdy nie ma zapamiętanej). */
		function zAdresu() {
			let parametry;
			try {
				parametry = new URLSearchParams( window.location.search );
			} catch ( e ) {
				return;
			}
			korzen.querySelectorAll( '.mp-ank__pytanie[data-z-adresu]' ).forEach( function ( q ) {
				const v = parametry.get( q.dataset.zAdresu );
				if ( ! v || wartosc( q ) !== null ) {
					return;
				}
				const opcja = Array.from( q.querySelectorAll( '.mp-ank__opcje input' ) ).find( ( i ) => i.value === v );
				if ( opcja ) {
					opcja.checked = true;
				} else if ( q.querySelector( 'input[type="text"], input[type="email"]' ) && ! q.querySelector( '.mp-ank__opcje' ) ) {
					q.querySelector( 'input' ).value = v.slice( 0, 190 );
				}
			} );
		}

		/* ---------- Wysyłka ---------- */

		function zbierz() {
			odswiez();
			const odp = {};
			kroki.forEach( function ( krok ) {
				if ( ! krok.dataset.widoczny ) {
					return;
				}
				pytaniaKroku( krok ).forEach( function ( q ) {
					if ( q.hidden || q.dataset.typ === 'info' ) {
						return;
					}
					const w = wartosc( q );
					if ( w === null ) {
						return;
					}
					odp[ q.dataset.id ] = w;
					if ( [].concat( w ).indexOf( INNE ) !== -1 ) {
						odp[ q.dataset.id + INNE ] = tekstInne( q );
					}
				} );
			} );
			return odp;
		}

		function ustawWysylanie( tak ) {
			wysyla = tak;
			formularz.classList.toggle( 'mp-ank--wysyla', tak );
			dalej.disabled = tak;
			wstecz.disabled = tak;
			dalej.querySelector( 'span' ).textContent = tak ? 'Wysyłam…' : dane.wyslij;
		}

		function pokazKomunikat( tekst ) {
			komunikat.textContent = tekst;
			komunikat.hidden = false;
			oglos( tekst );
		}

		async function wyslij() {
			ustawWysylanie( true );
			komunikat.hidden = true;
			let odp;
			try {
				odp = await window.fetch( dane.api, {
					method: 'POST',
					credentials: 'same-origin',
					headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
					body: JSON.stringify( {
						strona: dane.strona,
						ankieta: dane.ankieta,
						odpowiedzi: zbierz(),
						klucz,
						czas: Date.now() - start,
						www: formularz.elements.www ? formularz.elements.www.value : '',
						adres: window.location.href,
					} ),
				} );
			} catch ( e ) {
				ustawWysylanie( false );
				pokazKomunikat( 'Brak połączenia. Sprawdź internet i spróbuj ponownie. Odpowiedzi są zapamiętane.' );
				return;
			}
			let json = null;
			if ( ( odp.headers.get( 'content-type' ) || '' ).indexOf( 'json' ) !== -1 ) {
				try {
					json = await odp.json();
				} catch ( e ) {
					json = null;
				}
			}
			if ( odp.ok && json && json.ok ) {
				pokazSukces( json );
				return;
			}
			ustawWysylanie( false );
			if ( json && json.code === 'pola' && json.data && json.data.pola ) {
				pokazBledySerwera( json.data.pola );
				return;
			}
			pokazKomunikat( json && json.message ? json.message : 'Serwer odpowiedział nietypowo. Spróbuj ponownie za chwilę. Odpowiedzi są zapamiętane.' );
		}

		function pokazBledySerwera( pola ) {
			let pierwszy = null;
			Object.keys( pola ).forEach( function ( klucz_ ) {
				const q = korzen.querySelector( '.mp-ank__pytanie[data-n="' + klucz_.replace( /\D/g, '' ) + '"]' );
				if ( q ) {
					pokazBlad( q, pola[ klucz_ ] );
					if ( ! pierwszy ) {
						pierwszy = q;
					}
				}
			} );
			if ( pierwszy ) {
				const krok = kroki.indexOf( pierwszy.closest( '.mp-ank__krok' ) );
				pokazKrok( krok, false );
				fokusNaBlad( pierwszy );
			} else {
				pokazKomunikat( 'Popraw zaznaczone pola.' );
			}
		}

		function pokazSukces( json ) {
			usunSzkic();
			const tekst = sukces.querySelector( '.mp-ank__sukces-tekst' );
			if ( tekst ) {
				tekst.textContent = tekst.dataset.wzor.split( '{email}' ).join( json.email || 'podany adres' );
			}
			formularz.hidden = true;
			sukces.hidden = false;
			przewin();
			const naglowek = sukces.querySelector( '.mp-ank__naglowek' );
			naglowek.focus( { preventScroll: true } );
			oglos( naglowek.textContent );
			zdarzenia();
		}

		/** Pomiar: dataLayer zawsze, GA4 i piksel Meta tylko wtedy, gdy są na stronie (po zgodzie na ciasteczka). */
		function zdarzenia() {
			window.dataLayer = window.dataLayer || [];
			window.dataLayer.push( { event: 'mp_ankieta_wyslana', mp_ankieta: dane.ankieta } );
			const z = dane.zdarzenia || {};
			try {
				if ( z.ga4 && typeof window.gtag === 'function' ) {
					window.gtag( 'event', z.ga4, { form_id: dane.ankieta } );
				}
				if ( z.meta && typeof window.fbq === 'function' ) {
					window.fbq( 'track', z.meta, { content_name: dane.ankieta } );
				}
			} catch ( e ) {
				// skrypt pomiaru nie może zepsuć podziękowania
			}
			korzen.dispatchEvent( new window.CustomEvent( 'mp:ankieta-wyslana', { bubbles: true, detail: { ankieta: dane.ankieta } } ) );
		}

		/* ---------- Zdarzenia formularza ---------- */

		formularz.addEventListener( 'submit', function ( e ) {
			e.preventDefault();
			if ( wysyla ) {
				return;
			}
			odswiez();
			const bledy = bledyKroku( kroki[ biezacy ] );
			if ( bledy.length ) {
				fokusNaBlad( bledy[ 0 ] );
				return;
			}
			const nastepny = sasiedni( 1 );
			if ( nastepny !== -1 ) {
				pokazKrok( nastepny, true );
				zapiszSzkic();
				return;
			}
			wyslij();
		} );

		wstecz.addEventListener( 'click', function () {
			const poprzedni = sasiedni( -1 );
			if ( poprzedni !== -1 ) {
				pokazKrok( poprzedni, true );
			}
		} );

		formularz.addEventListener( 'change', function ( e ) {
			const pole = e.target;
			// „Nic z tych rzeczy” i podobne opcje wykluczają pozostałe.
			if ( pole.type === 'checkbox' && pole.checked && pole.closest( '.mp-ank__opcje' ) ) {
				const grupa = pole.closest( '.mp-ank__opcje' ).querySelectorAll( 'input[type="checkbox"]' );
				grupa.forEach( function ( inny ) {
					if ( inny !== pole && ( pole.hasAttribute( 'data-sam' ) || inny.hasAttribute( 'data-sam' ) ) ) {
						inny.checked = false;
					}
				} );
			}
			const q = pole.closest( '.mp-ank__pytanie' );
			odswiez();
			aktualizujPostep();
			if ( q && q.classList.contains( 'mp-ank__pytanie--blad' ) ) {
				pokazBlad( q, blad( q ) );
			}
			const inne = q ? q.querySelector( '.mp-ank__inne' ) : null;
			if ( inne && ! inne.hidden && pole.value === INNE && pole.checked ) {
				inne.focus();
			}
			zapiszSzkic();
		} );

		formularz.addEventListener( 'input', function ( e ) {
			const q = e.target.closest( '.mp-ank__pytanie' );
			if ( q && q.classList.contains( 'mp-ank__pytanie--blad' ) && ! blad( q ) ) {
				pokazBlad( q, '' );
			}
			zapiszSzkic();
		} );

		korzen.querySelector( '.mp-ank__od-nowa' ).addEventListener( 'click', function () {
			usunSzkic();
			formularz.reset();
			klucz = losowy();
			przywrocone.hidden = true;
			zAdresu();
			odswiez();
			pytaniaKroku( korzen ).forEach( ( q ) => pokazBlad( q, '' ) );
			pokazKrok( Math.max( 0, kroki.findIndex( ( k ) => k.dataset.widoczny ) ), true );
		} );

		/* ---------- Start ---------- */

		const szkic = wczytajSzkic();
		zAdresu();
		odswiez();
		let pierwszy = kroki.findIndex( ( k ) => k.dataset.widoczny );
		if ( szkic ) {
			przywrocone.hidden = false;
			if ( typeof szkic.k === 'number' && kroki[ szkic.k ] && kroki[ szkic.k ].dataset.widoczny ) {
				pierwszy = szkic.k;
			}
		}
		pokazKrok( Math.max( 0, pierwszy ), false );
	}

	function start() {
		document.querySelectorAll( '[data-mp-ank]' ).forEach( uruchom );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', start );
	} else {
		start();
	}
} )();
