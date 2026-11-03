export type DeviceClass = 'low' | 'mid' | 'high';

interface NavigatorHints {
  hardwareConcurrency?: number;
  deviceMemory?: number;
  userAgent?: string;
  maxTouchPoints?: number;
}

/**
 * Coarse device class used for limits and concurrency. `deviceMemory` exists
 * only in Chromium; elsewhere we assume touch devices are memory constrained.
 */
export function classifyDevice(nav: NavigatorHints): DeviceClass {
  const memory = nav.deviceMemory;
  const cores = nav.hardwareConcurrency ?? 4;
  const touch =
    (nav.maxTouchPoints ?? 0) > 0 || /Android|iPhone|iPad|Mobile/i.test(nav.userAgent ?? '');
  if (memory !== undefined) {
    if (memory <= 2 || cores <= 2) return 'low';
    if (memory <= 4 || touch) return 'mid';
    return 'high';
  }
  if (touch) return cores <= 4 ? 'low' : 'mid';
  return cores <= 2 ? 'mid' : 'high';
}

export function detectDeviceClass(): DeviceClass {
  return classifyDevice(navigator as NavigatorHints);
}

export function poolSizeFor(device: DeviceClass, cores: number): number {
  const cap = device === 'low' ? 1 : device === 'mid' ? 2 : 4;
  return Math.max(1, Math.min(cap, cores - 1));
}
