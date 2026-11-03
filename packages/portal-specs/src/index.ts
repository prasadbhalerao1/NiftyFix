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
