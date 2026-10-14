# Lab: adding a tool

The lab hosts small live tools backed by Cloudflare Pages Functions. Each tool
is self-contained and works the same on test and production. The starter tool
is `edge-echo` (`src/lab/edge-echo/README.md`).

A tool is **one folder + one Function file + one registry entry**. No new page
files: `src/pages/lab/[tool].astro` and `src/pages/tr/lab/[tool].astro` build
their routes from the registry and render `src/lab/<slug>/Tool.astro`.

## Steps

1. **Folder** `src/lab/<slug>/`:
   - `meta.ts`: exports a `LabTool` (`slug`, `title`, `summary` and
     `howItWorks` in `en` and `tr`, `status: 'live' | 'experimental'`,
     `apiPath`). Keep tool-specific UI strings here too.
   - `Tool.astro`: the UI. It must work **without JavaScript**: use a
     `<form method="get" action="/api/lab/<slug>">` (or `post`) so the browser
     shows the raw response when scripts are off.
   - `client.ts`: progressive enhancement, imported with
     `<script>import './client.ts';</script>` in `Tool.astro`. Budget:
     **≤ 3 KB gzipped**, loaded only on that tool's page (verify-dist checks
     it). Render with `textContent`, never `innerHTML`. No `style=""`
     attributes and no inline handlers: the CSP forbids both.
   - `README.md`: what it does, its API, and what it stores (ideally nothing).
2. **Function** `functions/api/lab/<slug>.ts`: export `onRequest` (or
   `onRequestGet` etc.). Return `405` with an `Allow` header for unsupported
   methods. Never return or log visitor IPs or personal data. The shared
   middleware `functions/api/_middleware.ts` adds the security headers,
   `Cache-Control: no-store` and `X-Robots-Tag: noindex`.
3. **Registry** `src/lab/registry.ts`: import the tool's `meta` and add it to
   `registry`.

## Rules

- Functions run only for `/api/*` (`public/_routes.json`), so static pages
  never use the free Functions quota. Don't add middleware at the root of
  `functions/`.
- Configuration lives in Pages variables per environment (Production /
  Preview), never in the repository. Locally, copy `.dev.vars.example` to
  `.dev.vars` (gitignored).
- Secrets: Pages → Settings → Variables and Secrets → **Secret**.
  ⚠ `wrangler pages dev` lists the bindings it loaded. Check that secret
  values show as `(hidden)` before sharing any terminal output.
- No Wrangler config file with `pages_build_output_dir`: it would become the
  source of truth and lock the dashboard variables. Ask first if you think one
  is needed.

## Local development

```bash
cp .dev.vars.example .dev.vars
npm run build:site        # astro build only; or npm run build for the full pipeline
npm run preview           # wrangler pages dev dist → http://localhost:8788
curl -s http://localhost:8788/api/lab/edge-echo
```

`npm run dev` (Astro's dev server) serves pages but not Functions; use
`npm run preview` for the lab.
