/**
 * Client script shared by every page.
 *  1. reads ?r=<slug>, looks it up in restaurants.json (unknown -> name from URL, other details from sample)
 *  2. fills the page. SECURITY: the only URL-derived value is the display name, sanitised and
 *     inserted via textContent. Everything else comes from the JSON.
 *  3. PT/EN toggle, menu tabs, QR code.
 */
import restaurants from '../data/restaurants.json';
import { translations, type Lang } from '../i18n/translations';

type L10n = { pt: string; en: string };
type Item = { name: L10n; description: L10n; price: number | null; allergens: string };
type Restaurant = (typeof restaurants)[number];

const pageStyle = document.body.dataset.style ?? 'neutral';

// --- 1. lookup ---------------------------------------------------------------------
// Priority: known slug in restaurants.json -> full data from JSON.
// Otherwise a *name only* may come from the URL (?r=my-place or ?n=Casa%20do%20Zé);
// phone, address, menu etc. stay those of the sample, so nothing else changes.
// SECURITY: the name is plain text, length-limited, stripped of control characters and
// only ever inserted with textContent, so it can never run as HTML or script.
const params = new URLSearchParams(location.search);
const requested = params.get('r');
const found = restaurants.find((x) => x.slug === requested);
const sample = restaurants.find((x) => x.style === pageStyle) ?? restaurants[0];

const clean = (v: string) => v.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
const prettify = (slug: string) => slug.split('-').filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
let customName = '';
let qs = ''; // query string re-used on internal links and in the QR code
if (found) {
  qs = '?r=' + encodeURIComponent(found.slug);
} else if (params.get('n') && clean(params.get('n')!)) {
  customName = clean(params.get('n')!);
  qs = '?n=' + encodeURIComponent(customName);
} else if (requested && /^[a-z0-9]+(-[a-z0-9]+)*$/i.test(requested) && requested.length <= 60) {
  customName = prettify(requested);
  qs = '?r=' + encodeURIComponent(requested);
}
const r: Restaurant = found ?? (customName ? { ...sample, name: customName } : sample);

let lang: Lang = r.defaultLang === 'en' ? 'en' : 'pt';
try {
  const saved = localStorage.getItem('lang');
  if (saved === 'pt' || saved === 'en') lang = saved;
} catch { /* storage blocked: ignore */ }

const eur = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
const digits = (s: string) => s.replace(/\D/g, '');
const loc = (v: string | L10n) => (typeof v === 'string' ? v : v[lang]);
const el = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel);
const all = (sel: string) => document.querySelectorAll<HTMLElement>(sel);

function make<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

