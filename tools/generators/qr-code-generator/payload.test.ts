import { describe, expect, it } from 'vitest';
import { buildPayload, contrastRatio, modulesPath } from './payload';

describe('buildPayload', () => {
  it('adds https to bare web addresses', () => {
    expect(buildPayload('url', { url: 'niftyfix.in' })).toBe('https://niftyfix.in');
    expect(buildPayload('url', { url: 'mailto:a@b.c' })).toBe('mailto:a@b.c');
  });

  it('builds Wi-Fi codes with escaping', () => {
    expect(buildPayload('wifi', { ssid: 'Home;Net', password: 'p:ss', security: 'WPA' })).toBe(
      'WIFI:T:WPA;S:Home\\;Net;P:p\\:ss;;',
    );
    expect(buildPayload('wifi', { ssid: 'Cafe', security: 'nopass' })).toBe(
      'WIFI:T:nopass;S:Cafe;;',
    );
  });

  it('builds UPI payment links that apps read', () => {
    expect(
      buildPayload('upi', { pa: 'shop@okhdfc', pn: 'Ram Stores', am: '250', tn: 'Order 12' }),
    ).toBe('upi://pay?pa=shop%40okhdfc&pn=Ram%20Stores&am=250.00&tn=Order%2012&cu=INR');
    expect(buildPayload('upi', { pn: 'No id' })).toBe('');
  });

  it('builds contacts, email, phone, SMS and WhatsApp', () => {
    expect(buildPayload('contact', { name: 'Asha, R', phone: '+91 98765 43210' })).toBe(
      'BEGIN:VCARD\nVERSION:3.0\nFN:Asha\\, R\nTEL:+919876543210\nEND:VCARD',
    );
    expect(buildPayload('email', { to: 'a@b.in', subject: 'Hi there' })).toBe(
      'mailto:a@b.in?subject=Hi%20there',
    );
    expect(buildPayload('phone', { phone: '+91 98765-43210' })).toBe('tel:+919876543210');
    expect(buildPayload('sms', { phone: '98765', message: 'Hi' })).toBe('SMSTO:98765:Hi');
    expect(buildPayload('whatsapp', { phone: '+91 98765 43210', message: 'Hello!' })).toBe(
      'https://wa.me/919876543210?text=Hello!',
    );
  });
});

describe('helpers', () => {
  it('measures contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21);
    expect(contrastRatio('#777777', '#888888')).toBeLessThan(1.5);
  });

  it('merges dark runs into one path segment per run', () => {
    const grid = [
      [true, true, false],
      [false, true, false],
      [false, false, false],
    ];
    expect(modulesPath((r, c) => grid[r]?.[c] ?? false, 3, 4)).toBe('M4 4h2v1h-2zM5 5h1v1h-1z');
  });
});
