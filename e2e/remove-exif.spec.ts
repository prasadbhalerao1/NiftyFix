import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { readJpegOrientation } from '../packages/engines/image/src/exif';
import { readMetadata } from '../packages/engines/image/src/metadata';
import { withGpsExif } from '../packages/engines/image/test/samples';
import { fixture } from './helpers';
import { openPdfTool } from './pdf-helpers';

const PATH = '/image/remove-exif/';
const CHOOSE = /Choose a photo/;

test.describe('Remove EXIF and GPS Data', () => {
  test('shows the location, removes it, and the image data is unchanged', async ({ page }) => {
    const input = withGpsExif(
      new Uint8Array(readFileSync(fixture('images/portrait-1200x1600.jpg'))),
    );
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame
      .getByTestId('file-input')
      .setInputFiles({ name: 'trip.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(input) });
    const found = frame.getByTestId('metadata');
    await expect(found).toContainText('includes location');
    await expect(found).toContainText('12.50000, 77.25000');
    await expect(found).toContainText('TestCam');

    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('result')).toBeVisible({ timeout: 30_000 });
    await expect(
      frame.getByTestId('validation-report').locator('[data-status="fail"]'),
    ).toHaveCount(0);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      frame.getByTestId('download').click(),
    ]);
    expect(download.suggestedFilename()).toBe('trip-clean.jpg');
    const output = new Uint8Array(readFileSync(await download.path()));
    expect(readMetadata(output, 'jpeg')).toEqual({
      kinds: [],
      items: [],
      hasLocation: false,
      orientation: 1,
    });
    // The original image is exactly what remains once the inserted block is removed.
    expect(Buffer.from(output).equals(readFileSync(fixture('images/portrait-1200x1600.jpg')))).toBe(
      true,
    );
  });

  test('a sideways photo keeps only its rotation', async ({ page }) => {
    const frame = await openPdfTool(page, '/image/remove-location-from-photo/', CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(fixture('images/exif-rotated-6.jpg'));
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('result')).toContainText('rotation tag was kept');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      frame.getByTestId('download').click(),
    ]);
    const output = new Uint8Array(readFileSync(await download.path()));
    expect(readJpegOrientation(output)).toBe(6);
    expect(readMetadata(output, 'jpeg').items).toEqual([]);
  });

  test('the viewer page says when there is nothing to remove', async ({ page }) => {
    const frame = await openPdfTool(page, '/image/exif-viewer/', CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(fixture('images/transparent-800x800.png'));
    await expect(frame.getByTestId('metadata')).toContainText('No metadata found');
  });
});
