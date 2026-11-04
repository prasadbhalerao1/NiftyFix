/**
 * Who runs NiftyFix and how to reach them: the single source for the About,
 * Contact, Privacy, Terms and Security pages and the footer.
 */
export const OPERATOR = {
  name: 'Prasad Bhalerao',
  region: 'Maharashtra, India',
  email: 'prasadbhalerao279@gmail.com',
  github: 'https://github.com/prasadbhalerao1',
  linkedin: 'https://www.linkedin.com/in/prasadbhalerao/',
} as const;

/** Shown on the Privacy and Terms pages; change it whenever either changes. */
export const LEGAL_UPDATED = '5 November 2026';

export const mailto = (subject?: string): string =>
  `mailto:${OPERATOR.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
