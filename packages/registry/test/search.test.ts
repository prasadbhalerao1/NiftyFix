import { describe, expect, it } from 'vitest';
import { queryTokens, searchRecords, type SearchRecord } from '../src';

const records: SearchRecord[] = [
  {
    kind: 'tool',
    id: 'forms.photo-resizer',
    name: 'Form Photo Resizer',
    path: '/forms/photo-resizer/',
    category: 'Form-ready',
    terms: 'form photo resizer resize photo for exam form passport size photo kb photo 50kb',
  },
  {
    kind: 'intent',
    id: 'forms.photo-resizer/resize-photo-to-50kb',
    name: 'Resize a photo to 50 KB',
    path: '/forms/resize-photo-to-50kb/',
    category: 'Form Photo Resizer',
    terms: 'resize a photo to 50 kb 50kb resize photo to 50kb form photo resizer',
  },
  {
    kind: 'intent',
    id: 'forms.photo-resizer/resize-photo-to-20kb',
    name: 'Resize a photo to 20 KB',
    path: '/forms/resize-photo-to-20kb/',
    category: 'Form Photo Resizer',
    terms: 'resize a photo to 20 kb 20kb resize photo to 20kb form photo resizer',
  },
  {
    kind: 'tool',
    id: 'pdf.merge-pdf',
    name: 'Merge PDF',
    path: '/pdf/merge-pdf/',
    category: 'PDF',
    terms: 'merge pdf combine pdf join pdf files',
  },
  {
    kind: 'planned',
    id: 'image.png-to-jpg',
    name: 'PNG to JPG',
    category: 'Image',
    terms: 'png to jpg png jpg image',
  },
  {
    kind: 'planned',
    id: 'pdf.repair-pdf',
    name: 'Repair PDF',
    category: 'PDF',
    terms: 'repair pdf pdf',
  },
];
const ids = (query: string): string[] => searchRecords(records, query).map((r) => r.id);

describe('queryTokens', () => {
  it('drops filler words and joins sizes to their units', () => {
    expect(queryTokens('Make this photo under 50 KB')).toEqual(['photo', '50kb']);
    expect(queryTokens('png → jpg')).toEqual(['png', 'jpg']);
    expect(queryTokens('compress to 1.5 MB')).toEqual(['compress', '1.5mb']);
  });
});

describe('searchRecords', () => {
  it('finds a size intent from a natural sentence', () => {
    expect(ids('make this photo under 50 kb')[0]).toBe('forms.photo-resizer/resize-photo-to-50kb');
    expect(ids('photo 20kb')[0]).toBe('forms.photo-resizer/resize-photo-to-20kb');
  });

  it('matches names, aliases and prefixes while typing', () => {
    expect(ids('combine pdf')[0]).toBe('pdf.merge-pdf');
    expect(ids('mer')[0]).toBe('pdf.merge-pdf');
    expect(ids('exam form')[0]).toBe('forms.photo-resizer');
  });

  it('finds format pairs, including planned tools without a page', () => {
    const [first] = searchRecords(records, 'png to jpg');
    expect(first).toMatchObject({ id: 'image.png-to-jpg', kind: 'planned' });
    expect(first?.path).toBeUndefined();
  });

  it('ranks built tools above planned ones for the same words', () => {
    expect(ids('pdf').indexOf('pdf.merge-pdf')).toBeLessThan(ids('pdf').indexOf('pdf.repair-pdf'));
  });

  it('falls back to the best partial match, and finds nothing for nonsense', () => {
    expect(ids('merge pdfx')).toContain('pdf.merge-pdf');
    expect(ids('zzz no such tool')).toEqual([]);
    expect(ids('qqqq')).toEqual([]);
    expect(ids('   ')).toEqual([]);
  });

  it('does not match a size as a prefix of a different size', () => {
    // No 5 KB page: the general tool comes first, not the 50 KB page.
    expect(ids('photo 5kb')[0]).toBe('forms.photo-resizer');
  });
});
