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
  const pixels = spec.dimensions?.kind === 'exact-px' ? spec.dimensions : spec.workingPx;
  if (pixels) {
    settings.width = pixels.width;
    settings.height = pixels.height;
  }
  if (spec.minBytes !== undefined) settings.minKb = spec.minBytes / 1000;
  if (spec.maxBytes !== undefined) settings.maxKb = spec.maxBytes / 1000;
  if (spec.dpi !== undefined) settings.dpi = spec.dpi;
  return settings;
}

/** An exam or form a resizer can be set to, from the verified records. */
export interface ExamChoice {
  /** Portal spec id; the matching preset is `spec-${id}`. */
  id: string;
  /** e.g. "IBPS PO/MT-XVI (2026)" */
  label: string;
  /** What else the notice asks for, shown under the picker. */
  requirements: readonly string[];
  /** Host of the official source, e.g. "ibps.in". */
  sourceHost: string;
}

/** Verified exams and forms that state a KB range for this kind of upload. */
export function examChoices(documentType: 'photo' | 'signature'): ExamChoice[] {
  return PORTAL_SPECS.filter(
    (spec) => spec.documentType === documentType && spec.maxBytes !== undefined,
  ).map((spec) => ({
    id: spec.id,
    label: (spec.applicationName.split(':')[0] ?? spec.applicationName)
      .replace(/ online application$| application$/, '')
      .trim(),
    requirements: spec.otherRequirements,
    sourceHost: new URL(spec.source.url).hostname.replace(/^www\./, ''),
  }));
}
