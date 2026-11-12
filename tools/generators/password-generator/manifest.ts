import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: 'generators.password-generator',
  version: 1,
  slug: 'password-generator',
  category: 'generators',
  status: 'live',
  name: 'Password Generator',
  h1: 'Password generator: strong, random passwords',
  tagline:
    'Make strong random passwords, easy-to-type passphrases or PINs with a secure generator, and check how strong any password really is.',
  seoTitle: 'Password Generator: strong random passwords, free | NiftyFix',
  seoDescription:
    "Generate strong random passwords, passphrases and PINs with your browser's secure random generator, and check any password's strength. Nothing sent.",
  searchAliases: [
    'password generator',
    'strong password generator',
    'random password generator',
    'password strength checker',
    'pin generator',
    'passphrase generator',
  ],
  input: { kind: 'interactive' },
  output: { formats: [] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'text',
  capabilities: {
    batch: false,
    cancellable: false,
    progress: 'determinate',
    verifiesOutput: false,
  },
  related: ['text.text-repeater', 'image.image-to-base64'],
});
