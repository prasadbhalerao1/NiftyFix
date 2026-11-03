# Runbook — Deploying to Cloudflare

Status: **not yet deployed.** This documents the intended production configuration.

## Two origins, two registrable domains

| App                            | Build output           | Example production origin     |
| ------------------------------ | ---------------------- | ----------------------------- |
| Site (`apps/site`)             | `apps/site/dist`       | `https://www.niftyfix.in`     |
| Tool frame (`apps/tool-frame`) | `apps/tool-frame/dist` | `https://run.niftyfixcdn.com` |

Using a **separate registrable domain** for the frame (not a subdomain of the site) prevents cookie and storage sharing between the page that may later carry ads and the frame that handles files.

## Build

```sh
PUBLIC_SITE_ORIGIN=https://www.niftyfix.in \
PUBLIC_FRAME_ORIGIN=https://run.niftyfixcdn.com \
pnpm build
```

Both origins are compiled into both apps (frame `postMessage` target; site `frame-src`, canonical URLs, sitemap). Each build writes a Cloudflare `_headers` file generated from the same code the preview servers use in tests (`apps/site/src/seo/headers.ts`, `apps/tool-frame/src/security/headers.ts`).

## Deploy (Workers static assets or Pages)

- Create two projects, one per `dist` directory; attach each custom domain.
- Confirm headers after deploy:
  `curl -sI https://run.niftyfixcdn.com/ | grep -i content-security-policy` must show `frame-ancestors https://www.niftyfix.in` and `connect-src 'self'`.
- Set the frame project to **not** serve any functions/workers routes — static assets only.

## Post-deploy checks

1. `pnpm e2e` against production by setting `baseURL` and origins (add a production project before first deploy).
2. Open a tool page, run the tool, inspect DevTools → Network: frame requests only to its own origin.
3. Search Console + Bing Webmaster Tools: verify the site domain; submit `/sitemap.xml`.

## What localhost does and does not prove

Locally, the site (`localhost:4321`) and frame (`127.0.0.1:4322`) are different origins, so cross-origin isolation, postMessage origin checks and CSP behave as in production. Localhost does **not** prove: TLS, real cookie partitioning between different registrable domains, CDN header propagation, or behaviour with ad scripts present. Those must be re-verified on the deployed domains.
