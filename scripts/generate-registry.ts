import { discoverToolDirs, writeRegistry } from './lib/tools';

const { changed } = writeRegistry();
console.log(
  `${changed ? 'Updated' : 'Unchanged'} tools/registry.generated.ts (${discoverToolDirs().length} tools)`,
);
