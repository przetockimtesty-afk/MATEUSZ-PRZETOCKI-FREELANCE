// Wspólne środowisko dla skryptów w Node: udaje przeglądarkę (jsdom), żeby działały
// pakiety @wordpress/blocks i @wordpress/block-library, i rejestruje bloki core.
const { JSDOM, VirtualConsole } = require('jsdom');

const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
	url: 'https://mateuszprzetocki.pl/',
	pretendToBeVisual: true,
	virtualConsole: new VirtualConsole(), // ciche błędy CSS z bibliotek edytora
});
const g = globalThis;
g.window = dom.window;
g.document = dom.window.document;
for (const k of ['Node', 'Element', 'HTMLElement', 'DocumentFragment', 'DOMParser', 'MutationObserver', 'getComputedStyle', 'CustomEvent', 'Event', 'KeyboardEvent', 'MouseEvent', 'Range', 'Selection', 'NodeFilter', 'HTMLTemplateElement', 'SVGElement']) {
	if (dom.window[k] && !g[k]) g[k] = dom.window[k];
}
try { Object.defineProperty(g, 'navigator', { value: dom.window.navigator, configurable: true }); } catch (e) {}
g.requestAnimationFrame = (cb) => setTimeout(cb, 0);
g.cancelAnimationFrame = (id) => clearTimeout(id);
dom.window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
g.matchMedia = dom.window.matchMedia;
g.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
g.IntersectionObserver = g.ResizeObserver;
dom.window.ResizeObserver = g.ResizeObserver;

const cicho = () => {};
const konsola = { log: console.log, warn: console.warn, error: console.error, info: console.info };
console.info = cicho;
console.warn = cicho;
console.log = cicho;

const blocks = require('@wordpress/blocks');
require('@wordpress/block-library').registerCoreBlocks();

// Blok „Rezerwacja terminu” z własnej wtyczki MP Rezerwacje: rysuje go PHP na serwerze, w treści jest tylko komentarz z atrybutami
const rezerwacja = require('../wtyczki/mp-rezerwacje/bloki/rezerwacja/block.json');
blocks.registerBlockType(rezerwacja.name, { ...rezerwacja, save: () => null });
// Blok „Ankieta” z wtyczki MP Ankiety: to samo, pytania są w atrybucie „definicja”
const ankieta = require('../wtyczki/mp-ankiety/bloki/ankieta/block.json');
blocks.registerBlockType(ankieta.name, { ...ankieta, save: () => null });

console.log = konsola.log;
module.exports = { blocks, konsola };
