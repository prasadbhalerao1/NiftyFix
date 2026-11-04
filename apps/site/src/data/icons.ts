/**
 * Stroke icons (24×24 path data) for tool rows. Unknown ids get the generic
 * document icon, so a new tool never breaks a page.
 */
const DOC = 'M7 3h7l5 5v13H7zM14 3v5h5';

export const TOOL_ICONS: Record<string, string> = {
  'forms.photo-resizer': 'M4 5h16v14H4zM8 15a4 4 0 0 1 8 0M12 11.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4',
  'forms.signature-resizer': 'M3 17c3 0 4-8 7-8s1 8 4 8 3-4 4-4 2 2 3 2M3 21h18',
  'pdf.compress-pdf': 'M12 3v6m0 0 3-3m-3 3-3-3M12 21v-6m0 0 3 3m-3-3-3 3M4 12h16',
  'pdf.merge-pdf': 'M8 4h8l4 4v12H8zM16 4v4h4M4 8v12h12',
  'pdf.split-pdf': 'M6 3h12v7H6zM6 14h12v7H6z',
  'pdf.organize-pdf': 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  'pdf.rotate-pdf': 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  'pdf.extract-pdf-pages': 'M7 3h10v18H7zM10 8h4M10 12h4M3 12h4m0 0-2-2m2 2-2 2',
  'pdf.sign-pdf': 'M6 3h9l4 4v14H6zM9 17c1.5 0 2-3 3-3s1 2 2 2 1-1 2-1',
  'pdf.fill-pdf-form': 'M6 3h12v18H6zM9 8h6M9 12h6M9 16h3',
  'pdf.flatten-pdf': 'M4 8l8-4 8 4-8 4zM4 12l8 4 8-4M4 16l8 4 8-4',
  'pdf.watermark-pdf': 'M6 3h12v18H6zM9 15l6-6M10 9h5v5',
  'pdf.add-page-numbers': 'M6 3h12v18H6zM11 17h2M10 7h4M10 11h4',
  'pdf.crop-pdf': 'M6 2v16h16M2 6h16v16',
  'pdf.image-to-pdf': 'M3 5h12v10H3zM3 12l3-3 3 3 2-2 4 4M17 9h4v12H9v-4',
  'pdf.pdf-to-image': 'M9 3h12v10H9zM9 10l3-3 3 3 2-2 4 4M3 9h4v12h12v-4',
  'pdf.pdf-to-text': 'M6 3h12v18H6zM9 8h6M9 11h6M9 14h4',
  'pdf.pdf-metadata': 'M6 3h12v18H6zM12 8v.01M12 11v6',
};

export const toolIcon = (id: string): string => TOOL_ICONS[id] ?? DOC;
