# dalkav-site

Bahadır's bilingual (English/Turkish) personal site: a static Astro + Tailwind
CSS v4 site on Cloudflare Pages, with a small lab of tools on Pages Functions.

- Production: https://www.dalkav.uk (branch `main`)
- Test: https://test.dalkav.uk (branch `test`, private behind Cloudflare Access)

All content is Markdown/YAML in this repository, so it can be published from
the GitHub web UI on a phone.

## Quick start

```bash
nvm use                     # Node version from .nvmrc
npm ci
npm run dev                 # http://localhost:4321 (pages only)
npm run build               # astro check + build + content guard + verify-dist
cp .dev.vars.example .dev.vars
npm run preview             # wrangler pages dev dist, with Functions, on :8788
```

Build for a specific environment: `SITE_ENV=production npm run build` or
`SITE_ENV=test npm run build`. Locally `SITE_ENV` defaults to `development`
(behaves like test).

## Documentation

| Doc | Contents |
|---|---|
| [`docs/SETUP.md`](docs/SETUP.md) | One-time setup: GitHub repo, Pages project, domains, Access, rulesets |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Environments, build pipeline, promotion, rollback, troubleshooting |
| [`docs/CONTENT.md`](docs/CONTENT.md) | Phone workflow, front-matter templates, images, privacy rules |
| [`docs/LAB.md`](docs/LAB.md) | Adding a lab tool |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Design tokens, components, motion, overrides |

## Layout

```
src/
  content.config.ts       content schemas (notes, projects, cv)
  content/                Markdown/YAML content and images
  env.ts                  SITE_ENV resolution: the single source of environment differences
  config/                 owner details, security headers
  i18n/                   UI strings (en.json, tr.json) and helpers
  lib/                    content queries, bento layout, dates, SEO helpers
  views/                  one view per page type (takes `lang`)
  pages/                  thin route wrappers (English at /, Turkish under /tr)
  components/, layouts/   UI
  lab/                    lab tool registry and tools
  scripts/                client JS (≤ 5 KB gzipped site-wide)
  styles/                 Tailwind v4 theme, prose, code theme
functions/api/            Pages Functions (only /api/* runs Functions)
scripts/                  content-guard.mjs, verify-dist.mjs
```

## Privacy

No analytics, trackers, cookies, third-party scripts, fonts or embeds. The
repository is public: never commit internal hostnames, IPs or tailnet names
(see `docs/CONTENT.md`). `scripts/content-guard.mjs` blocks them from the site
in every build.
