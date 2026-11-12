import { useEffect, useMemo, useState } from 'preact/hooks';
import qrcode from 'qrcode-generator';
import { downloadBlob } from '@niftyfix/runtime';
import {
  Button,
  Panel,
  RangeInput,
  SegmentedControl,
  SelectInput,
  TextInput,
  type ToolUiProps,
} from '@niftyfix/ui';
import { buildPayload, contrastRatio, modulesPath, type Fields, type Kind } from './payload';

// The library's default keeps only the low byte of each character; encode text as UTF-8,
// which every scanner reads, so names in Hindi, Marathi or emoji survive.
qrcode.stringToBytes = (text: string): number[] => Array.from(new TextEncoder().encode(text));

type Level = 'L' | 'M' | 'Q' | 'H';
/** Quiet zone in modules: the standard asks for 4. */
const MARGIN = 4;

const KINDS: { value: Kind; label: string }[] = [
  { value: 'url', label: 'Website link' },
  { value: 'text', label: 'Text' },
  { value: 'upi', label: 'UPI payment' },
  { value: 'wifi', label: 'Wi-Fi network' },
  { value: 'whatsapp', label: 'WhatsApp chat' },
  { value: 'contact', label: 'Contact card' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone call' },
  { value: 'sms', label: 'SMS' },
];

const FIELDS: Record<
  Kind,
  { key: string; label: string; placeholder?: string; multiline?: boolean }[]
> = {
  url: [{ key: 'url', label: 'Link', placeholder: 'niftyfix.in' }],
  text: [{ key: 'text', label: 'Text', multiline: true }],
  upi: [
    { key: 'pa', label: 'UPI ID', placeholder: 'yourname@okhdfcbank' },
    { key: 'pn', label: 'Name shown to the payer' },
    { key: 'am', label: 'Amount in rupees (optional)' },
    { key: 'tn', label: 'Note (optional)' },
  ],
  wifi: [
    { key: 'ssid', label: 'Network name (SSID)' },
    { key: 'password', label: 'Password' },
  ],
  whatsapp: [
    { key: 'phone', label: 'Phone number with country code', placeholder: '+91 98765 43210' },
    { key: 'message', label: 'Message (optional)' },
  ],
  contact: [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'org', label: 'Company' },
    { key: 'url', label: 'Website' },
  ],
  email: [
    { key: 'to', label: 'Email address' },
    { key: 'subject', label: 'Subject' },
    { key: 'body', label: 'Message', multiline: true },
  ],
  phone: [{ key: 'phone', label: 'Phone number' }],
  sms: [
    { key: 'phone', label: 'Phone number' },
    { key: 'message', label: 'Message' },
  ],
};

const presetKind = (preset: string | undefined): Kind =>
  preset === 'upi' ? 'upi' : preset === 'wifi' ? 'wifi' : 'url';

