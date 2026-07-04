import { next } from '@vercel/functions/middleware';

// Vercel Routing Middleware: runs on every request before the static build is
// served, so the game is only reachable with the shared credentials. The
// username/password come from the BASIC_AUTH_USER / BASIC_AUTH_PASSWORD
// environment variables on the Vercel project; if they are unset the site
// stays locked rather than falling open. See docs/HOSTING.md.
export default function middleware(request: Request): Response {
  const user = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASSWORD;

  if (user && password) {
    const expected = `Basic ${btoa(`${user}:${password}`)}`;
    if (request.headers.get('authorization') === expected) {
      return next();
    }
  }

  return new Response('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Splendor", charset="UTF-8"' },
  });
}
