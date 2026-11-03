/// <reference lib="webworker" />
import { hostProcessors, type ProcessorLoader } from '@niftyfix/runtime/worker';
import { processorLoaders } from '@niftyfix/tools/loaders';

// Map tool ids to lazy processor loaders; a processor (and its engines) loads on first use.
const loaders = new Map<string, ProcessorLoader>(
  [...processorLoaders].map(([dir, load]) => [dir.replace('/', '.'), load]),
);

hostProcessors(self as unknown as Parameters<typeof hostProcessors>[0], loaders);
