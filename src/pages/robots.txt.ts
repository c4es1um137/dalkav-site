import type { APIRoute } from 'astro';
import { env } from '../env';

// Production: crawlable, with the sitemap. Test/development: nothing.
export const GET: APIRoute = () => {
  const body = env.isProduction
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', env.site).href}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