export default function QrCodeGenerator({ preset }: ToolUiProps) {
  const [kind, setKind] = useState<Kind>(presetKind(preset));
  const [fields, setFields] = useState<Fields>({ security: 'WPA' });
  const [level, setLevel] = useState<Level>('M');
  const [dark, setDark] = useState('#1c1917');
  const [light, setLight] = useState('#ffffff');
  const [size, setSize] = useState(1024);
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => () => (logo ? URL.revokeObjectURL(logo) : undefined), [logo]);

  const payload = buildPayload(kind, fields);
  // A logo hides the middle of the code; the highest error correction keeps it readable.
  const effectiveLevel: Level = logo ? 'H' : level;
  const code = useMemo(() => {
    if (!payload) return null;
    try {
      const qr = qrcode(0, effectiveLevel);
      qr.addData(payload);
      qr.make();
      return qr;
    } catch {
      return null;
    }
  }, [payload, effectiveLevel]);

  const count = code ? code.getModuleCount() : 0;
  const total = count + MARGIN * 2;
  const path = code ? modulesPath((r, c) => code.isDark(r, c), count, MARGIN) : '';
  const logoBox = total * 0.22;
  const svg = code
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="${light}"/><path d="${path}" fill="${dark}"/></svg>`
    : '';
  const ratio = contrastRatio(dark, light);
  const set = (key: string) => (value: string) => setFields({ ...fields, [key]: value });

  const downloadPng = async (): Promise<void> => {
    if (!code) return;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) return;
    const scale = size / total;
    context.fillStyle = light;
    context.fillRect(0, 0, size, size);
    context.fillStyle = dark;
    for (let r = 0; r < count; r += 1) {
      for (let c = 0; c < count; c += 1) {
        // Whole pixels per module edge, so modules never blur into each other.
        if (code.isDark(r, c)) {
          const x0 = Math.round((c + MARGIN) * scale);
          const y0 = Math.round((r + MARGIN) * scale);
          context.fillRect(
            x0,
            y0,
            Math.round((c + MARGIN + 1) * scale) - x0,
            Math.round((r + MARGIN + 1) * scale) - y0,
          );
        }
      }
    }
    if (logo) {
      const image = new Image();
      image.src = logo;
      await image.decode();
      const box = logoBox * scale;
      const at = (size - box) / 2;
      context.fillStyle = light;
      context.fillRect(at - scale, at - scale, box + 2 * scale, box + 2 * scale);
      const fit = Math.min(box / image.naturalWidth, box / image.naturalHeight);
      context.drawImage(
        image,
        (size - image.naturalWidth * fit) / 2,
        (size - image.naturalHeight * fit) / 2,
        image.naturalWidth * fit,
        image.naturalHeight * fit,
      );
    }
    canvas.toBlob((blob) => blob && downloadBlob(blob, `qr-code-${kind}.png`), 'image/png');
  };

  return (
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div class="flex min-w-0 flex-col gap-4">
        <Panel>
          <div class="flex flex-col gap-4">
            <SelectInput<Kind>
              label="QR code for"
              value={kind}
              options={KINDS}
              onChange={setKind}
              testId="kind"
            />
            {FIELDS[kind].map((field) =>
              field.multiline ? (
                <label key={field.key} class="flex flex-col gap-1.5 text-sm font-medium">
                  {field.label}
                  <textarea
                    rows={4}
                    class="w-full rounded-[var(--radius-control)] border border-stone-300 bg-paper p-3 font-normal dark:border-stone-700 dark:bg-stone-900"
                    value={fields[field.key] ?? ''}
                    onInput={(e) => set(field.key)(e.currentTarget.value)}
                    data-testid={`field-${field.key}`}
                  />
                </label>
              ) : (
                <TextInput
                  key={field.key}
                  label={field.label}
                  value={fields[field.key] ?? ''}
                  {...(field.placeholder ? { placeholder: field.placeholder } : {})}
                  onChange={set(field.key)}
                  testId={`field-${field.key}`}
                />
              ),
            )}
            {kind === 'wifi' ? (
              <SegmentedControl<string>
                label="Security"
                value={fields.security ?? 'WPA'}
                options={[
                  { value: 'WPA', label: 'WPA/WPA2/WPA3' },
                  { value: 'WEP', label: 'WEP' },
                  { value: 'nopass', label: 'None' },
                ]}
                onChange={set('security')}
              />
            ) : null}
          </div>
        </Panel>
        <Panel title="Look">
          <div class="grid gap-4 sm:grid-cols-2">
            <SegmentedControl<Level>
              label="Error correction"
              value={effectiveLevel}
              options={[
                { value: 'L', label: 'L' },
                { value: 'M', label: 'M' },
                { value: 'Q', label: 'Q' },
                { value: 'H', label: 'H' },
              ]}
              onChange={setLevel}
            />
            <RangeInput
              label="PNG size"
              value={size}
              min={256}
              max={2048}
              step={128}
              format={(v) => `${v} px`}
              onChange={setSize}
            />
            <label class="flex flex-col gap-1.5 text-sm font-medium">
              Code colour
              <input
                type="color"
                value={dark}
                onInput={(e) => setDark(e.currentTarget.value)}
                class="h-11 w-full cursor-pointer rounded-[var(--radius-control)]"
              />
            </label>
            <label class="flex flex-col gap-1.5 text-sm font-medium">
              Background
              <input
                type="color"
                value={light}
                onInput={(e) => setLight(e.currentTarget.value)}
                class="h-11 w-full cursor-pointer rounded-[var(--radius-control)]"
              />
            </label>
            <label class="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">
              Logo in the middle (optional)
              <input
                type="file"
                accept="image/*"
                class="text-sm font-normal"
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0];
                  setLogo(file ? URL.createObjectURL(file) : null);
                }}
              />
            </label>
          </div>
        </Panel>
      </div>
      <Panel title="Your QR code" class="h-fit">
        <div class="flex flex-col gap-4">
          {code ? (
            <div class="relative mx-auto w-full max-w-72" data-testid="qr-preview">
              <div
                class="w-full"
                dangerouslySetInnerHTML={{ __html: svg }}
                role="img"
                aria-label={`QR code for: ${payload}`}
              />
              {logo ? (
                <img
                  src={logo}
                  alt=""
                  class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain p-1"
                  style={{
                    width: `${(logoBox / total) * 100}%`,
                    height: `${(logoBox / total) * 100}%`,
                    backgroundColor: light,
                  }}
                />
              ) : null}
            </div>
          ) : (
            <p class="text-sm text-stone-600 dark:text-stone-400">
              {payload
                ? 'Too much text for one QR code. Shorten it.'
                : 'Fill in the details to see your QR code.'}
            </p>
          )}
          {code && ratio < 4 ? (
            <p class="text-sm text-amber-800 dark:text-amber-300">
              Low contrast: some phones may not scan it. Use a darker code colour on a light
              background.
            </p>
          ) : null}
          {code && contrastRatio(dark, '#000000') > contrastRatio(light, '#000000') ? (
            <p class="text-sm text-amber-800 dark:text-amber-300">
              Light code on a dark background: many scanners cannot read inverted codes.
            </p>
          ) : null}
          <div class="flex flex-wrap gap-2">
            <Button disabled={!code} onClick={() => void downloadPng()} data-testid="download-png">
              Download PNG
            </Button>
            <Button
              variant="secondary"
              disabled={!code || logo !== null}
              onClick={() =>
                downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `qr-code-${kind}.svg`)
              }
              data-testid="download-svg"
            >
              Download SVG
            </Button>
          </div>
          {code ? (
            <p
              class="break-all text-xs text-stone-600 dark:text-stone-400"
              data-testid="qr-payload"
            >
              Holds: {payload}
            </p>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
