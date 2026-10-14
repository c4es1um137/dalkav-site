<!-- Release: test → main. Merge with "Create a merge commit" (squash and rebase are disabled). -->

## What changes

-

## Release checklist

- [ ] Base is `main`, compare is `test`.
- [ ] CI check **verify** passed (production and test builds, content guard, verify-dist).
- [ ] The Cloudflare Pages check for this branch passed.
- [ ] I checked the change on https://test.dalkav.uk (both languages if it touches shared UI).
- [ ] No `draft: true` content is expected to appear on production.
- [ ] New notes/projects: front matter is valid, images have alt text, no internal hostnames or IPs.
- [ ] Any `[TODO` warnings in the build log are expected.
- [ ] I will merge with **Create a merge commit** and **not** delete the `test` branch.

After merging: watch https://www.dalkav.uk update. If something is wrong, see
`docs/DEPLOYMENT.md` → Rollback.
