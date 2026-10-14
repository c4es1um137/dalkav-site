// SITE_ENV resolution and everything derived from it.
// This is the single code path for environment differences: astro.config.mjs,
// layouts, robots.txt, _headers and the dist checks all read from here.

export const SITE_ENVS = ['production', 'test', 'development'] as const;
export type SiteEnv = (typeof SITE_ENVS)[number];

const SITES: Record<SiteEnv, string> = {
  production: 'https://www.dalkav.uk',
  test: 'https://test.dalkav.uk',
  development: 'http://localhost:4321',
};

type RawEnv = Record<string, string | undefined>;

export interface ResolvedEnv {
  siteEnv: SiteEnv;
  site: string;
  /** Production is the only environment that is public and indexable. */
  isProduction: boolean;
  /** Test and development both behave like test: banner, noindex, drafts visible. */
  isTest: boolean;
  showDrafts: boolean;
  /** First 7 characters of the commit SHA, or "local". */
  buildSha: string;
  branch: string;
}

function isSiteEnv(value: string | undefined): value is SiteEnv {
  return value !== undefined && (SITE_ENVS as readonly string[]).includes(value);
}

/**
 * Validate SITE_ENV. On Cloudflare Pages (CF_PAGES=1) or CI (CI=true) a missing
 * or invalid value is an error; locally it defaults to "development".
 * On Pages the branch must agree: `main` requires production, every other
 * branch must not be production.
 */
export function resolveEnv(raw: RawEnv = process.env): ResolvedEnv {
  const onPages = raw.CF_PAGES === '1';
  const onCi = raw.CI === 'true';
  const value = raw.SITE_ENV?.trim() || undefined;

  let siteEnv: SiteEnv;
  if (isSiteEnv(value)) {
    siteEnv = value;
  } else if (onPages || onCi) {
    throw new Error(
      `SITE_ENV must be one of ${SITE_ENVS.join(', ')} on ${onPages ? 'Cloudflare Pages' : 'CI'} ` +
        `(got ${value === undefined ? 'nothing' : JSON.stringify(value)}). ` +
        'Set it in the Pages project (Production / Preview variables) or in the CI job.',
    );
  } else if (value !== undefined) {
    throw new Error(`SITE_ENV must be one of ${SITE_ENVS.join(', ')} (got ${JSON.stringify(value)}).`);
  } else {
    siteEnv = 'development';
  }

  const pagesBranch = raw.CF_PAGES_BRANCH;
  if (onPages && pagesBranch) {
    if (pagesBranch === 'main' && siteEnv !== 'production') {
      throw new Error(`Branch "main" must build with SITE_ENV=production (got ${siteEnv}).`);
    }
    if (pagesBranch !== 'main' && siteEnv === 'production') {
      throw new Error(`Only branch "main" may build with SITE_ENV=production (got branch "${pagesBranch}").`);
    }
  }

  const sha = raw.CF_PAGES_COMMIT_SHA || raw.GITHUB_SHA || '';
  const branch = pagesBranch || raw.GITHUB_HEAD_REF || raw.GITHUB_REF_NAME || 'local';

  return {
    siteEnv,
    site: SITES[siteEnv],
    isProduction: siteEnv === 'production',
    isTest: siteEnv !== 'production',
    showDrafts: siteEnv !== 'production',
    buildSha: sha ? sha.slice(0, 7) : 'local',
    branch,
  };
}

export const env: ResolvedEnv = resolveEnv();
