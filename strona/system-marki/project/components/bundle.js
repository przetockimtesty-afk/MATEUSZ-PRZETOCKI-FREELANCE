/* @ds-bundle: {"format":4,"namespace":"MP","components":[{"name":"Button"},{"name":"ArrowLink"},{"name":"Eyebrow"},{"name":"Accent"},{"name":"Tag"},{"name":"Icon"},{"name":"IconCircle"},{"name":"Card"},{"name":"BranchCard"},{"name":"PackageCard"},{"name":"TrustBar"},{"name":"ProcessStep"},{"name":"FaqItem"},{"name":"CtaBand"},{"name":"Logo"},{"name":"SiteHeader"},{"name":"Breadcrumbs"},{"name":"SiteFooter"},{"name":"MobileCtaBar"},{"name":"PhoneFrame"},{"name":"LaptopFrame"}]} */
/* Ikony: Lucide (https://lucide.dev), licencja ISC, Copyright (c) Lucide Icons and Contributors. */
(function () {
  // React czytamy dopiero przy rysowaniu, więc kolejność ładowania skryptów nie ma znaczenia
  function h() { var R = window.React; return R.createElement.apply(R, arguments); }
  var ICONS = {"arrow-right": "<path d=\"M5 12h14\" /> <path d=\"m12 5 7 7-7 7\" />", "check": "<path d=\"M20 6 9 17l-5-5\" />", "plus": "<path d=\"M5 12h14\" /> <path d=\"M12 5v14\" />", "minus": "<path d=\"M5 12h14\" />", "menu": "<path d=\"M4 5h16\" /> <path d=\"M4 12h16\" /> <path d=\"M4 19h16\" />", "x": "<path d=\"M18 6 6 18\" /> <path d=\"m6 6 12 12\" />", "chevron-down": "<path d=\"m6 9 6 6 6-6\" />", "calendar-check": "<path d=\"M8 2v3\" /> <path d=\"M16 2v3\" /> <rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\" /> <path d=\"M3 9h18\" /> <path d=\"m9 15 2 2 4-4\" />", "clipboard-list": "<rect width=\"8\" height=\"4\" x=\"8\" y=\"2\" rx=\"1\" ry=\"1\" /> <path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\" /> <path d=\"M12 11h4\" /> <path d=\"M12 16h4\" /> <path d=\"M8 11h.01\" /> <path d=\"M8 16h.01\" />", "message-circle-question": "<path d=\"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719\" /> <path d=\"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3\" /> <path d=\"M12 17h.01\" />", "search": "<path d=\"m21 21-4.34-4.34\" /> <circle cx=\"11\" cy=\"11\" r=\"8\" />", "shield-check": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\" /> <path d=\"m9 12 2 2 4-4\" />", "refresh-cw": "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\" /> <path d=\"M21 3v5h-5\" /> <path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\" /> <path d=\"M8 16H3v5\" />", "life-buoy": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"m4.93 4.93 4.24 4.24\" /> <path d=\"m14.83 9.17 4.24-4.24\" /> <path d=\"m14.83 14.83 4.24 4.24\" /> <path d=\"m9.17 14.83-4.24 4.24\" /> <circle cx=\"12\" cy=\"12\" r=\"4\" />", "receipt": "<path d=\"M12 17V7\" /> <path d=\"M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8\" /> <path d=\"M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z\" />", "user": "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\" /> <circle cx=\"12\" cy=\"7\" r=\"4\" />", "image": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" ry=\"2\" /> <circle cx=\"9\" cy=\"9\" r=\"2\" /> <path d=\"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\" />", "circle-check": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"m16 9-5.5 5.5L8 12\" />", "mail": "<path d=\"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7\" /> <rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"2\" />", "video": "<path d=\"m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5\" /> <rect x=\"2\" y=\"6\" width=\"14\" height=\"12\" rx=\"2\" />", "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M12 6v6l4 2\" />", "file-text": "<path d=\"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z\" /> <path d=\"M14 2v5a1 1 0 0 0 1 1h5\" /> <path d=\"M10 9H8\" /> <path d=\"M16 13H8\" /> <path d=\"M16 17H8\" />", "external-link": "<path d=\"M15 3h6v6\" /> <path d=\"M10 14 21 3\" /> <path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\" />", "globe": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\" /> <path d=\"M2 12h20\" />", "laptop": "<path d=\"M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z\" /> <path d=\"M20.054 15.987H3.946\" />", "smartphone": "<rect width=\"14\" height=\"20\" x=\"5\" y=\"2\" rx=\"2\" ry=\"2\" /> <path d=\"M12 18h.01\" />"};

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
