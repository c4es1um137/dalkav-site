#!/usr/bin/env node
// verify-dist (§4.8): checks the built site in dist/ before it can ship.
// Usage: node scripts/verify-dist.mjs [--env production|test]
// (defaults to $SITE_ENV; "development" is checked like test).
//
// Fails on: unresolved internal links/anchors; missing page metadata or
// non-reciprocal hreflang; mailto:/email addresses; style="" attributes;
// external scripts, styles, fonts or images; broken environment invariants;
// JS/CSS budgets; invalid RSS; a _routes.json other than /api/*.
// Warns (production): leftover [TODO] and placeholder CV PDFs.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const argEnv = (() => {
  const i = process.argv.indexOf('--env');
  return i > -1 ? process.argv[i + 1] : undefined;
})();
const ENV = argEnv || process.env.SITE_ENV || 'development';
if (!['production', 'test', 'development'].includes(ENV)) {
  console.error(`verify-dist: unknown env "${ENV}"`);
  process.exit(2);
}
const isProd = ENV === 'production';
const SITE = { production: 'https://www.dalkav.uk', test: 'https://test.dalkav.uk', development: 'http://localhost:4321' }[ENV];

const BUDGET = { siteJs: 5 * 1024, toolJs: 3 * 1024, css: 35 * 1024 };

const errors = [];
const warnings = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

if (!existsSync(DIST)) {
  console.error('verify-dist: dist/ not found. Run astro build first.');
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}
const rel = (file) => relative(DIST, file).split(sep).join('/');
const files = walk(DIST);
const fileSet = new Set(files.map(rel));
const read = (r) => readFileSync(join(DIST, r), 'utf8');

/** Map a served path to a dist file the way Cloudflare Pages does. */
function resolvePath(pathname) {
  let p = decodeURIComponent(pathname).replace(/^\/+/, '');
  if (p === '') return fileSet.has('index.html') ? 'index.html' : null;
  if (fileSet.has(p)) return p;
  if (p.endsWith('/')) p = p.slice(0, -1);
  if (fileSet.has(`${p}.html`)) return `${p}.html`;
  if (fileSet.has(`${p}/index.html`)) return `${p}/index.html`;
  return null;
}

/** The served URL path of an HTML file (clean URL, no trailing slash). */
function servedPath(r) {
  if (r === 'index.html') return '/';
  return '/' + r.replace(/(?:\/index)?\.html$/, '');
}

const attr = (tag, name) => {
  const m = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(tag);
  return m ? (m[2] ?? m[3]) : undefined;
};
const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const htmlFiles = [...fileSet].filter((f) => f.endsWith('.html')).sort();
const pages = new Map();

// ---------- parse pages ----------
for (const r of htmlFiles) {
  const html = read(r);
  const tags = html.match(/<[a-zA-Z][^>]*>/g) ?? [];
  const ids = new Set();
  for (const t of tags) {
    const id = attr(t, 'id');
    if (id) ids.add(decode(id));
  }
  const meta = (key, value) =>
    tags.find((t) => /^<meta\s/i.test(t) && attr(t, key)?.toLowerCase() === value.toLowerCase());
  const links = tags.filter((t) => /^<link\s/i.test(t));
  const alternates = new Map();
  for (const l of links) {
    if (attr(l, 'rel') === 'alternate' && attr(l, 'hreflang')) alternates.set(attr(l, 'hreflang'), decode(attr(l, 'href') ?? ''));
  }
  pages.set(r, {
    html,
    tags,
    ids,
    is404: /(^|\/)404\.html$/.test(r),
    lang: /<html[^>]*\slang="([a-z-]+)"/i.exec(html)?.[1],
    title: /<title>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim(),
    description: attr(meta('name', 'description') ?? '', 'content'),
    robots: attr(meta('name', 'robots') ?? '', 'content'),
    canonical: decode(attr(links.find((l) => attr(l, 'rel') === 'canonical') ?? '', 'href') ?? ''),
    og: Object.fromEntries(
      ['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:locale'].map((k) => [k, attr(meta('property', k) ?? '', 'content')]),
    ),
    alternates,
    h1: (html.match(/<h1[\s>]/gi) ?? []).length,
  });
}

// ---------- per-page checks ----------
const servedToFile = new Map(htmlFiles.map((r) => [servedPath(r), r]));
const urlToFile = (url) => {
  try {
    const u = new URL(url);
    if (u.origin !== new URL(SITE).origin) return null;
    return servedToFile.get(u.pathname === '' ? '/' : u.pathname) ?? null;
  } catch {
    return null;
  }
};

