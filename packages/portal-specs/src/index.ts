import * as v from 'valibot';
import { PORTAL_SPECS, SIZE_TEMPLATES } from './data';
import { PortalSpecSchema } from './schema';

export { PORTAL_SPECS, SIZE_TEMPLATES };
export * from './schema';

/** Validate every record and check ids are unique. Returns human-readable problems. */
export function validatePortalSpecs(specs: readonly unknown[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  specs.forEach((spec, index) => {
    const result = v.safeParse(PortalSpecSchema, spec);
    if (!result.success) {
      const issues = result.issues.map(
        (issue) => `${v.getDotPath(issue) ?? '(root)'}: ${issue.message}`,
      );
      problems.push(`portal spec #${index}: ${issues.join('; ')}`);
      return;
    }
    if (ids.has(result.output.id)) problems.push(`duplicate portal spec id "${result.output.id}"`);
    ids.add(result.output.id);
  });
  return problems;
}

/** Output settings a resizer can start from: a portal's stated pixels, KB range and DPI. */
export interface SpecSettings {
  width?: number;
  height?: number;
  minKb?: number;
  maxKb?: number;
  dpi?: number;
}

/**
 * Settings for an intent page preset "spec-<portal spec id>", e.g. "spec-ibps-po-2026-photo".
 * Returns null for any other preset.
 */
export function specPresetSettings(preset: string | undefined): SpecSettings | null {
  if (!preset?.startsWith('spec-')) return null;
  const spec = PORTAL_SPECS.find((candidate) => candidate.id === preset.slice('spec-'.length));
  if (!spec) return null;
  const settings: SpecSettings = {};
  if (spec.dimensions?.kind === 'exact-px') {
    settings.width = spec.dimensions.width;
    settings.height = spec.dimensions.height;
  }
  if (spec.minBytes !== undefined) settings.minKb = spec.minBytes / 1000;
  if (spec.maxBytes !== undefined) settings.maxKb = spec.maxBytes / 1000;
  if (spec.dpi !== undefined) settings.dpi = spec.dpi;
  return settings;
}
