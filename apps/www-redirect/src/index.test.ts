import { describe, expect, it } from 'vitest';
import worker, { canonicalUrl } from './index';

describe('www redirect', () => {
  it('keeps the path and query, and always lands on https without www', () => {
    expect(canonicalUrl('http://www.niftyfix.in/pdf/merge-pdf/?a=1')).toBe(
      'https://niftyfix.in/pdf/merge-pdf/?a=1',
    );
    expect(canonicalUrl('https://www.niftyfix.in/')).toBe('https://niftyfix.in/');
  });

  it('answers with a permanent redirect', () => {
    const response = worker.fetch(new Request('https://www.niftyfix.in/forms/'));
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('https://niftyfix.in/forms/');
  });
});
