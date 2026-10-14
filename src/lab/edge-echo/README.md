# edge-echo

The starter lab tool. It proves the lab pattern end to end: a static page, a
Pages Function, per-environment variables, and progressive enhancement.

| Part | File |
|---|---|
| Registry entry | `src/lab/registry.ts` (imports `meta.ts`) |
| Metadata and UI strings | `src/lab/edge-echo/meta.ts` |
| UI (works without JS) | `src/lab/edge-echo/Tool.astro` |
| Enhancement (≤ 3 KB gzipped, this page only) | `src/lab/edge-echo/client.ts` |
| Server | `functions/api/lab/edge-echo.ts` |

## API

`GET /api/lab/edge-echo` (also `HEAD`; other methods return `405` with `Allow: GET, HEAD`):

```json
{
  "tool": "edge-echo",
  "environment": "production",
  "colo": "IST",
  "servedAt": "2026-10-14T09:00:00.000Z",
  "message": "Hello from production"
}
```

`environment` and `message` come from the Pages variables `SITE_ENV` and
`LAB_EDGE_ECHO_MESSAGE` (Production and Preview values differ). Locally they
come from `.dev.vars`. `colo` is the Cloudflare data centre that answered.

No visitor IP is returned, nothing is logged, and nothing is stored.
Responses carry `Cache-Control: no-store` and `X-Robots-Tag: noindex` from
`functions/api/_middleware.ts`.
