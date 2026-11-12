import { describe, expect, it } from 'vitest';
import { aadhaarPassword } from './aadhaar';

describe('aadhaarPassword', () => {
  it('follows the UIDAI examples', () => {
    expect(aadhaarPassword('Suresh Kumar', '1990')).toBe('SURE1990');
    expect(aadhaarPassword('P. Kumar', '1990')).toBe('P.KU1990');
    expect(aadhaarPassword('Ria', '1990')).toBe('RIA1990');
  });

  it('waits for a name and a four-digit year', () => {
    expect(aadhaarPassword('', '1990')).toBe('');
    expect(aadhaarPassword('Suresh', '90')).toBe('');
  });
});
