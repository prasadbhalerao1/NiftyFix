/**
 * Lazy loaders for tool manifests, UIs and processors (Vite only). Each entry
 * becomes its own chunk, so opening one tool never downloads another tool's
 * code or engines. Keys are tool directories ("forms/photo-resizer").
 */
import type { ProcessorDefinition, ToolManifest } from '@niftyfix/tool-sdk';
import type { ToolUi } from '@niftyfix/ui';

type Loader<T> = () => Promise<{ default: T }>;

function byDirectory<T>(
  modules: Record<string, Loader<T>>,
  file: string,
): ReadonlyMap<string, Loader<T>> {
  return new Map(
    Object.entries(modules).map(([path, load]) => [path.slice(2, -(file.length + 1)), load]),
  );
}

export const manifestLoaders = byDirectory(
  import.meta.glob<{ default: ToolManifest }>('./*/*/manifest.ts'),
  'manifest.ts',
);

export const uiLoaders = byDirectory(
  import.meta.glob<{ default: ToolUi }>('./*/*/ui.tsx'),
  'ui.tsx',
);

export const processorLoaders = byDirectory(
  import.meta.glob<{ default: ProcessorDefinition }>('./*/*/processor.ts'),
  'processor.ts',
);

/** Tool ids are "<category>.<slug>" and live in "<category>/<slug>" (enforced by check-tools). */
export const toolDirFromId = (id: string): string => id.replace('.', '/');
