/**
 * What a QR code holds for each kind of content, in the formats phone
 * cameras and apps understand. Pure and unit-tested.
 */
export type Kind =
  'url' | 'text' | 'wifi' | 'upi' | 'contact' | 'email' | 'phone' | 'sms' | 'whatsapp';

export type Fields = Record<string, string>;

/** Wi-Fi QR fields escape \ ; , : and " with a backslash. */
const wifiEscape = (value: string): string => value.replace(/([\\;,:"])/g, '\\$1');
/** vCard text escapes backslash, comma, semicolon and new lines. */
const vcardEscape = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
const digits = (value: string): string => value.replace(/[^\d+]/g, '');

export function buildPayload(kind: Kind, f: Fields): string {
  const v = (key: string): string => (f[key] ?? '').trim();
  switch (kind) {
    case 'url': {
      const url = v('url');
      return url && !/^[a-z][a-z0-9+.-]*:/i.test(url) ? `https://${url}` : url;
    }
    case 'wifi': {
      const security = v('security') || 'WPA';
      const password = security === 'nopass' ? '' : `P:${wifiEscape(f.password ?? '')};`;
      return v('ssid')
        ? `WIFI:T:${security};S:${wifiEscape(f.ssid ?? '')};${password}${f.hidden === 'true' ? 'H:true;' : ''};`
        : '';
    }
    case 'upi': {
      if (!v('pa')) return '';
      const params = new URLSearchParams({ pa: v('pa') });
      if (v('pn')) params.set('pn', v('pn'));
      if (v('am')) params.set('am', Number(v('am')).toFixed(2));
      if (v('tn')) params.set('tn', v('tn'));
      params.set('cu', 'INR');
      // UPI apps expect %20 for spaces, not +.
      return `upi://pay?${params.toString().replace(/\+/g, '%20')}`;
    }
    case 'contact': {
      if (!v('name')) return '';
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${vcardEscape(v('name'))}`,
        v('org') ? `ORG:${vcardEscape(v('org'))}` : '',
        v('phone') ? `TEL:${digits(v('phone'))}` : '',
        v('email') ? `EMAIL:${v('email')}` : '',
        v('url') ? `URL:${v('url')}` : '',
        'END:VCARD',
      ]
        .filter(Boolean)
        .join('\n');
    }
    case 'email': {
      if (!v('to')) return '';
      const params = new URLSearchParams();
      if (v('subject')) params.set('subject', v('subject'));
      if (v('body')) params.set('body', f.body ?? '');
      const query = params.toString().replace(/\+/g, '%20');
      return `mailto:${v('to')}${query ? `?${query}` : ''}`;
    }
    case 'phone':
      return v('phone') ? `tel:${digits(v('phone'))}` : '';
    case 'sms':
      return v('phone') ? `SMSTO:${digits(v('phone'))}:${f.message ?? ''}` : '';
    case 'whatsapp': {
      const number = digits(v('phone')).replace(/^\+/, '');
      if (!number) return '';
      return `https://wa.me/${number}${v('message') ? `?text=${encodeURIComponent(v('message'))}` : ''}`;
    }
    default:
      return f.text ?? '';
  }
}

/** WCAG contrast ratio between two #rrggbb colours (scanners need dark on light). */
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string): number => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const c = (x: number): number => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
    return 0.2126 * c(r ?? 0) + 0.7152 * c(g ?? 0) + 0.0722 * c(bl ?? 0);
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** An SVG path of every dark module, one rectangle each, merged per row run. */
export function modulesPath(
  isDark: (row: number, col: number) => boolean,
  count: number,
  margin: number,
): string {
  const parts: string[] = [];
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count;) {
      if (!isDark(row, col)) {
        col += 1;
        continue;
      }
      let run = 1;
      while (col + run < count && isDark(row, col + run)) run += 1;
      parts.push(`M${col + margin} ${row + margin}h${run}v1h-${run}z`);
      col += run;
    }
  }
  return parts.join('');
}
