import { discoverToolDirs, writeRegistry } from './lib/tools';

const { changed } = writeRegistry();
console.log(
  `${changed ? 'Updated' : 'Unchanged'} tools/registry.generated.ts and docs/tool-list.md (${discoverToolDirs().length} tools)`,
);