let todoCount = 0;
for (const [r, p] of pages) {
  if (!p.lang || !['en', 'tr'].includes(p.lang)) fail(r, 'missing or invalid <html lang>');
  if (!p.title) fail(r, 'missing <title>');
  if (!p.description) fail(r, 'missing meta description');
  if (!p.canonical) fail(r, 'missing canonical');
  else if (p.canonical !== new URL(servedPath(r), SITE).href) fail(r, `canonical is not self (${p.canonical})`);
  for (const [k, v] of Object.entries(p.og)) if (!v) fail(r, `missing ${k}`);
  if (p.h1 !== 1) fail(r, `expected exactly one <h1>, found ${p.h1}`);

  // hreflang: self present, x-default present, reciprocal
  if (!p.alternates.get(p.lang)) fail(r, `hreflang="${p.lang}" (self) missing`);
  if (!p.alternates.get('x-default')) fail(r, 'hreflang="x-default" missing');
  for (const [hl, href] of p.alternates) {
    if (hl === 'x-default') {
      if (!urlToFile(href)) fail(r, 'x-default does not resolve to a page');
      continue;
    }
    const target = urlToFile(href);
    if (!target) {
      fail(r, `hreflang="${hl}" target does not resolve (${href})`);
      continue;
    }
    const back = pages.get(target);
    if (back.lang !== hl) fail(r, `hreflang="${hl}" points to a page with lang="${back.lang}"`);
    if (hl !== p.lang && back.alternates.get(p.lang) !== p.canonical) fail(r, `hreflang="${hl}" is not reciprocal`);
  }

  // style attributes and inline handlers
  for (const t of p.tags) {
    if (/\sstyle\s*=/i.test(t)) fail(r, 'style="" attribute in HTML');
    if (/\son[a-z]+\s*=/i.test(t)) fail(r, 'inline event handler attribute');
  }

  // internal links and anchors; external asset origins
  for (const t of p.tags) {
    const name = /^<([a-zA-Z0-9-]+)/.exec(t)[1].toLowerCase();
    const urls = [];
    for (const a of ['href', 'src']) {
      const v = attr(t, a);
      if (v !== undefined) urls.push({ a, v: decode(v) });
    }
    const srcset = attr(t, 'srcset');
    if (srcset) for (const part of decode(srcset).split(',')) urls.push({ a: 'srcset', v: part.trim().split(/\s+/)[0] });

    for (const { a, v } of urls) {
      if (!v) continue;
      const isAsset = name !== 'a' && !(name === 'link' && ['canonical', 'alternate'].includes(attr(t, 'rel') ?? ''));
      if (/^(?:https?:)?\/\//i.test(v)) {
        const origin = new URL(v, SITE).origin;
        if (isAsset && origin !== new URL(SITE).origin) fail(r, `external ${name} ${a} from ${origin}`);
        continue;
      }
      if (/^(?:mailto|tel|data|javascript):/i.test(v)) continue;
      const [pathPart, hash] = v.split('#');
      const targetFile = pathPart ? resolvePath(new URL(pathPart, SITE + servedPath(r)).pathname) : r;
      if (!targetFile) {
        fail(r, `broken internal ${a}: ${v}`);
        continue;
      }
      if (hash && targetFile.endsWith('.html') && !pages.get(targetFile)?.ids.has(decodeURIComponent(hash))) {
        fail(r, `broken anchor: ${v}`);
      }
    }
  }

  // environment invariants
  const banner = p.html.includes('data-test-banner');
  if (isProd) {
    if (banner) fail(r, 'TEST banner on production');
    if (p.title?.startsWith('[TEST]')) fail(r, '[TEST] title prefix on production');
    if (p.robots && (/nofollow/.test(p.robots) || (!p.is404 && /noindex/.test(p.robots)))) fail(r, `robots meta "${p.robots}" on production`);
  } else {
    if (!banner) fail(r, 'TEST banner missing on test');
    if (!p.title?.startsWith('[TEST] ')) fail(r, '"[TEST] " title prefix missing on test');
    if (p.robots !== 'noindex, nofollow') fail(r, 'robots meta "noindex, nofollow" missing on test');
  }

  todoCount += (p.html.match(/\[TODO/g) ?? []).length;
}

// ---------- email / mailto in HTML, XML, JSON ----------
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/;
for (const r of fileSet) {
  if (!/\.(html|xml|json)$/.test(r)) continue;
  const text = read(r);
  if (/mailto:/i.test(text)) fail(r, 'contains mailto:');
  if (EMAIL.test(text)) fail(r, 'contains a plain email address');
}

// ---------- CSS: external fonts/images and budget ----------
const cssFiles = [...fileSet].filter((f) => f.endsWith('.css'));
for (const r of cssFiles) {
  for (const m of read(r).matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    if (/^(?:https?:)?\/\//i.test(m[1]) && new URL(m[1], SITE).origin !== new URL(SITE).origin) fail(r, `external url() in CSS`);
  }
}

// ---------- JS and CSS budgets per page ----------
const gz = (s) => gzipSync(Buffer.from(s, 'utf8'), { level: 9 }).length;
const isToolPage = (r) => /^(?:tr\/)?lab\/[^/]+\.html$/.test(r);

function pageScripts(p) {
  const scripts = [];
  for (const m of p.html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1];
    const type = /\stype="([^"]+)"/.exec(attrs)?.[1];
    if (type && type !== 'module' && type !== 'text/javascript') continue; // JSON-LD etc.
    const src = /\ssrc="([^"]+)"/.exec(attrs)?.[1];
    if (src) {
      const f = resolvePath(new URL(src, SITE).pathname);
      scripts.push(f ? read(f) : '');
    } else {
      scripts.push(m[2]);
    }
  }
  return scripts;
}

