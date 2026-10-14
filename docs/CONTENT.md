# Writing and publishing content

All content is Markdown or YAML in this repository. After the one-time setup,
you can publish entirely from github.com, including in a phone browser.

## ⚠ Public repository: read this first

The repository is **public**. Anything committed to **any** branch, including
`test`, is visible on GitHub immediately, even though test.dalkav.uk is
private. The content guard stops internal details from reaching the website;
it doesn't stop them from being exposed in git history.

- Never write internal hostnames, IP addresses, Tailscale/tailnet names or
  service subdomains, not even as examples. Describe the homelab by role
  ("the hypervisor", "the backup target", "the reverse proxy", "the VPN").
- For examples, use `example.com` and the documentation addresses
  `192.0.2.x`, `198.51.100.x`, `203.0.113.x`.
- Commits must use your GitHub noreply email (`SETUP.md` step 1). Commits made
  in the GitHub web UI use it automatically once **Keep my email addresses
  private** is on.
- If an internal name is ever committed, **stop and ask**: removing it needs a
  history rewrite, and deleting the line in a new commit is not enough.
- Never invent facts. Use a visible `[TODO: …]` for anything unknown;
  production builds list every `[TODO` as a warning.

## Phone workflow (github.com)

1. Open the repository on github.com and switch the branch to **`test`**
   (it's the default branch, so it's usually already selected).
2. Go to the folder, e.g. `src/content/notes/en/`, then **Add file** →
   **Create new file** (or open a file → ✏️ **Edit**).
3. Paste a template from below, write, then **Commit changes** → commit
   directly to `test`.
4. Wait for the deployment (a few minutes; the commit gets a green check from
   Cloudflare Pages).
5. Check https://test.dalkav.uk.
6. **Pull requests** → **New pull request** → base **`main`** ← compare
   **`test`** → **Create pull request**.
7. When **verify** is green → **Merge pull request** → **Create a merge
   commit** → **Confirm**. Production updates a few minutes later.

The GitHub Mobile app can review and merge pull requests too.

## Where things live

| What | Path |
|---|---|
| English notes | `src/content/notes/en/<slug>.md` |
| Turkish notes | `src/content/notes/tr/<slug>.md` |
| Note images (shared by both languages) | `src/content/notes/_images/<slug>/` |
| Projects | `src/content/projects/{en,tr}/<slug>.md` |
| Project images | `src/content/projects/_images/<slug>/` |
| CV | `src/content/cv/en.yaml`, `src/content/cv/tr.yaml` |
| CV PDFs | `public/cv/bahadir-cv-en.pdf`, `public/cv/bahadir-cv-tr.pdf` |
| UI text (menus, buttons, intros) | `src/i18n/en.json`, `src/i18n/tr.json` (same keys in both) |
| Email, GitHub, LinkedIn | `src/config/site.ts` |

**Slugs** are the filename: lowercase ASCII, digits and single hyphens, e.g.
`ev-laboratuvarinda-yedekleme`. A translation uses the **same filename** in the
other language folder. A note or project may exist in one language only; the
other language then lists it under "Only in Turkish" / "Yalnızca İngilizce".

## Note template

```markdown
---
title: "Short, specific title (max 90 characters)"
description: "One or two sentences for cards and search results, 50–160 characters."
date: 2026-10-14
# updated: 2026-11-01
tags: [sdr, rf]
projects: [sdr-weather-satellites]
draft: true
---

Opening paragraph: what you tried and why it matters.

## What happened

…
```

- `tags`: 1–6, lowercase ASCII kebab-case. Each tag gets a page.
- `projects`: optional; must be existing project slugs (the build fails
  otherwise).
- `draft: true` shows the note on test with a DRAFT pill and hides it on
  production. Remove the line (or set `false`) to publish.

## Project template

```markdown
---
title: "Project name"
summary: "One sentence: what it is and why it matters."
role: "Your role"
period: { start: 2026, end: present }
status: ongoing          # or: completed
order: 5                 # lower comes first
featured: false          # true = on the home page (max 4 shown)
bento: standard          # hero | tall | wide | standard (card size on desktop)
cover: ../_images/<slug>/cover.jpg
coverAlt: "Describe what the image shows, for people who can't see it."
tags: [embedded]
results:
  - "One measurable result."
# gallery:
#   - src: ../_images/<slug>/photo-1.jpg
#     alt: "What the photo shows."
#     caption: "Optional caption."
# links:
#   - label: "Source code"
#     url: "https://example.com/"
draft: true
---

## The problem
## What I did
## Results
## What I learned
```

Turkish headings: `## Sorun`, `## Ne yaptım`, `## Sonuçlar`, `## Ne öğrendim`.
If the start year is unknown, write `start: "[TODO: start year]"`, never a guess.

## Images

Images go next to the content, never in `public/` (only files under
`src/content` are resized, converted to AVIF/WebP and stripped of EXIF data;
the guard rejects photos in `public/`).

On github.com:

1. Go to `src/content/projects/_images/` (or `notes/_images/`).
2. **Add file** → **Upload files**. To create the `<slug>` folder, use
   **Add file** → **Create new file** and type `<slug>/placeholder.txt`
   first, then upload into that folder and delete the placeholder.
3. Reference the image relatively from the Markdown file:
   `cover: ../_images/<slug>/cover.jpg`, or in a note body
   `![Alt text](../_images/<slug>/figure.jpg)`.

Every image needs alt text. Before uploading phone photos, check them for
location data or anything private in the frame (screens, labels, addresses).
The build strips EXIF from generated images and fails if metadata survives.

## Replacing the CV PDFs

Replace `public/cv/bahadir-cv-en.pdf` and `public/cv/bahadir-cv-tr.pdf` with
the real files (same names). Production builds warn while the placeholders are
still there. Before uploading, check the PDF's document properties: export
without author paths or personal file paths in the metadata.

## Contact email

`src/config/site.ts` stores the address only as encoded parts (the repository
is public and scrapers read source). To encode a part (reversed, then base64):

```bash
node -e "console.log(Buffer.from([...process.argv[1]].reverse().join('')).toString('base64'))" your-local-part
```

Put the result in `email.user`. `email.domain` already encodes `dalkav.uk`.
