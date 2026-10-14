#!/usr/bin/env node
// Content guard (§4.8): stops private infrastructure details from being published.
//
// Scans text files in src/content, src/i18n, src/config, public, and dist
// (.html .xml .txt .json .js .css), plus images. Fails on:
//   IPV4_PRIVATE      10/8, 172.16/12, 192.168/16, 100.64/10 (CGNAT/Tailscale), 169.254/16
//   IPV6_PRIVATE      ULA fc00::/7 and link-local fe80::/10
//   HOST_INTERNAL     hostnames ending .ts.net .local .lan .internal .home.arpa .localdomain
//   DENYLIST          any line of $CONTENT_DENYLIST (case-insensitive, whole token)
//   IMAGE_METADATA    JPEG/PNG in dist with EXIF/XMP metadata
//   PUBLIC_RASTER     raster images in public/ other than favicon.ico / apple-touch-icon.png
// Allowed: RFC 5737 documentation ranges, example.com/.org/.net, localhost.
//
// Findings print as `file:line RULE_ID` only, never the matched text:
// CI logs of a public repository are public.
// On SITE_ENV=production every "[TODO" in sources is reported as a warning.

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const SOURCE_DIRS = ['src/content', 'src/i18n', 'src/config', 'public'];
const SOURCE_TEXT = new Set(['.md', '.mdx', '.yaml', '.yml', '.json', '.ts', '.js', '.mjs', '.astro', '.svg', '.txt', '.css', '.html', '.xml']);
const DIST_TEXT = new Set(['.html', '.xml', '.txt', '.json', '.js', '.css']);
const RASTER = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.bmp', '.tif', '.tiff', '.ico']);
const PUBLIC_RASTER_ALLOWED = new Set(['public/favicon.ico', 'public/apple-touch-icon.png']);
const SITE_ENV = process.env.SITE_ENV || 'development';

/** @type {Array<{file: string, line: number, rule: string}>} */
const findings = [];
/** @type {Array<{file: string, line: number}>} */
const todos = [];

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const rel = (file) => relative(ROOT, file).split(sep).join('/');

// ---------- IPv4 ----------
const IPV4 = /(?<![\d.])(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?![\d.]*\d)/g;
function ipv4Private(a, b) {
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 169 && b === 254) return true;
  return false;
}
function hasPrivateIpv4(line) {
  for (const m of line.matchAll(IPV4)) {
    const octets = m.slice(1, 5).map(Number);
    if (octets.some((o) => o > 255)) continue;
    if (ipv4Private(octets[0], octets[1])) return true;
  }
  return false;
}

// ---------- IPv6 (ULA fc00::/7, link-local fe80::/10) ----------
const IPV6 = /(?<![0-9a-f:])(f[c-d][0-9a-f]{2}|fe[89ab][0-9a-f])(?::[0-9a-f]{0,4}){2,7}(?![0-9a-f:])/gi;
function hasPrivateIpv6(line) {
  for (const m of line.matchAll(IPV6)) {
    // Must look like an address: at least two colons and a "::" or 4+ groups.
    const text = m[0];
    const groups = text.split(':').length;
    if (text.includes('::') || groups >= 4) return true;
  }
  return false;
}

// ---------- internal hostnames ----------
const HOST_INTERNAL = /(?<![\w.-])(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:ts\.net|local|lan|internal|home\.arpa|localdomain)(?![\w-]|\.[a-z0-9])/gi;
function hasInternalHost(line) {
  for (const m of line.matchAll(HOST_INTERNAL)) {
    const host = m[0].toLowerCase();
    // Ignore code-like member access such as `obj.internal(` or `x.local =`.
    const after = line.slice(m.index + m[0].length, m.index + m[0].length + 2);
    if (/^\s*[(=]/.test(after)) continue;
    if (/^(?:www\.)?example\.(?:com|org|net)$/.test(host)) continue;
    return true;
  }
  return false;
}

// ---------- denylist ----------
const denylist = (process.env.CONTENT_DENYLIST || '')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((term) => new RegExp(`(?<![A-Za-z0-9_-])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9_-])`, 'i'));

function scanText(file) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    const at = { file: rel(file), line: i + 1 };
    if (hasPrivateIpv4(line)) findings.push({ ...at, rule: 'IPV4_PRIVATE' });
    if (hasPrivateIpv6(line)) findings.push({ ...at, rule: 'IPV6_PRIVATE' });
    if (hasInternalHost(line)) findings.push({ ...at, rule: 'HOST_INTERNAL' });
    if (denylist.some((re) => re.test(line))) findings.push({ ...at, rule: 'DENYLIST' });
  });
  return lines;
}

// ---------- image metadata (byte-marker check) ----------
const MARKERS = {
  jpeg: [Buffer.from('Exif\0\0', 'latin1'), Buffer.from('http://ns.adobe.com/xap/1.0/', 'latin1')],
  png: [Buffer.from('eXIf', 'latin1'), Buffer.from('XML:com.adobe.xmp', 'latin1'), Buffer.from('Raw profile type exif', 'latin1')],
};
function hasImageMetadata(file) {
  const buf = readFileSync(file);
  const ext = extname(file).toLowerCase();
  const kind = ext === '.png' ? 'png' : ext === '.jpg' || ext === '.jpeg' ? 'jpeg' : null;
  return kind ? MARKERS[kind].some((m) => buf.includes(m)) : false;
}

// ---------- run ----------
for (const dir of SOURCE_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const ext = extname(file).toLowerCase();
    const r = rel(file);
    if (dir === 'public' && RASTER.has(ext) && !PUBLIC_RASTER_ALLOWED.has(r)) {
      findings.push({ file: r, line: 0, rule: 'PUBLIC_RASTER' });
    }
    if (!SOURCE_TEXT.has(ext)) continue;
    const lines = scanText(file);
    if (dir !== 'public') {
      lines.forEach((line, i) => {
        if (line.includes('[TODO')) todos.push({ file: r, line: i + 1 });
      });
    }
  }
}

const distDir = join(ROOT, 'dist');
let distFiles = 0;
if (existsSync(distDir)) {
  for (const file of walk(distDir)) {
    const ext = extname(file).toLowerCase();
    if (DIST_TEXT.has(ext)) {
      scanText(file);
      distFiles++;
    } else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      if (hasImageMetadata(file)) findings.push({ file: rel(file), line: 0, rule: 'IMAGE_METADATA' });
      distFiles++;
    }
  }
} else {
  console.warn('content-guard: dist/ not found; scanned sources only.');
}

const seen = new Set();
const unique = findings.filter((f) => {
  const key = `${f.file}:${f.line}:${f.rule}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

if (SITE_ENV === 'production' && todos.length) {
  console.warn(`content-guard: ${todos.length} [TODO] placeholder(s) left (warning, not an error):`);
  for (const t of todos) console.warn(`  warning ${t.file}:${t.line} TODO`);
}

if (unique.length) {
  console.error(`content-guard: FAILED with ${unique.length} finding(s). Matched text is not printed.`);
  for (const f of unique) console.error(`  ${f.file}:${f.line} ${f.rule}`);
  process.exit(1);
}

console.log(
  `content-guard: OK (${SOURCE_DIRS.join(', ')} + ${distFiles} dist files; denylist ${denylist.length ? `${denylist.length} entries` : 'not set'})`,
);
