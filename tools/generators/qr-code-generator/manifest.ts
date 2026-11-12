import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: 'generators.qr-code-generator',
  version: 1,
  slug: 'qr-code-generator',
  category: 'generators',
  status: 'live',
  name: 'QR Code Generator',
  h1: 'QR code generator: links, UPI, Wi-Fi, WhatsApp and more',
  tagline:
    'Make QR codes for websites, UPI payments, Wi-Fi, WhatsApp, contacts and text, with your colours and logo, as PNG or SVG. They never expire.',
  seoTitle: 'QR Code Generator: free, no expiry, with logo | NiftyFix',
  seoDescription:
    'Free QR code generator for links, UPI payments, Wi-Fi, WhatsApp, contacts and text. Add colours and a logo, download PNG or SVG. Codes never expire.',
  searchAliases: [
    'qr code generator',
    'upi qr code generator',
    'wifi qr code generator',
    'qr code with logo',
    'whatsapp qr code',
    'free qr code generator no expiry',
  ],
  input: { kind: 'interactive' },
  output: { formats: [] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'image',
  capabilities: {
    batch: false,
    cancellable: false,
    progress: 'determinate',
    verifiesOutput: false,
  },
  related: ['generators.password-generator', 'image.favicon-generator'],
});
