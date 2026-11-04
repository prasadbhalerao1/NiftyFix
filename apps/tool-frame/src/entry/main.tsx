import { render } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { detectDeviceClass, JobRunner, poolSizeFor, WorkerPool } from '@niftyfix/runtime';
import type { ToolManifest } from '@niftyfix/tool-sdk';
import {
  manifestLoaders,
  processorLoaders,
  toolDirFromId,
  uiLoaders,
} from '@niftyfix/tools/loaders';
import { ErrorView, type ToolUi } from '@niftyfix/ui';
import { followParentTheme, forwardReveals, reportEvent, syncHeight } from '../runtime/parent';
import '../styles.css';

const TOOL_ID = /^[a-z]+\.[a-z0-9]+(-[a-z0-9]+)*$/;
const PRESET = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const TIMEOUT_MS = 120_000;

interface Loaded {
  manifest: ToolManifest;
  Ui: ToolUi;
}

async function loadTool(toolId: string | null): Promise<Loaded> {
  if (toolId === null || !TOOL_ID.test(toolId)) throw new Error('missing tool');
  const dir = toolDirFromId(toolId);
  const loadManifest = manifestLoaders.get(dir);
  const loadUi = uiLoaders.get(dir);
  if (!loadManifest || !loadUi) throw new Error('unknown tool');
  const [{ default: manifest }, { default: Ui }] = await Promise.all([loadManifest(), loadUi()]);
  if (manifest.status === 'draft') throw new Error('unpublished tool');
  return { manifest, Ui };
}

function App({ toolId, preset }: { toolId: string | null; preset: string | undefined }) {
  const [state, setState] = useState<
    { kind: 'loading' } | { kind: 'ready'; tool: Loaded } | { kind: 'missing' }
  >({ kind: 'loading' });
  const device = useMemo(detectDeviceClass, []);
  const pool = useMemo(
    () =>
      new WorkerPool({
        createWorker: () =>
          new Worker(new URL('../workers/processor.worker.ts', import.meta.url), {
            type: 'module',
          }),
        size: poolSizeFor(device, navigator.hardwareConcurrency || 2),
        timeoutMs: TIMEOUT_MS,
      }),
    [device],
  );
  // Falls back to the main thread only if this browser's workers cannot run the processor.
  const runner = useMemo(
    () => new JobRunner(pool, (id) => processorLoaders.get(toolDirFromId(id))),
    [pool],
  );

  useEffect(() => syncHeight(), []);
  useEffect(() => forwardReveals(), []);
  useEffect(() => () => pool.dispose(), [pool]);
  useEffect(() => {
    loadTool(toolId).then(
      (tool) => {
        setState({ kind: 'ready', tool });
        reportEvent(tool.manifest.id, 'tool_ready');
      },
      () => setState({ kind: 'missing' }),
    );
  }, [toolId]);

  if (state.kind === 'loading') return <p class="loading">Loading tool…</p>;
  if (state.kind === 'missing') {
    return (
      <ErrorView
        error={{
          code: 'UNKNOWN',
          message: 'This tool could not be loaded.',
          hint: 'Reload the page. If the problem continues, the tool may have moved.',
          retryable: false,
        }}
      />
    );
  }
  const { manifest, Ui } = state.tool;
  return (
    <main class="p-px">
      <Ui
        manifest={manifest}
        device={device}
        run={(files, options, handlers) =>
          runner.run(
            manifest.id,
            (Array.isArray(files) ? files : [files]).map((file: File) => ({
              name: file.name,
              bytes: file.size,
              blob: file,
            })),
            options,
            handlers,
          )
        }
        preload={() => runner.preload(manifest.id)}
        report={(event, detail) => reportEvent(manifest.id, event, detail?.code)}
        {...(preset === undefined ? {} : { preset })}
      />
    </main>
  );
}

// Listen before rendering so the theme sent in reply to the first message is not missed.
followParentTheme();

const root = document.getElementById('app');
if (root) {
  root.textContent = '';
  const params = new URLSearchParams(location.search);
  const preset = params.get('preset');
  render(
    <App
      toolId={params.get('tool')}
      preset={preset !== null && PRESET.test(preset) ? preset : undefined}
    />,
    root,
  );
}
