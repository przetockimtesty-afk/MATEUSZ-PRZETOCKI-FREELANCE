// Sprawdza treść w blokach tak, jak zrobi to edytor WordPressa po otwarciu strony.
// Blok „nieprawidłowy” = edytor pokaże „Ten blok zawiera nieoczekiwaną treść”.
// Użycie: node sprawdz.js plik1.html [plik2.html ...]
const fs = require('fs');
const { blocks } = require('./srodowisko');

function sprawdzListe(lista, sciezka, bledy) {
	lista.forEach((b, i) => {
		const tu = `${sciezka}/${b.name}[${i}]`;
		if (b.name === 'core/missing') bledy.push({ tu, problem: 'nieznany blok' });
		if (b.name === 'core/freeform' && (b.originalContent || '').trim()) bledy.push({ tu, problem: 'HTML poza blokiem (klasyczny edytor)' });
		if (b.isValid === false) {
			const problemy = (b.validationIssues || []).map((x) => (x.args || []).map(String).join(' ').slice(0, 700));
			bledy.push({ tu, problem: problemy.join('\n      ') || 'nieprawidłowy' });
		}
		if (b.innerBlocks && b.innerBlocks.length) sprawdzListe(b.innerBlocks, tu, bledy);
	});
}

let lacznie = 0;
for (const plik of process.argv.slice(2)) {
	const lista = blocks.parse(fs.readFileSync(plik, 'utf8'));
	const bledy = [];
	sprawdzListe(lista, '', bledy);
	let liczba = 0;
	const policz = (l) => l.forEach((b) => { liczba++; policz(b.innerBlocks || []); });
	policz(lista);
	if (bledy.length) {
		lacznie += bledy.length;
		process.stdout.write(`✗ ${plik}: ${bledy.length} nieprawidłowych z ${liczba} bloków\n`);
		for (const b of bledy.slice(0, 12)) process.stdout.write(`   ${b.tu}\n      ${b.problem}\n`);
	} else {
		process.stdout.write(`✓ ${plik}: ${liczba} bloków, wszystkie poprawne\n`);
	}
}
process.exit(lacznie ? 1 : 0);
