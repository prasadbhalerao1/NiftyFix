/**
 * Production deploy to Cloudflare Workers (static assets).
 *
 * 1. Build and deploy the tool frame; it may only be embedded by the site.
 * 2. Build the site pointing at the frame's deployed origin, and deploy it.
 * 3. Smoke-check the live URLs: pages, robots.txt, sitemap, 404 and headers.
 *
 * Needs `wrangler login` (or CLOUDFLARE_API_TOKEN). Run the full CI first.
 */
import { execFileSync } from 'node:child_process';

const SITE_ORIGIN = 'https://niftyfix.in';
const FRAME_URL = /https:\/\/niftyfix-frame\.[a-z0-9-]+\.workers\.dev/;

function run(command: string, args: string[], env: Record<string, string> = {}): string {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  const output = execFileSync(command, args, {
    env: { ...process.env, ...env },
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: ['inherit', 'pipe', 'inherit'],
  });
  process.stdout.write(output);
  return output;
}

function build(filter: string, env: Record<string, string>): void {
  run('pnpm', ['turbo', 'run', 'build', `--filter=${filter}`], env);
}

const deploy = (app: string): string =>
  run('pnpm', ['--dir', `apps/${app}`, 'exec', 'wrangler', 'deploy']);

async function check(url: string, expect: { status: number; text?: string; header?: string }) {
  const response = await fetch(url, { redirect: 'manual' });
  const body = await response.text();
  const problems = [
    response.status === expect.status
      ? null
      : `status ${response.status}, expected ${expect.status}`,
    expect.text && !body.includes(expect.text) ? `body lacks "${expect.text}"` : null,
    expect.header && !response.headers.has(expect.header) ? `no ${expect.header} header` : null,
  ].filter((problem) => problem !== null);
  console.log(
    `${problems.length === 0 ? 'ok  ' : 'FAIL'} ${url}${problems.length ? ` — ${problems.join('; ')}` : ''}`,
  );
  return problems.length === 0;
}

build('@niftyfix/tool-frame', { PUBLIC_SITE_ORIGIN: SITE_ORIGIN });
const frameOrigin = FRAME_URL.exec(deploy('tool-frame'))?.[0];
if (!frameOrigin) throw new Error('Could not read the frame URL from wrangler output.');

build('@niftyfix/site', { PUBLIC_SITE_ORIGIN: SITE_ORIGIN, PUBLIC_FRAME_ORIGIN: frameOrigin });
deploy('site');

console.log('\nSmoke checks');
const results = [
  await check(`${SITE_ORIGIN}/`, { status: 200, header: 'content-security-policy' }),
  await check(`${SITE_ORIGIN}/pdf/compress-pdf/`, { status: 200, text: frameOrigin }),
  await check(`${SITE_ORIGIN}/pdf/compress-pdf-to-200kb/`, { status: 200 }),
  await check(`${SITE_ORIGIN}/robots.txt`, { status: 200, text: `${SITE_ORIGIN}/sitemap.xml` }),
  await check(`${SITE_ORIGIN}/sitemap.xml`, { status: 200, text: '<urlset' }),
  await check(`${SITE_ORIGIN}/no-such-page/`, { status: 404 }),
  await check(`${frameOrigin}/?tool=pdf.compress-pdf`, { status: 200, header: 'x-robots-tag' }),
];
if (results.includes(false)) process.exit(1);
console.log(`\nLive: ${SITE_ORIGIN} (tools served from ${frameOrigin})`);
