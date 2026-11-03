import { createRegistry } from '@niftyfix/registry';
import { TOOL_ENTRIES } from '@niftyfix/tools/registry';

/** The site's single registry instance, built from the generated tool index. */
export const registry = createRegistry(TOOL_ENTRIES);

export const SITE_NAME = 'NiftyFix';
export const SITE_ORIGIN = import.meta.env.PUBLIC_SITE_ORIGIN;
export const FRAME_ORIGIN = import.meta.env.PUBLIC_FRAME_ORIGIN;

export const absoluteUrl = (path: string): string => new URL(path, SITE_ORIGIN).href;
