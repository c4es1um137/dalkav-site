// Runs for every /api/* Function response (the only routes Functions handle,
// see public/_routes.json). _headers does not apply to Functions, so the
// security headers are added here, plus no-store and noindex.

import { SECURITY_HEADERS } from '../../src/config/security-headers';

interface Context {
  request: Request;
  next: () => Promise<Response>;
}

export const onRequest = async ({ next }: Context): Promise<Response> => {
  const response = await next();
  const headers = new Headers(response.headers);
  for (const [name, value] of SECURITY_HEADERS) headers.set(name, value);
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Robots-Tag', 'noindex');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};
