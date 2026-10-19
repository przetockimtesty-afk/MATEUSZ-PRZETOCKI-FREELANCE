/* @ds-bundle: {"format":4,"namespace":"MP","components":[{"name":"Button"},{"name":"ArrowLink"},{"name":"Eyebrow"},{"name":"Accent"},{"name":"Tag"},{"name":"Icon"},{"name":"IconCircle"},{"name":"Card"},{"name":"BranchCard"},{"name":"PackageCard"},{"name":"TrustBar"},{"name":"ProcessStep"},{"name":"FaqItem"},{"name":"CtaBand"},{"name":"Logo"},{"name":"SiteHeader"},{"name":"Breadcrumbs"},{"name":"SiteFooter"},{"name":"MobileCtaBar"},{"name":"PhoneFrame"},{"name":"LaptopFrame"}]} */
/* Ikony: Lucide (https://lucide.dev), licencja ISC, Copyright (c) Lucide Icons and Contributors. */
(function () {
  // React czytamy dopiero przy rysowaniu, więc kolejność ładowania skryptów nie ma znaczenia
  function h() { var R = window.React; return R.createElement.apply(R, arguments); }
  var ICONS = __ICONS__;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(' ');
  }
  function rest(p, keys) {
    var o = {};
    for (var k in p) if (Object.prototype.hasOwnProperty.call(p, k) && keys.indexOf(k) === -1) o[k] = p[k];
    return o;
  }
  function has(v) { return v !== undefined && v !== null && v !== false; }
  function asLink(t) { return typeof t === 'string' ? { label: t } : t; }

  function Icon(p) {
    var size = p.size || 24;
    return h('svg', {
      className: cx('mp-icon', p.className),
      width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      strokeWidth: p.strokeWidth || 1.5, strokeLinecap: 'round', strokeLinejoin: 'round',
      role: p.label ? 'img' : undefined, 'aria-label': p.label || undefined, 'aria-hidden': p.label ? undefined : 'true',
      focusable: 'false',
      dangerouslySetInnerHTML: { __html: ICONS[p.name] || '' }
    });
  }
  Icon.names = Object.keys(ICONS);

  function Button(p) {
    var variant = p.variant || 'primary';
    var props = rest(p, ['variant', 'size', 'arrow', 'full', 'className', 'children', 'href', 'type']);
    props.className = cx('mp-btn', 'mp-btn-' + variant, p.size === 'sm' && 'mp-btn-sm', p.full && 'mp-btn-full', p.className);
    var kids = [p.children, p.arrow ? h(Icon, { key: 'a', name: 'arrow-right', size: 18, className: 'mp-btn-arrow' }) : null];
    if (p.href) { props.href = p.href; return h.apply(null, ['a', props].concat(kids)); }
    props.type = p.type || 'button';
    return h.apply(null, ['button', props].concat(kids));
  }

  function ArrowLink(p) {
    var props = rest(p, ['className', 'children']);
    props.className = cx('mp-link', p.className);
    if (!props.href) props.href = '#';
    return h('a', props, h('span', null, p.children), h(Icon, { name: 'arrow-right', size: 16 }));
  }

  function Eyebrow(p) {
    return h('div', { className: cx('mp-eyebrow', p.dot === false && 'mp-eyebrow-bez-kropki', p.className) }, p.children);
  }

  function Accent(p) {
    return h('span', { className: cx('mp-accent', p.className) }, p.children);
  }

  function Tag(p) {
    return h('span', { className: cx('mp-tag', 'mp-tag-' + (p.tone || 'blue'), p.className) }, p.children);
  }

  function IconCircle(p) {
    return h('span', { className: cx('mp-icon-circle', p.className) }, h(Icon, { name: p.name, size: 24, label: p.label }));
  }

  function Card(p) {
    var props = rest(p, ['className', 'children', 'as', 'tone']);
    props.className = cx('mp-card', p.tone && 'mp-card-' + p.tone, p.className);
    return h(p.as || 'div', props, p.children);
  }

  function BranchCard(p) {
    var tags = p.tags || [];
    return h('article', { className: cx('mp-card', 'mp-branch', p.className) },
      h('div', { className: 'mp-branch-nr' }, [p.number, p.category].filter(Boolean).join(' · ')),
      h('h3', { className: 'mp-card-title' }, p.title),
      p.text ? h('p', { className: 'mp-card-text' }, p.text) : null,
      tags.length ? h('div', { className: 'mp-tags' }, tags.map(function (t, i) { return h(Tag, { key: i }, t); })) : null,
      p.linkLabel ? h(ArrowLink, { href: p.href || '#' }, p.linkLabel) : null);
  }

  function PackageCard(p) {
    var items = p.items || [];
    return h('article', { className: cx('mp-card', 'mp-package', p.recommended && 'mp-package-recommended', p.className) },
      p.recommended ? h(Tag, { tone: 'black', className: 'mp-package-badge' }, p.recommendedLabel || 'Polecam') : null,
      h('h3', { className: 'mp-card-title' }, p.name),
      h('div', { className: 'mp-price' }, p.price, h('small', null, ' ' + (p.currency || 'zł'))),
      p.forWhom ? h('p', { className: 'mp-package-for' }, p.forWhom) : null,
      h('ul', { className: 'mp-package-list' },
        p.includesPrevious ? h('li', { className: 'mp-package-plus' }, h(Icon, { name: 'plus', size: 18 }), h('span', null, p.includesPreviousLabel || 'Wszystko z poprzedniego pakietu, plus:')) : null,
        items.map(function (t, i) { return h('li', { key: i }, h(Icon, { name: 'check', size: 18 }), h('span', null, t)); })),
      h(Button, { variant: p.recommended ? 'primary' : 'outline', arrow: !!p.recommended, full: true, href: p.href }, p.buttonLabel || 'Wyceń stronę w 5 minut'));
  }

  function TrustBar(p) {
    var items = p.items || [];
    return h('section', { className: cx('mp-dark', 'mp-trust', p.className) },
      h('ul', { className: 'mp-trust-list' }, items.map(function (it, i) {
        return h('li', { key: i }, h(Icon, { name: it.icon || 'check', size: 24 }), h('span', null, it.label));
      })));
  }

  function ProcessStep(p) {
    return h('div', { className: cx('mp-step', p.className) },
      h('span', { className: 'mp-step-nr' }, p.number),
      h('h3', { className: 'mp-step-title' }, p.title),
      p.text ? h('p', { className: 'mp-step-text' }, p.text) : null);
  }

  function FaqItem(p) {
    var answer = has(p.children) ? p.children : p.answer;
    return h('details', { className: cx('mp-faq', p.className), open: p.open || undefined },
      h('summary', null, h('span', null, p.question), h(Icon, { name: 'plus', size: 22, className: 'mp-faq-plus' }), h(Icon, { name: 'minus', size: 22, className: 'mp-faq-minus' })),
      has(answer) ? h('div', { className: 'mp-faq-answer' }, answer) : null);
  }

  function CtaBand(p) {
    return h('div', { className: cx('mp-dark', 'mp-cta', p.className) },
      h('h2', { className: 'mp-cta-title' }, has(p.children) ? p.children : p.title),
      p.text ? h('p', { className: 'mp-cta-text' }, p.text) : null,
      h('div', { className: 'mp-actions mp-actions-center' },
        h(Button, { variant: 'accent', arrow: true, href: p.primaryHref }, p.primaryLabel || 'Wyceń stronę w 5 minut'),
        p.secondaryLabel ? h(Button, { variant: 'outline-light', href: p.secondaryHref }, p.secondaryLabel) : null));
  }

  function Logo(p) {
    return h('a', { className: cx('mp-logo', p.className), href: p.href || '#' }, p.name || 'Mateusz Przetocki', h('b', { 'aria-hidden': 'true' }));
  }

  function SiteHeader(p) {
    var items = p.items || [{ label: 'Dla kogo', menu: true }, { label: 'Oferta', menu: true }, { label: 'Realizacje' }, { label: 'O mnie' }, { label: 'Kontakt' }];
    var menuBtn = h('button', { className: 'mp-menu-btn', type: 'button', 'aria-label': 'Menu' }, h(Icon, { name: 'menu', size: 22 }));
    if (p.compact) {
      return h('header', { className: cx('mp-header', 'mp-header-compact', p.className) }, h(Logo, { href: p.logoHref }), menuBtn);
    }
    return h('header', { className: cx('mp-header', p.className) },
      h(Logo, { href: p.logoHref }),
      h('nav', { className: 'mp-nav', 'aria-label': 'Menu główne' }, items.map(function (it, i) {
        return h('a', { key: i, href: it.href || '#', className: it.current ? 'mp-nav-current' : undefined, 'aria-current': it.current ? 'page' : undefined },
          it.label, it.menu ? h(Icon, { name: 'chevron-down', size: 16 }) : null);
      })),
      h(Button, { size: 'sm', href: p.buttonHref, className: 'mp-header-btn' }, p.buttonLabel || 'Wyceń stronę'),
      menuBtn);
  }

  function Breadcrumbs(p) {
    var items = (p.items || []).map(asLink);
    return h('nav', { className: cx('mp-crumbs', p.className), 'aria-label': p.label || 'Okruszki' },
      h('ol', null, items.map(function (o, i) {
        var last = i === items.length - 1;
        return h('li', { key: i }, last ? h('span', { 'aria-current': 'page' }, o.label) : h('a', { href: o.href || '#' }, o.label));
      })));
  }

  function SiteFooter(p) {
    var columns = p.columns || [
      { title: 'Pakiety', items: ['Wizytówka · 1 200 zł', 'Wizytówka, która umawia · 1 800 zł', 'Pełny start · 2 500 zł'] },
      { title: 'Branże', items: ['Doradcy kredytowi', 'Biura rachunkowe', 'Psycholodzy i terapeuci'] },
      { title: 'Na skróty', items: ['Realizacje', 'Jak pracuję', 'O mnie', 'Pytania', 'Kontakt'] }
    ];
    var legal = p.legal || ['Mateusz Przetocki', 'adres z danych z ustawy', 'kontakt@…'];
    var links = (p.links || ['Polityka prywatności', 'Regulamin']).map(asLink);
    return h('footer', { className: cx('mp-dark', 'mp-footer', p.className) },
      h('div', { className: 'mp-footer-grid' },
        h('div', { className: 'mp-footer-intro' },
          h(Logo, { href: p.logoHref }),
          h('p', null, p.tagline || 'Strony, które odpowiadają na pytania klientów i umawiają ich na konsultację.'),
          h(Button, { variant: 'accent', size: 'sm', href: p.buttonHref }, p.buttonLabel || 'Wyceń stronę w 5 minut')),
        columns.map(function (c, i) {
          return h('div', { key: i }, h('h4', null, c.title), h('ul', null, c.items.map(asLink).map(function (o, j) { return h('li', { key: j }, h('a', { href: o.href || '#' }, o.label)); })));
        })),
      h('div', { className: 'mp-footer-bottom' },
        h('div', null, legal.map(function (t, i) { return h('span', { key: i }, t); })),
        h('div', null, links.map(function (o, i) { return h('a', { key: i, href: o.href || '#' }, o.label); }))));
  }

  function MobileCtaBar(p) {
    return h('div', { className: cx('mp-dark', 'mp-mobile-cta', p.className) },
      h(Button, { variant: 'accent', arrow: true, full: true, href: p.href }, has(p.children) ? p.children : (p.label || 'Wyceń stronę w 5 minut')));
  }

  function PhoneFrame(p) {
    // ramka skaluje się z szerokością: 300 px w pierwszym ekranie, 236 px w krokach, 150 px obok laptopa
    var w = +p.width || 300, ht = +p.height || Math.round(w * 2.04);
    var pad = Math.round(w * 0.04), rad = Math.round(w * 0.153), nw = Math.round(w * 0.28), nh = Math.round(w * 0.08), nt = Math.round(w * 0.073);
    return h('div', { className: cx('mp-phone', p.className), style: { width: w + 'px', height: ht + 'px', padding: pad + 'px', borderRadius: rad + 'px' } },
      h('span', { className: 'mp-phone-notch', 'aria-hidden': 'true', style: { top: nt + 'px', width: nw + 'px', height: nh + 'px', marginLeft: (-nw / 2) + 'px' } }),
      h('div', { className: 'mp-phone-screen', style: { borderRadius: (rad - pad) + 'px' } },
        p.demo === false ? null : h('div', { className: 'mp-phone-demo', style: { paddingTop: (nt + nh + 10 - pad) + 'px' } }, p.demoLabel || (w < 200 ? 'Demo' : 'Projekt demonstracyjny')),
        p.children));
  }

  function LaptopFrame(p) {
    return h('div', { className: cx('mp-laptop', p.className) },
      h('div', { className: 'mp-laptop-screen' },
        p.demo === false ? null : h('div', { className: 'mp-laptop-demo' }, p.demoLabel || 'Projekt demonstracyjny'),
        p.children));
  }

  var MP = { Button: Button, ArrowLink: ArrowLink, Eyebrow: Eyebrow, Accent: Accent, Tag: Tag, Icon: Icon, IconCircle: IconCircle, Card: Card, BranchCard: BranchCard, PackageCard: PackageCard, TrustBar: TrustBar, ProcessStep: ProcessStep, FaqItem: FaqItem, CtaBand: CtaBand, Logo: Logo, SiteHeader: SiteHeader, Breadcrumbs: Breadcrumbs, SiteFooter: SiteFooter, MobileCtaBar: MobileCtaBar, PhoneFrame: PhoneFrame, LaptopFrame: LaptopFrame };
  window.MP = Object.assign(window.MP || {}, MP);
})();
