import type { PortalSpec, SizeTemplate } from './schema';

/**
 * Verified portal specifications.
 *
 * Add records only from an official https source, with the date it was read.
 * Third-party summaries conflict (see docs/IMPLEMENTATION_STATUS.md), so a
 * requirement the source does not state is listed in `unspecified`, never
 * guessed. Exam portals (SSC, UPSC) are not here: several moved to live photo
 * capture in 2025 and 2026.
 */
export const PORTAL_SPECS: readonly PortalSpec[] = [
  {
    id: 'india-passport-photo-print',
    portalName: 'Passport Seva (Ministry of External Affairs, India)',
    applicationName: 'Passport application photograph (printed, pasted on the form)',
    documentType: 'photo',
    dimensions: { kind: 'physical-cm', widthCm: 3.5, heightCm: 4.5, assumedDpi: 600 },
    byteConvention: 'not-stated',
    formats: ['jpeg'],
    background: 'Plain white',
    otherRequirements: [
      'Colour photograph, printed on good quality photo paper',
      'Dress in a dark colour',
      'Frontal view of the full face; head in the centre of the frame; both ears visible',
      'Eyes open; both edges of the face clearly visible',
    ],
    unspecified: [
      'Head height (not stated)',
      'File size and pixels (the photo is printed; no photo is needed at a Passport Seva Kendra)',
    ],
    source: {
      url: 'https://www.passportindia.gov.in/AppOnlineProject/pdf/ApplicationformInstructionBooklet-V3.0.pdf',
      title: 'Passport application form instruction booklet, version 3.0',
    },
    verifiedAt: '2026-11-05',
    verifiedBy: 'NiftyFix, from the official PDF',
    version: 1,
    notes:
      'The booklet states 4.5 cm length by 3.5 cm width. 600 DPI is our print resolution for sharp prints, not a portal rule.',
  },
  {
    id: 'india-visa-photo-online',
    portalName: 'Indian Visa Online (indianvisaonline.gov.in)',
    applicationName: 'Regular visa application, photo upload',
    documentType: 'photo',
    dimensions: { kind: 'square-px-range', minSide: 350, maxSide: 1000 },
    minBytes: 10_000,
    maxBytes: 300_000,
    byteConvention: 'not-stated',
    formats: ['jpeg'],
    otherRequirements: ['Height and width of the photo must be equal'],
    unspecified: ['Background colour', 'Head size', 'Whether the e-Visa uses the same limits'],
    source: {
      url: 'https://indianvisaonline.gov.in/visa/VSS_IMAGE.pdf',
      title: 'Online Visa Photo Upload Process',
    },
    verifiedAt: '2026-11-05',
    verifiedBy: 'NiftyFix, from the official PDF',
    version: 1,
  },
  {
    id: 'us-passport-photo',
    portalName: 'U.S. Department of State',
    applicationName: 'U.S. passport photo',
    documentType: 'photo',
    dimensions: { kind: 'physical-cm', widthCm: 5.08, heightCm: 5.08, assumedDpi: 600 },
    headHeightMm: { min: 25, max: 35 },
    byteConvention: 'not-stated',
    formats: ['jpeg'],
    background: 'White',
    otherRequirements: [
      'In colour, printed on photo quality paper',
      '2 x 2 inches (51 x 51 mm)',
      'Head between 1 inch and 1 3/8 inches (25 to 35 mm) from the bottom of the chin to the top of the head',
      'Taken within the last 6 months',
    ],
    unspecified: ['Pixels and file size for online renewal (separate rules)'],
    source: {
      url: 'https://cz.usembassy.gov/photos/',
      title: 'Photos, U.S. Embassy in the Czech Republic (State Department requirements)',
    },
    verifiedAt: '2026-11-05',
    verifiedBy: 'NiftyFix, from the official page',
    version: 1,
    notes: '600 DPI is our print resolution (1200 x 1200 px), not a stated requirement.',
  },
  {
    id: 'uk-passport-photo-print',
    portalName: 'GOV.UK (HM Passport Office)',
    applicationName: 'UK passport photo, printed',
    documentType: 'photo',
    dimensions: { kind: 'physical-cm', widthCm: 3.5, heightCm: 4.5, assumedDpi: 600 },
    headHeightMm: { min: 29, max: 34 },
    byteConvention: 'not-stated',
    formats: ['jpeg'],
    background: 'Plain cream or light grey',
    otherRequirements: [
      '45 mm high by 35 mm wide',
      'Crown of the head to the chin between 29 mm and 34 mm high',
      'Two identical photos for a paper application',
    ],
    unspecified: ['Digital photo rules (on a separate GOV.UK page)'],
    source: {
      url: 'https://www.gov.uk/photos-for-passports/photo-requirements',
      title: 'Get a passport photo: printed photos',
    },
    verifiedAt: '2026-11-05',
    verifiedBy: 'NiftyFix, from the official page',
    version: 1,
    notes: '600 DPI is our print resolution, not a stated requirement.',
  },
];

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
