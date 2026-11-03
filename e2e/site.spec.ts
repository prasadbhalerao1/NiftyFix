import { expect, test } from '@playwright/test';
import { recordProblems, TOOL_PATH } from './helpers';

test.describe('site', () => {
  test('homepage lists tools and search filters them', async ({ page }) => {
    const problems = recordProblems(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Get your files ready');
    const card = page.getByRole('link', { name: /Form Photo Resizer/ });
    await expect(card).toBeVisible();

    await page.getByLabel('What do you need to do?').fill('exam form photo');
    await expect(card).toBeVisible();
    await page.getByLabel('What do you need to do?').fill('zzz no such tool');
    await expect(card).toBeHidden();
    await expect(page.getByText('No tool matches that yet')).toBeVisible();

    await page.getByLabel('What do you need to do?').fill('photo');
    await page.getByLabel('What do you need to do?').press('Enter');
    await expect(page).toHaveURL(TOOL_PATH);
    expect(problems).toEqual([]);
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
    // Beta tools stay out of the index until they pass the acceptance checklist.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = jsonLd.map((text) => (JSON.parse(text) as { '@type': string })['@type']);
    expect(types).toEqual(['BreadcrumbList', 'WebApplication']);
    expect(jsonLd.join('')).not.toContain('FAQPage');
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
    expect(sitemap).not.toContain('photo-resizer'); // beta tools are not submitted for indexing
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
    ]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
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
