# Table Studio — restaurant preview templates

Static Astro + Tailwind site: 3 demo styles (Classic, Modern, Café), a mobile menu page per style,
a QR menu and a printable table card. Zero cost: no backend, no database, no runtime API calls.

| Route | What |
|---|---|
| `/styles` | the 3 styles as cards (keeps `?r=` when you click through) |
| `/classic` `/modern` `/cafe` | landing page per style |
| `/classic/menu` `/modern/menu` `/cafe/menu` | mobile-first menu (what the QR opens) |
| `/qr-card?r=<slug>` | printable A5 table card (A6 works by printing 2-up / scaling) |

Every page: `noindex`, visible "Pré-visualização" banner, PT (default) / EN toggle.

## Run locally
```bash
npm install
npm run dev          # http://localhost:4321/classic?r=tasca-exemplo
npm run build        # static output in dist/
npm run preview
```

## How the restaurant name gets filled in
`/classic?r=<slug>` → the page script (`src/scripts/app.ts`) looks the slug up in
`src/data/restaurants.json`. Unknown or missing slug → the sample restaurant for that style.
If the slug is not in the JSON, the page uses the sample's phone/address/menu and only the **name** is
taken from the URL: `?r=casa-do-ze` shows "Casa Do Ze", or `?n=Casa%20do%20Zé` shows the exact
spelling (max 60 characters). No JSON edit needed. The name is inserted with `textContent` only
(never `innerHTML`), so it can't run as HTML/script.
Translations: `src/i18n/translations.ts`.

## Add a new restaurant
1. Open `src/data/restaurants.json` and copy an entry.
2. Change `slug` (lowercase, hyphens, unique), `name`, `address`, `phone`, `whatsapp`
   (digits only, with country code, e.g. `351912345678`), `email`, `hours`, `mapLink`, `colourAccent`
   (`#rrggbb`) and `style` (`classic`/`modern`/`cafe`).
3. Edit `menu`: categories → items (`name`, `description`, `price` as a number like `12.5`;
   `null` shows "—"). Each text is `{ "pt": "...", "en": "..." }`.
4. Keep `"menuIsSample": true` until the owner has confirmed the menu, then set `false`
   (this hides the "Ementa de exemplo" label).
5. Leave `allergens` as `""`. **The owner is responsible for filling it in.** Text there is shown under the item.
6. Commit and push. Preview link: `https://preview.tablestudio.in/classic?r=<slug>`.

Photos: all in `public/placeholders/` (Unsplash placeholders, see `CREDITS.md`). Replace the
`<style>-1..4.webp` files to change them (1200 px wide WebP recommended).

## Deploy on Cloudflare Pages (from GitHub)
1. Push this folder to a GitHub repo.
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → pick the repo.
3. Build settings: framework preset **Astro**, build command `npm run build`, output directory `dist`,
   env var `NODE_VERSION` = `20`.
4. **Save and Deploy**. You get `<project>.pages.dev`.

## Custom domain: preview.tablestudio.in
In the Pages project: **Custom domains → Set up a custom domain** → enter `preview.tablestudio.in`.
Then choose ONE of the two options (registrar is not Cloudflare):

**Option A: CNAME only (simplest, keeps DNS at your registrar)**
1. At your registrar's DNS panel for `tablestudio.in`, add:
   `Type CNAME` · `Name/Host: preview` · `Target/Value: <project>.pages.dev` · TTL auto/3600.
2. Back in Cloudflare click **Check DNS / Activate domain**. HTTPS is issued automatically (a few minutes).

**Option B: move DNS to Cloudflare (free plan)**
1. Cloudflare → **Add a site** → `tablestudio.in` → Free plan. Review the imported DNS records.
2. Cloudflare shows two nameservers (e.g. `xxx.ns.cloudflare.com`). In your registrar, replace the
   domain's nameservers with those two. (.in domains: also fine; wait for propagation, up to 24 h.)
3. When the site shows **Active**, Cloudflare creates the `preview` CNAME for you when you add the
   custom domain in Pages (if not: DNS → add CNAME `preview` → `<project>.pages.dev`, proxied).

## Needs your input (nothing has been invented)
- Real photos of each restaurant (current ones are Unsplash placeholders).
- Real menus and prices from each owner (all sample items are "Prato de exemplo", price "—").
- Allergen info: owner-supplied only; the field is empty.
- Real phone, WhatsApp, e-mail, address, opening hours and map link per restaurant (the sample ones are fake).
- A logo, if wanted (currently the restaurant name is used as text).
- Your own studio contact/branding in the footer ("Site de demonstração por Table Studio").
- Optional: a legal/privacy note if you add forms or analytics later (none today).
- Native-speaker check of the pt-PT/English texts in `src/i18n/translations.ts`.

## Notes
- The menu is rendered by JS from the JSON (a `<noscript>` note appears without JS).
- Fonts are self-hosted (Fontsource), only the style's own font loads per page.
- Lighthouse not run yet: please run it on the deployed URL.