const sharedScripts = new Set();
for (const [r, p] of pages) if (!isToolPage(r)) for (const s of pageScripts(p)) sharedScripts.add(s);

let maxSiteJs = { size: 0, page: '' };
let maxToolJs = { size: 0, page: '' };
let maxCss = { size: 0, page: '' };
for (const [r, p] of pages) {
  const scripts = pageScripts(p);
  const site = scripts.filter((s) => !isToolPage(r) || sharedScripts.has(s));
  const tool = isToolPage(r) ? scripts.filter((s) => !sharedScripts.has(s)) : [];
  const siteSize = site.length ? gz(site.join('\n')) : 0;
  const toolSize = tool.length ? gz(tool.join('\n')) : 0;
  if (siteSize > maxSiteJs.size) maxSiteJs = { size: siteSize, page: r };
  if (toolSize > maxToolJs.size) maxToolJs = { size: toolSize, page: r };
  if (siteSize > BUDGET.siteJs) fail(r, `site-wide JS ${siteSize} B gz > ${BUDGET.siteJs} B`);
  if (toolSize > BUDGET.toolJs) fail(r, `lab tool JS ${toolSize} B gz > ${BUDGET.toolJs} B`);

  let css = '';
  for (const t of p.tags) {
    if (/^<link\s/i.test(t) && attr(t, 'rel') === 'stylesheet') {
      const f = resolvePath(new URL(attr(t, 'href'), SITE).pathname);
      if (f) css += read(f);
    }
  }
  for (const m of p.html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) css += m[1];
  const cssSize = gz(css);
  if (cssSize > maxCss.size) maxCss = { size: cssSize, page: r };
  if (cssSize > BUDGET.css) fail(r, `CSS ${cssSize} B gz > ${BUDGET.css} B`);
}

// ---------- robots.txt, _headers, _routes.json, sitemap ----------
const robots = fileSet.has('robots.txt') ? read('robots.txt') : '';
if (!robots) fail('robots.txt', 'missing');
else if (isProd) {
  if (!/^Allow:\s*\/\s*$/m.test(robots) || /^Disallow:\s*\/\s*$/m.test(robots)) fail('robots.txt', 'production must allow crawling');
  if (!/^Sitemap:\s*https:\/\/www\.dalkav\.uk\/sitemap-index\.xml\s*$/m.test(robots)) fail('robots.txt', 'production must list the sitemap');
} else if (!/^Disallow:\s*\/\s*$/m.test(robots)) fail('robots.txt', 'test must be "Disallow: /"');

const headers = fileSet.has('_headers') ? read('_headers') : '';
if (!headers) fail('_headers', 'missing');
else {
  const blocks = new Map();
  let current = null;
  for (const line of headers.split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      if (blocks.has(line.trim())) fail('_headers', `duplicate rule for ${line.trim()} (Pages would drop one)`);
      current = line.trim();
      blocks.set(current, []);
    } else if (current) blocks.get(current).push(line.trim());
  }
  const global = blocks.get('/*') ?? [];
  for (const h of ['Content-Security-Policy', 'Strict-Transport-Security', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy', 'Cross-Origin-Opener-Policy', 'Cross-Origin-Resource-Policy']) {
    if (!global.some((l) => l.startsWith(`${h}:`))) fail('_headers', `/* lacks ${h}`);
  }
  if (global.some((l) => /^Strict-Transport-Security:.*(includeSubDomains|preload)/i.test(l))) fail('_headers', 'HSTS must not include includeSubDomains or preload');
  const globalRobots = global.find((l) => l.startsWith('X-Robots-Tag:'));
  if (isProd && globalRobots) fail('_headers', 'production has a global X-Robots-Tag');
  if (!isProd && globalRobots !== 'X-Robots-Tag: noindex, nofollow') fail('_headers', 'test lacks global "X-Robots-Tag: noindex, nofollow"');
  for (const pattern of ['https://:project.pages.dev/*', 'https://:version.:project.pages.dev/*']) {
    if (!(blocks.get(pattern) ?? []).includes('X-Robots-Tag: noindex')) fail('_headers', `${pattern} lacks X-Robots-Tag: noindex`);
  }
  if (!(blocks.get('/_astro/*') ?? []).some((l) => l === 'Cache-Control: public, max-age=31536000, immutable')) fail('_headers', '/_astro/* lacks immutable caching');
}

