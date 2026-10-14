// GET /api/lab/edge-echo: which environment and Cloudflare data centre answered.
// No visitor IP, no logging of personal data, no storage.

interface Env {
  SITE_ENV?: string;
  LAB_EDGE_ECHO_MESSAGE?: string;
}

interface Context {
  request: Request & { cf?: { colo?: string } };
  env: Env;
}

const ALLOW = 'GET, HEAD';

export const onRequest = async ({ request, env }: Context): Promise<Response> => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { Allow: ALLOW, 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const body = JSON.stringify({
    tool: 'edge-echo',
    environment: env.SITE_ENV ?? null,
    colo: request.cf?.colo ?? null,
    servedAt: new Date().toISOString(),
    message: env.LAB_EDGE_ECHO_MESSAGE ?? null,
  });

  return new Response(request.method === 'HEAD' ? null : body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
