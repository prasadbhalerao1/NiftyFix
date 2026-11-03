import type { PortalSpec, SizeTemplate } from './schema';

/**
 * Verified portal specifications.
 *
 * Intentionally empty: no specification has yet been verified against an
 * official notice. Third-party summaries conflict (see docs/IMPLEMENTATION_STATUS.md)
 * and several portals (SSC, UPSC) reportedly moved to live photo capture in
 * 2025–26. Add records only with an official https source and verification date.
 */
export const PORTAL_SPECS: readonly PortalSpec[] = [];

/** Pixel sizes derived from physical sizes; labelled as generic, not as any portal's rule. */
export const SIZE_TEMPLATES: readonly SizeTemplate[] = [
  {
    id: 'passport-35x45-300',
    label: '3.5 × 4.5 cm photo at 300 DPI',
    description: 'Common passport-size photo dimensions, 413 × 531 px.',
    width: 413,
    height: 531,
    dpi: 300,
  },
  {
    id: 'passport-35x45-200',
    label: '3.5 × 4.5 cm photo at 200 DPI',
    description: 'Same physical size at lower resolution, 276 × 354 px.',
    width: 276,
    height: 354,
    dpi: 200,
  },
  {
    id: 'square-600',
    label: 'Square 600 × 600 px',
    description: 'Square profile photo.',
    width: 600,
    height: 600,
  },
  {
    id: 'us-2x2-300',
    label: '2 × 2 inch photo at 300 DPI',
    description: '600 × 600 px, a size used for US documents.',
    width: 600,
    height: 600,
    dpi: 300,
  },
];