try {
  const routes = JSON.parse(read('_routes.json'));
  const ok = routes.version === 1 && JSON.stringify(routes.include) === '["/api/*"]' && Array.isArray(routes.exclude) && routes.exclude.length === 0;
  if (!ok) fail('_routes.json', 'must be {"version":1,"include":["/api/*"],"exclude":[]}');
} catch {
  fail('_routes.json', 'missing or invalid JSON');
}

for (const r of [...fileSet].filter((f) => /^sitemap-\d+\.xml$/.test(f))) {
  for (const m of read(r).matchAll(/<loc>([^<]+)<\/loc>/g)) {
    if (!urlToFile(m[1])) fail(r, `sitemap URL does not resolve to a page: ${m[1]}`);
    else if (pages.get(urlToFile(m[1])).is404) fail(r, 'sitemap lists a 404 page');
  }
}
if (!fileSet.has('sitemap-index.xml')) fail('sitemap-index.xml', 'missing');

// ---------- RSS ----------
const RFC822 = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} (GMT|[+-]\d{4})$/;
for (const [feed, lang] of [['rss.xml', 'en'], ['tr/rss.xml', 'tr']]) {
  if (!fileSet.has(feed)) {
    fail(feed, 'missing');
    continue;
  }
  const xml = read(feed);
  const channel = /<channel>([\s\S]*?)<\/channel>/.exec(xml)?.[1];
  if (!/<rss[^>]+version="2\.0"/.test(xml) || !channel) {
    fail(feed, 'not an RSS 2.0 document');
    continue;
  }
  const head = channel.replace(/<item>[\s\S]*?<\/item>/g, '');
  for (const el of ['title', 'link', 'description', 'language']) if (!new RegExp(`<${el}>[^<]+</${el}>`).test(head)) fail(feed, `channel lacks <${el}>`);
  if (!new RegExp(`<language>${lang}`).test(head)) fail(feed, `channel language is not ${lang}`);
  const self = /<atom:link\s+href="([^"]+)"\s+rel="self"/.exec(head)?.[1];
  if (!self || self !== new URL(`/${feed}`, SITE).href) fail(feed, 'atom:link rel="self" missing or wrong');
  for (const [i, item] of [...channel.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]).entries()) {
    for (const el of ['title', 'link', 'guid']) if (!new RegExp(`<${el}[^>]*>[^<]+</${el}>`).test(item)) fail(feed, `item ${i + 1} lacks <${el}>`);
    const pub = /<pubDate>([^<]+)<\/pubDate>/.exec(item)?.[1];
    if (!pub || !RFC822.test(pub)) fail(feed, `item ${i + 1} pubDate is not RFC 822`);
    const link = /<link>([^<]+)<\/link>/.exec(item)?.[1];
    if (link && !urlToFile(link)) fail(feed, `item ${i + 1} link does not resolve`);
  }
}

// ---------- production warnings ----------
if (isProd) {
  if (todoCount) warn('dist', `${todoCount} visible [TODO] placeholder(s) in pages (content-guard lists file:line)`);
  for (const r of [...fileSet].filter((f) => f.startsWith('cv/') && f.endsWith('.pdf'))) {
    if (readFileSync(join(DIST, r)).includes('DALKAV-PLACEHOLDER')) warn(r, 'placeholder CV PDF; replace before launch');
  }
}

// ---------- report ----------
const kb = (n) => `${(n / 1024).toFixed(2)} KB`;
console.log(`verify-dist (${ENV}): ${pages.size} pages, ${fileSet.size} files`);
console.log(`  site-wide JS max ${kb(maxSiteJs.size)} gz (${maxSiteJs.page}) / budget ${kb(BUDGET.siteJs)}`);
console.log(`  lab tool JS max  ${kb(maxToolJs.size)} gz (${maxToolJs.page || 'n/a'}) / budget ${kb(BUDGET.toolJs)}`);
console.log(`  CSS max          ${kb(maxCss.size)} gz (${maxCss.page}) / budget ${kb(BUDGET.css)}`);
for (const w of warnings) console.warn(`  warning ${w}`);
if (errors.length) {
  console.error(`verify-dist: FAILED with ${errors.length} error(s):`);
  for (const e of [...new Set(errors)]) console.error(`  ${e}`);
  process.exit(1);
}
console.log('verify-dist: OK');
