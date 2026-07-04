# Private hosting on Vercel

> **Status: authentication is currently DISABLED.** The Basic Auth middleware was
> removed because iOS standalone PWAs cannot re-show the login prompt once
> credentials expire, leaving the installed app stuck on "Authentication
> required." To re-enable it, restore the middleware from git history
> (`git checkout e8286cb -- middleware.ts`), reinstall its dependency
> (`npm i @vercel/functions`), add `middleware.ts` back to
> `tsconfig.node.json`'s include list, and redeploy with the env vars below.
> If you want protection that plays nicely with an installed PWA, prefer
> Cloudflare Access (cookie-based, see below) over Basic Auth.

The game is a fully client-side static build (one self-contained `dist/index.html`), so it needs no server, database, or Railway project — just static hosting with an access gate in front. This repo is set up for **Vercel + HTTP Basic Auth**, which works on the free Hobby plan.

## How it works

[`middleware.ts`](../middleware.ts) at the repo root is a [Vercel Routing Middleware](https://vercel.com/docs/routing-middleware). It runs on Vercel's edge **before** any static file is served — for every path, on the production domain, the `*.vercel.app` URL, and preview deployments alike. Requests without the shared username/password get a `401` and the browser shows its native login prompt; correct credentials pass through to the game. The check is enforced server-side, so the game HTML is never sent to anyone who hasn't logged in.

If the credential environment variables are missing, the site stays locked (fails closed) rather than becoming public.

Note: the middleware only runs on Vercel. `npm run dev` locally is unaffected — no login prompt during development.

## Setup (one time)

1. **Import the repo** at [vercel.com/new](https://vercel.com/new) (or `npx vercel` from the repo). Vercel auto-detects the Vite preset: build command `npm run build`, output directory `dist`. No `vercel.json` needed.
2. **Set the credentials** under *Project → Settings → Environment Variables* (apply to all environments):
   - `BASIC_AUTH_USER` — e.g. `family`
   - `BASIC_AUTH_PASSWORD` — a decent shared password
3. **Redeploy** (env var changes need a new deployment).
4. Visit the deployment URL — you should get a login prompt. Enter the credentials once; the browser remembers them for the session (most browsers offer to save them permanently).

Share the URL + credentials with friends and family. Nobody else can load the game.

### Optional: custom domain

Add your domain under *Project → Settings → Domains*, then create the CNAME/A records Vercel shows you at your DNS host. The middleware protects the custom domain the same way.

## Why this approach

- **Vercel's built-in Password Protection** does exactly this but is a paid add-on (Pro plan); the free-tier "Vercel Authentication" option only admits members of your Vercel team, which doesn't suit family.
- **Clerk** is overkill here: with no backend, a client-side Clerk gate would only hide the UI, not actually withhold the game, and doing it properly means converting the project to a server-rendered app.
- **Cloudflare Access** (free for up to 50 users) is the upgrade path if you ever want per-person email logins instead of one shared password — it sits in front of any host, including Cloudflare Pages or this Vercel deployment behind your own domain.

For a hobby project shared with a trusted circle, one shared password is the sweet spot: zero cost, zero accounts, one file of code.
