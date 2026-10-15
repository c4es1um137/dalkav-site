# One-time setup

After these steps, everything else happens on github.com (see `CONTENT.md`).
Checked against the official docs on 2026-10-14 (Cloudflare Pages custom
domains, custom branch aliases, preview deployments, build image v3, headers,
`_routes.json`; Cloudflare Zero Trust Access; GitHub rulesets; `gh` CLI) and
updated on 2026-10-15 after the first real setup.

**Prerequisites:** a GitHub account; a Cloudflare account with the `dalkav.uk`
zone; for steps 1–2 only, a computer with git, Node (version in `.nvmrc`) and
the GitHub CLI `gh`.

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
`<id>+<username>@users.noreply.github.com` address. It is meant to be public
(it is in every commit); your real address must never be.

Log in with the GitHub CLI. The `workflow` scope is required: without it GitHub
rejects pushes that contain `.github/workflows/`. Over SSH no browser can open,
so `BROWSER=false` skips that; open https://github.com/login/device on any
device and enter the code `gh` prints.

⚠ The login output shows your username and token scopes.

```bash
BROWSER=false gh auth login --hostname github.com --git-protocol https --web --scopes workflow
```

⚠ `gh repo create` prints the repository URL, which includes your username.

```bash
cd dalkav-site
git config user.email "<id>+<username>@users.noreply.github.com"   # this repo only
git config user.name "<username>"
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

The content guard already blocks private IPs (including Tailscale's
`100.64.0.0/10`) and hostnames ending in `.ts.net`, `.local`, `.lan`,
`.internal`, `.home.arpa` or `.localdomain`. The denylist covers private names
it can't recognise by pattern. You can add it later; until then builds print
`denylist not set` and run every other check.

**Put in:** server and VM/container hostnames; your tailnet name on its own
(the `tailXXXX` part); full names of self-hosted service subdomains; your home
public IP if it is fixed; any other identifier you never want published.

**Leave out:** `dalkav.uk`, `www.dalkav.uk`, `test.dalkav.uk` (the site uses
them), and ordinary words that appear in content such as `proxmox`, `backup`,
`nas`, `vpn`, `linux`, `homelab`. Entries match case-insensitively as whole
tokens (letters, digits, `_` and `-` are part of a token; a dot is a boundary),
so `nas` would block the word "NAS" in a note, while `myserver` also matches
inside `myserver.example.com`. If a hostname is a common word, add its full
domain name instead.

**Format:** one entry per line; lines starting with `#` are ignored.

```
# servers
myserver-01
# tailnet
tail1234
# service subdomains
grafana.example.com
# home public IP
203.0.113.7
```

⚠ This list names private infrastructure. Create it outside the repo, never
paste it into issues, PRs, commits or chats, and delete the file afterwards.

```bash
nano ~/denylist.txt
CONTENT_DENYLIST="$(cat ~/denylist.txt)" npm run guard     # ends with "denylist N entries" and OK
gh secret set CONTENT_DENYLIST --repo <github-user>/dalkav-site < ~/denylist.txt
rm ~/denylist.txt
```

The guard prints only `file:line DENYLIST`, never the matched text, so its
output is safe to share. Run `gh secret set` again at any time to replace the
list. `.gitignore` also ignores `denylist*.txt` as a safety net.

## 3. Create the Pages project