// --- 2. fill ----------------------------------------------------------------------
function fillText() {
  const t = translations[lang];
  document.documentElement.lang = lang === 'pt' ? 'pt-PT' : 'en';
  all('[data-t]').forEach((n) => {
    const k = n.dataset.t as keyof typeof t;
    if (t[k]) n.textContent = t[k];
  });
  const fields: Record<string, string> = {
    name: r.name, address: r.address, city: r.city, cuisine: loc(r.cuisine),
    phone: r.phone, email: r.email,
  };
  all('[data-f]').forEach((n) => { n.textContent = fields[n.dataset.f!] ?? ''; });

  const tel = 'tel:' + r.phone.replace(/[^\d+]/g, '');
  const wa = 'https://wa.me/' + digits(r.whatsapp);
  const links: Record<string, string> = {
    tel,
    wa,
    'wa-book': wa + '?text=' + encodeURIComponent(t.reserveMsg),
    mail: 'mailto:' + r.email,
    map: r.mapLink,
  };
  all('[data-href]').forEach((n) => n.setAttribute('href', links[n.dataset.href!] ?? '#'));

  // keep ?r=<slug> (taken from JSON, not from the URL) on internal links
  all('[data-nav]').forEach((n) => {
    n.setAttribute('href', n.dataset.nav! + qs);
  });

  // Table Studio's own WhatsApp (landing page only): number is fixed, only the message language changes
  all('[data-studio-wa]').forEach((n) => n.setAttribute('href', 'https://wa.me/918724014050?text=' + encodeURIComponent(t.sWaMsg)));

  const toggle = el('#lang-toggle');
  if (toggle) toggle.setAttribute('aria-label', t.langLabel);
  if (!document.body.dataset.keepTitle) document.title = `${r.name} — ${pageStyle === 'neutral' ? t.stylesTitle : t.preview}`;

  // accent colour (validated hex from JSON only)
  if (/^#[0-9a-f]{6}$/i.test(r.colourAccent)) document.documentElement.style.setProperty('--accent', r.colourAccent);

  const flag = el('#sample-flag');
  if (flag) flag.hidden = !r.menuIsSample;

  renderHours();
  renderMenu();
}

function renderHours() {
  const dl = el('#hours-list');
  if (!dl) return;
  dl.replaceChildren();
  for (const h of r.hours) {
    dl.append(make('dt', undefined, loc(h.days)), make('dd', undefined, loc(h.open as string | L10n)));
  }
}

function renderMenu() {
  const root = el('#menu-root');
  const tabs = el('#menu-tabs');
  if (!root || !tabs) return;
  const t = translations[lang];
  root.replaceChildren();
  tabs.replaceChildren();
  r.menu.forEach((cat, i) => {
    const id = 'cat-' + i;
    const a = make('a', 'tab', loc(cat.category));
    a.setAttribute('href', '#' + id);
    a.dataset.id = id;
    tabs.append(a);

    const sec = make('section', 'cat');
    sec.id = id;
    sec.append(make('h3', 'cat-title', loc(cat.category)));
    const ul = make('ul', 'items');
    for (const it of cat.items as Item[]) {
      const li = make('li', 'item');
      const head = make('div', 'item-head');
      head.append(make('span', 'item-name', loc(it.name)));
      head.append(make('span', 'item-dots'));
      head.append(make('span', 'item-price', it.price ? eur.format(it.price) : '—'));
      li.append(head);
      const d = loc(it.description);
      if (d) li.append(make('p', 'item-desc', d));
      if (it.allergens) li.append(make('p', 'item-all', `${t.allergensLabel}: ${it.allergens}`));
      ul.append(li);
    }
    sec.append(ul);
    root.append(sec);
  });
  setupTabs();
}

// --- tabs: smooth scroll + highlight the category in view -------------------------
let observer: IntersectionObserver | undefined;
function setupTabs() {
  observer?.disconnect();
  const links = [...document.querySelectorAll<HTMLAnchorElement>('.tab')];
  let scrollTabs = false;
  const mark = (id: string) => links.forEach((a) => {
    const on = a.dataset.id === id;
    on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
    // centre the active tab horizontally inside the tab strip only (never scroll the page)
    if (on && scrollTabs) { const bar = a.parentElement!; bar.scrollTo({ left: a.offsetLeft - (bar.clientWidth - a.offsetWidth) / 2, behavior: 'smooth' }); }
  });
  links.forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById(a.dataset.id!)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    mark(a.dataset.id!);
  }));
  if (links[0]) mark(links[0].dataset.id!);
  scrollTabs = true;
  observer = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) mark(e.target.id);
  }, { rootMargin: '-20% 0px -70% 0px' });
  document.querySelectorAll('.cat').forEach((c) => observer!.observe(c));
}

// --- QR (loaded lazily, only on pages with #qr-img) -------------------------------
async function renderQr() {
  const img = el<HTMLImageElement>('#qr-img');
  if (!img) return;
  const style = found ? found.style : pageStyle === 'neutral' ? 'classic' : pageStyle;
  const url = `${location.origin}/${style}/menu` + qs;
  const QR = (await import('qrcode')).default;
  img.src = await QR.toDataURL(url, { width: 600, margin: 1, errorCorrectionLevel: 'M' });
  img.alt = `QR code → ${url}`;
}

// --- 3. wire up -------------------------------------------------------------------
el('#lang-toggle')?.addEventListener('click', () => {
  lang = lang === 'pt' ? 'en' : 'pt';
  try { localStorage.setItem('lang', lang); } catch { /* ignore */ }
  fillText();
});
el('#print-btn')?.addEventListener('click', () => window.print());

fillText();
renderQr();
