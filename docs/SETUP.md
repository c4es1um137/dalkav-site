# One-time setup

After these steps, everything else happens on github.com (see `CONTENT.md`).
Checked against the official docs on 2026-10-14:
Cloudflare Pages (custom domains, custom branch aliases, preview deployments,
build image v3, headers, `_routes.json`), Cloudflare Zero Trust Access,
GitHub rulesets and `gh` CLI.

**Prerequisites:** a GitHub account; a Cloudflare account with the `dalkav.uk`
zone; for steps 1–2 only, a computer with git, Node (version in `.nvmrc`) and
the GitHub CLI `gh`, logged in (`gh auth login`).

> ⚠ Some commands below print account details (repository URLs, Access team
> names, account IDs). A ⚠ marks each one. Don't paste their output into
> issues, PRs or chats.

---

## 0. DNS pre-flight (read only)

Cloudflare dashboard → `dalkav.uk` → **DNS** → **Records**. Confirm that:

- there is **no** record named `www`,
- there is **no** record named `test`,
- there is **no** `A`, `AAAA` or `CNAME` record on the apex `dalkav.uk`.

`MX` and `TXT` records on the apex are fine and stay untouched.

If any of the listed records exists, **stop and ask**. Never edit or delete
existing records.

⚠ Don't use DNS **Export** here: the export lists every record, including
private subdomains. If you export anyway, keep the file local; never commit or
paste it.

## 1. Hide your email, create the repo and branches

GitHub → **Settings** → **Emails**: turn on **Keep my email addresses private**
and **Block command line pushes that expose my email**. Note your
`<id>+<username>@users.noreply.github.com` address.

⚠ `gh repo create` prints the repository URL, which includes your username.

```bash
cd dalkav-site
git config user.email "<id>+<username>@users.noreply.github.com"
npm ci && npm run build          # local build; SITE_ENV defaults to development
git init -b main
git add .
git commit -m "Initial site"
gh repo create dalkav-site --public --source=. --remote=origin --push
git switch -c test
git push -u origin test
gh repo edit --default-branch test     # web and phone edits land on test by default
gh repo edit --enable-merge-commit --enable-squash-merge=false --enable-rebase-merge=false --delete-branch-on-merge=false
```

Then GitHub → repository **Settings** → **Code security** (called
**Advanced Security** on some accounts): turn on **Secret scanning** and
**Push protection**.

Check: repository **Settings** → **General** → **Pull Requests**: only
**Allow merge commits** is ticked, and **Automatically delete head branches**
is **off** (otherwise merging the release PR deletes `test`).

## 2. Content denylist secret

⚠ This list names private infrastructure. Create it outside the repo, never
paste it into issues, PRs, commits or chats, and delete the file afterwards.

```bash
# one entry per line: internal hostnames, tailnet name, service subdomains, internal IPs
nano ~/denylist.txt
gh secret set CONTENT_DENYLIST --repo <github-user>/dalkav-site < ~/denylist.txt
rm ~/denylist.txt
```

The content guard matches each line case-insensitively as a whole token and
prints only `file:line DENYLIST`, never the matched text. `.gitignore` also
ignores `denylist*.txt` as a safety net.

## 3. Create the Pages project

Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
**Connect to Git**. Authorise the Cloudflare GitHub app for the
`dalkav-site` repository only. Then:

| Setting | Value |
|---|---|
| Project name | `dalkav-site` (note the actual `*.pages.dev` hostname; it is `<project>` below) |
| Production branch | `main` |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Production variables | `SITE_ENV=production`, `LAB_EDGE_ECHO_MESSAGE=Hello from production` |

**Save and Deploy.** The first production build runs from `main`.

Node: the build image reads `.nvmrc` (`24`). Build image v3 accepts any
Node version this way; codenames such as `lts/krypton` are not supported, so
keep a number in `.nvmrc`.

Then, in the project's **Settings**:

- **Variables and Secrets** → **Preview**: `SITE_ENV=test`,
  `LAB_EDGE_ECHO_MESSAGE=Hello from test`.
- **Builds** → **Branch control**: production branch `main`, automatic
  production deployments **on**; **Preview branches** → **Custom branches** →
  include `test`, nothing else.
- **Builds** → **Build system version**: the latest (v3).
- **General** → **Enable access policy** (protects preview deployments,
  including `*.<project>.pages.dev` hash URLs).
- Confirm **Web Analytics** is **off** (Metrics tab).

Trigger the first test deployment:

```bash
git switch test && git commit --allow-empty -m "chore: first test build" && git push
```

Wait until **Deployments** shows a successful Preview deployment for `test`.

## 4. Bind www.dalkav.uk (production)

