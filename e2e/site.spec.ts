import { expect, test } from '@playwright/test';
import { recordProblems, TOOL_PATH } from './helpers';

test.describe('site', () => {
  test('homepage shows the categories, and search finds tools, presets and planned tools', async ({
    page,
  }) => {
    const problems = recordProblems(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Get your files ready');
    const main = page.getByRole('main');
    await expect(main.getByRole('link', { name: 'The whole PDF desk' })).toHaveAttribute(
      'href',
      '/pdf/',
    );
    // Every category without live tools is still listed, under "Coming next".
    await expect(main.getByRole('link', { name: /^Video/ })).toHaveAttribute('href', '/video/');

    const search = page.getByRole('combobox', { name: 'What do you need to do?' });
    const results = page.getByRole('listbox', { name: 'Matching tools' }).first();
    await search.fill('exam form photo');
    await expect(results.getByRole('option', { name: /Form Photo Resizer/ })).toBeVisible();
    // A size in plain words finds the preset page.
    await search.fill('make this photo under 50 kb');
    await expect(results.getByRole('option').first()).toContainText('Resize a photo to 50 KB');
    // Planned tools are found too, marked as soon and not linked.
    await search.fill('repair pdf');
    const planned = results.getByRole('option', { name: /Repair PDF/ });
    await expect(planned).toContainText('Soon');
    await expect(planned).toHaveAttribute('aria-disabled', 'true');
    await expect(results.getByRole('link', { name: /Repair PDF/ })).toHaveCount(0);
    await search.fill('zzz no such tool');
    await expect(page.getByText('No tool matches that yet')).toBeVisible();

    // Keyboard: arrow to the second match and open it.
    await search.fill('merge pdf');
    await expect(results.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
    await search.press('Enter');
    await expect(page).toHaveURL('/pdf/merge-pdf/');
    expect(problems).toEqual([]);
  });

  test('the hero demo plays, can be replayed, and is static with reduced motion', async ({
    page,
  }) => {
    await page.goto('/');
    const demo = page.locator('[data-demo]').first();
    const results = demo.locator('.check-result');
    // On a phone the demo sits under the hero text and plays only once 35% of it is visible.
    await demo.scrollIntoViewIfNeeded();
    await expect(demo).toHaveClass(/checks-done/, { timeout: 5_000 });
    await expect(results.first()).toBeVisible();
    await expect(demo.locator('[data-count-from]')).toHaveText('196 KB', { timeout: 5_000 });
    // Replay starts again from "Checking".
    await page.getByRole('button', { name: 'Replay demo' }).click();
    await expect(demo).not.toHaveClass(/checks-done/);
    await expect(demo).toHaveClass(/checks-done/, { timeout: 5_000 });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await expect(page.locator('html')).not.toHaveClass(/(^|\s)motion(\s|$)/);
    await expect(page.getByRole('button', { name: 'Replay demo' })).toBeHidden();
    await expect(demo.locator('.check-result').first()).toBeVisible();
    await expect(demo.locator('.check-pending').first()).toBeHidden();
  });

  test('no page scrolls sideways, on a phone or a desktop', async ({ page }) => {
    for (const width of [360, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      for (const path of ['/', '/pdf/', '/forms/', '/tools/', TOOL_PATH]) {
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(0);
      }
    }
  });

  test('the command palette opens from anywhere with Ctrl+K', async ({ page }) => {
    await page.goto(TOOL_PATH);
    await page.keyboard.press('ControlOrMeta+k');
    const dialog = page.getByRole('dialog', { name: 'Search tools' });
    await expect(dialog).toBeVisible();
    // Before typing, it suggests tools.
    await expect(dialog.getByRole('option').first()).toBeVisible();
    await dialog.getByRole('combobox').fill('signature');
    await dialog.getByRole('combobox').press('Enter');
    await expect(page).toHaveURL('/forms/signature-resizer/');
  });

  test('without JavaScript, ?q= on the home page still finds tools', async ({ page }) => {
    await page.goto('/?q=compress+pdf');
    await expect(
      page.getByRole('listbox', { name: 'Matching tools' }).first().getByRole('option').first(),
    ).toContainText('Compress');
  });

  test('the all-tools directory lists every category and filters', async ({ page }) => {
    await page.goto('/tools/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('All tools');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 2 })).toHaveCount(18);
    await page.getByLabel('Filter all tools').fill('merge pdf');
    await expect(main.getByRole('link', { name: /Merge PDF/ })).toBeVisible();
    await expect(main.getByRole('link', { name: /Form Photo Resizer/ })).toBeHidden();
  });

  test('a category page lists all of its tools, ready and planned', async ({ page }) => {
    await page.goto('/forms/');
    const main = page.getByRole('main');
    await expect(main.getByRole('link', { name: /Form Photo Resizer/ })).toBeVisible();
    await expect(main.getByRole('link', { name: /Signature Resizer/ })).toBeVisible();
    await expect(
      page.locator('[data-planned]', { hasText: 'Passport and Visa Photo Maker' }),
    ).toBeVisible();
    // A hub with no finished tool yet is not offered to search engines.
    await page.goto('/utilities/');
    await expect(page.locator('[data-planned]').first()).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('tool page has SEO essentials and the working tool at its centre', async ({ page }) => {
    await page.goto(TOOL_PATH);
    await expect(page).toHaveTitle(/Form Photo Resizer/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Resize a photo for an application form',
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `http://localhost:4321${TOOL_PATH}`,
    );
    // Live tools are open to search engines: no robots restriction on the page.
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = jsonLd.map((text) => (JSON.parse(text) as { '@type': string })['@type']);
    // FAQPage mirrors the visible questions, for AI assistants (no Google rich result since 2026).
    expect(types).toEqual(['BreadcrumbList', 'WebApplication', 'FAQPage']);
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Form-ready');
    for (const heading of [
      'How to use it',
      'Options explained',
      'Limits and troubleshooting',
      'Questions',
    ]) {
      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible();
    }
    // The tool sits directly under the H1 (before any long content).
    const frameBox = await page.locator('iframe[data-tool-frame]').boundingBox();
    const howToBox = await page.getByRole('heading', { name: 'How to use it' }).boundingBox();
    expect(frameBox && howToBox && frameBox.y < howToBox.y).toBe(true);
  });

  test('sitemap, robots and static pages', async ({ page, request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('<loc>http://localhost:4321/</loc>');
    // Live tools and their category hubs are submitted for indexing.
    for (const path of [
      '/forms/photo-resizer/',
      '/pdf/',
      '/pdf/merge-pdf/',
      '/pdf/compress-pdf/',
    ]) {
      expect(sitemap).toContain(`<loc>http://localhost:4321${path}</loc>`);
    }
    expect(await (await request.get('/robots.txt')).text()).toContain(
      'Sitemap: http://localhost:4321/sitemap.xml',
    );
    for (const path of [
      '/about/',
      '/contact/',
      '/privacy/',
      '/terms/',
      '/security/',
      '/licenses/',
      '/privacy-verification/',
      '/forms/',
      '/tools/',
    ]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });

  test('legal and contact pages: indexed, complete, and linked from every page', async ({
    page,
  }) => {
    const email = 'prasadbhalerao279@gmail.com';
    await page.goto('/contact/');
    await expect(page.getByRole('link', { name: 'Email us' })).toHaveAttribute(
      'href',
      new RegExp(`^mailto:${email}`),
    );
    for (const path of ['/privacy/', '/terms/']) {
      await page.goto(path);
      // Published policies, not drafts: open to search engines, dated, with a grievance contact.
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
      await expect(page.getByText(/Last updated/)).toBeVisible();
      await expect(page.getByRole('main')).toContainText('grievance officer');
      await expect(page.getByRole('main').getByRole('link', { name: email }).first()).toBeVisible();
    }
    // Words next to links keep their spaces (Astro drops line breaks before inline elements).
    await page.goto('/privacy/');
    await expect(page.getByRole('main')).toContainText('You can verify this yourself');
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByRole('link', { name: /on GitHub/ })).toHaveAttribute(
      'href',
      'https://github.com/prasadbhalerao1',
    );
    await expect(footer.getByRole('link', { name: /on LinkedIn/ })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/prasadbhalerao/',
    );
    await expect(footer.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms/');
  });

  test('security headers are applied to site and frame', async ({ request }) => {
    const site = await request.get(TOOL_PATH);
    expect(site.headers()['content-security-policy']).toContain('frame-src http://127.0.0.1:4322');
    expect(site.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
    const frame = await request.get('http://127.0.0.1:4322/?tool=forms.photo-resizer');
    const csp = frame.headers()['content-security-policy'] ?? '';
    for (const directive of [
      "default-src 'none'",
      "connect-src 'self'",
      "form-action 'none'",
      "frame-src 'none'",
      "object-src 'none'",
      'frame-ancestors http://localhost:4321',
    ]) {
      expect(csp).toContain(directive);
    }
    expect(frame.headers()['x-robots-tag']).toBe('noindex, nofollow');
  });
});
