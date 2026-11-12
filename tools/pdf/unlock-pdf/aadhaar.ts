/**
 * The e-Aadhaar PDF password, as UIDAI defines it: the first four letters of
 * the name in capitals (spaces skipped, other characters kept, the whole name
 * if shorter) followed by the year of birth. "Suresh Kumar", 1990 gives
 * SURE1990; "P. Kumar" gives P.KU1990; "Ria" gives RIA1990.
 */
export function aadhaarPassword(name: string, year: string): string {
  const letters = [...name.replace(/\s+/g, '').toUpperCase()].slice(0, 4).join('');
  return /^\d{4}$/.test(year.trim()) && letters ? `${letters}${year.trim()}` : '';
}