Pages project → **Custom domains** → **Set up a custom domain** →
`www.dalkav.uk` → **Continue** → **Activate domain**. Cloudflare creates a new
proxied `CNAME` `www` → `<project>.pages.dev`. Wait until it shows **Active**.

Don't create the `CNAME` by hand first: a record added before the domain is
added in Pages causes a 522 error.

## 5. Bind test.dalkav.uk to the `test` branch

Requires a successful `test` deployment (step 3).

1. **Custom domains** → **Set up a custom domain** → `test.dalkav.uk` →
   **Continue** → **Activate domain**.
2. **DNS** → **Records** → edit the **new** `CNAME` named `test` (created just
   now) → change the target from `<project>.pages.dev` to
   `test.<project>.pages.dev` → keep **Proxied** (orange cloud) → **Save**.

An unproxied record, or DNS outside Cloudflare, sends the alias to the
production branch instead.

## 6. Put test behind Cloudflare Access

- **Zero Trust** → on first use, choose a team name and the **Free** plan
  ($0; onboarding may ask for a payment method).
- **Settings** → **Authentication** → enable **One-time PIN**.
- **Access** → **Applications** → **Add an application** → **Self-hosted**:
  - Name: `dalkav test`
  - Hostnames: `test.dalkav.uk` (plus `test.<project>.pages.dev` if the
    preview policy from step 3 doesn't already cover it)
  - Session duration: 24 hours
  - Policy "Owner": **Allow**, Include → **Emails** → `<your email>`
- Open the Access application that **Enable access policy** created for the
  `<project>.pages.dev` previews and restrict its policy to the same single
  email.

Verify (⚠ the `location` header contains your Zero Trust team name):

```bash
curl -sI https://test.dalkav.uk/ | grep -iE '^(HTTP|location)'   # expect 302 → <team>.cloudflareaccess.com
```

## 7. Apex redirect dalkav.uk → www

Only if step 0 found no apex `A`/`AAAA`/`CNAME`.

- **DNS** → **Add record**: type `AAAA`, name `@`, IPv6 `100::`, **Proxied**.
  (`100::` is the discard prefix: a placeholder; traffic never reaches it.)
- **Rules** → **Redirect Rules** → **Create rule**:
  - Name: `apex-to-www`
  - If: **Hostname** equals `dalkav.uk`
  - Then: **Dynamic**, expression `concat("https://www.dalkav.uk", http.request.uri.path)`,
    status **301**, **Preserve query string** ✓
  - **Deploy**

Verify:

```bash
curl -sI "http://dalkav.uk/notes?x=1" | grep -iE '^(HTTP|location)'   # expect 301 → https://www.dalkav.uk/notes?x=1
```

Do **not** change zone-wide settings (SSL mode, Always Use HTTPS, HSTS, Email
Obfuscation, Rocket Loader, Bot Fight Mode, cache rules): they affect other
subdomains. If **Email Obfuscation** or **Rocket Loader** is on zone-wide, add
a **Configuration Rule** scoped to `www.dalkav.uk` and `test.dalkav.uk` that
turns them off; both inject scripts that break the site's CSP. If
`http://www…` or `http://test…` doesn't redirect to HTTPS, add a
hostname-scoped redirect rule for those two hostnames only.

## 8. Branch protection

GitHub → repository **Settings** → **Rules** → **Rulesets** → **New ruleset**
→ **New branch ruleset**.

**`protect-main`**
- Enforcement status: **Active**; bypass list: empty.
- Target branches: **Add target** → **Include by pattern** → `main`.
- Rules: **Restrict deletions**; **Block force pushes**; **Require a pull
  request before merging** (required approvals 0; in its additional settings,
  allow only the **Merge** merge method); **Require status checks to pass
  before merging** → add `verify` (it appears in the list after CI has run
  once). Leave **Require branches to be up to date before merging** **off**.

**`protect-test`**
- Active, target `test`; **Restrict deletions**; **Block force pushes**.

Verify:

```bash
git push origin HEAD:main    # must be rejected
```

## 9. First release

```bash
gh pr create --repo <github-user>/dalkav-site --base main --head test --title "Release: initial site" --body "Promote test to production"
```

Wait for **verify** and the Cloudflare Pages check → **Merge pull request** →
**Create a merge commit**. Watch https://www.dalkav.uk update.

## 10. Adding lab secrets later

Pages project → **Settings** → **Variables and Secrets** → **Add** → type
**Secret** → choose **Production** or **Preview**.

⚠ Never print secrets in build logs or commit `.dev.vars`.
`wrangler pages dev` lists the bindings it loaded: check that its output shows
secret values as `(hidden)` before sharing any terminal output.