Cloudflare dashboard → **Workers & Pages** → **Create**. The dashboard opens
the **Workers** flow by default and may label Pages as legacy: Pages is still
supported and this site is built for it (moving to Workers needs code changes,
see `DEPLOYMENT.md`). Choose the **Pages** tab (or the link "Looking to deploy
Pages? Get started"). If you see a **Deploy command** field
(`npx wrangler deploy`), you are in the Workers flow: go back.

**Import an existing Git repository** → authorise the Cloudflare GitHub app
for **Only select repositories** → `dalkav-site` → **Begin setup**:

| Setting | Value |
|---|---|
| Project name | `dalkav-site` (the page shows "deployed to `<project>.pages.dev`"; that hostname is `<project>` below) |
| **Production branch** | **`main`**. The dropdown preselects the repo's default branch, `test`: change it. |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Environment variables (advanced) | `SITE_ENV=production`, `LAB_EDGE_ECHO_MESSAGE=Hello from production` |

**Save and Deploy.** The first production build runs from `main`. Variables
added here apply to **Production** only.

Node: the build image reads `.nvmrc` (`24`). Build image v3 accepts any
Node version this way; codenames such as `lts/krypton` are not supported, so
keep a number in `.nvmrc`.

Then, in the project's **Settings**:

- **Variables and Secrets** for **Preview**: at the top of the Settings page,
  switch **Choose Environment** from **Production** to **Preview** (the
  selector applies to the whole page), then **Add** `SITE_ENV=test` and
  `LAB_EDGE_ECHO_MESSAGE=Hello from test` as **Text**. Switch back and check
  that Production still has `SITE_ENV=production`. Without the Preview
  variables a `test` build stops with an error.
- **Builds** → **Branch control**: production branch `main`, automatic
  production deployments **on**; **Preview branches** → **Custom branches** →
  include `test`, nothing else.
- **Builds** → **Build system version**: the latest (v3).
- **General** → **Enable access policy** (protects preview deployments,
  including `*.<project>.pages.dev` hash URLs). Afterwards the section says
  "Preview deployments are restricted by a Cloudflare Access policy" and
  shows only **Manage**. The policy it creates allows the account's email.
- **Metrics** tab → **Web Analytics**: an **Enable** button means it is off;
  leave it off.

Trigger the first test deployment:

```bash
git switch test && git commit --allow-empty -m "chore: first test build" && git push
```

Wait until **Deployments** shows a successful Preview deployment for `test`.
Verify (⚠ the `location` header contains your Zero Trust team name):

```bash
curl -sI https://test.<project>.pages.dev/ | grep -iE '^(HTTP|location)'   # expect 302 → <team>.cloudflareaccess.com
```

## 4. Bind www.dalkav.uk (production)

Pages project → **Custom domains** → **Set up a custom domain** →
`www.dalkav.uk` → **Continue** → **Activate domain**. Cloudflare creates a new
proxied `CNAME` `www` → `<project>.pages.dev`. The domain shows **Verifying**
for a few minutes (the site may already load) and then **Active**.

Don't create the `CNAME` by hand first: a record added before the domain is
added in Pages causes a 522 error.

## 5. Protect test.dalkav.uk with Cloudflare Access (before binding it)

Create the Access application **before** step 6, so `test.dalkav.uk` is never
public, not even for a few minutes.

- **Zero Trust** → on first use, choose a team name and the **Free** plan
  ($0; onboarding may ask for a payment method). Enabling the preview access
  policy in step 3 may already have done this.
- **Settings** → **Authentication** → **Login methods**: make sure
  **One-time PIN** is listed.
- **Access** → **Applications** → **Add an application** → **Self-hosted**:
  - Name: `dalkav test`
  - Session duration: 24 hours
  - Public hostname: subdomain `test`, domain `dalkav.uk`
  - Policy "Owner": **Allow**, Include → **Emails** → `<your email>`
- Check the Access application that **Enable access policy** created for the
  `<project>.pages.dev` previews: its policy should allow only the same single
  email.

## 6. Bind test.dalkav.uk to the `test` branch

Requires a successful `test` deployment (step 3) and the Access application
(step 5).

1. **Custom domains** → **Set up a custom domain** → `test.dalkav.uk` →
   **Continue** → **Activate domain**.
2. **DNS** → **Records** → edit the **new** `CNAME` named `test` (created just
   now) → change the target from `<project>.pages.dev` to
   `test.<project>.pages.dev` → keep **Proxied** (orange cloud) → **Save**.

An unproxied record, or DNS outside Cloudflare, sends the alias to the
production branch instead. The domain shows **pending** until its certificate
is issued.

Verify (⚠ the `location` header contains your Zero Trust team name):

```bash
curl -sI https://test.dalkav.uk/ | grep -iE '^(HTTP|location)'   # expect 302 → <team>.cloudflareaccess.com
```

Then open https://test.dalkav.uk, sign in with the emailed PIN and check the
yellow **TEST** banner.

## 7. Apex redirect dalkav.uk → www

Only if step 0 found no apex `A`/`AAAA`/`CNAME`.

- **DNS** → **Add record**: type `AAAA`, name `@`, IPv6 `100::`, **Proxied**.
  (`100::` is the discard prefix: a placeholder; traffic never reaches it.)
- **Rules** → **Redirect Rules** → **Create rule**. Don't use a template:
  "Redirect from WWW to root" goes the wrong way, and "Redirect from root to
  WWW" matches only `https://`, so `http://dalkav.uk` would not redirect.
  - Name: `apex-to-www`
  - If: custom filter expression, **Hostname** equals `dalkav.uk` (the
    dashboard may save it as `http.host wildcard r"dalkav.uk"`: without a `*`
    that is an exact, case-insensitive match)
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
git push origin test:main    # must be rejected (protected branch)
```

## 9. First release

```bash
gh pr create --repo <github-user>/dalkav-site --base main --head test --title "Release: initial site" --body "Promote test to production"
```

Wait for **verify** and the Cloudflare Pages check → **Merge pull request** →
**Create a merge commit**. Watch https://www.dalkav.uk update.

## 10. Adding lab secrets later

Pages project → **Settings** → **Choose Environment** (**Production** or
**Preview**) → **Variables and Secrets** → **Add** → type **Secret**.

⚠ Never print secrets in build logs or commit `.dev.vars`.
`wrangler pages dev` lists the bindings it loaded: check that its output shows
secret values as `(hidden)` before sharing any terminal output.
