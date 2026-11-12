import { useMemo, useState } from 'preact/hooks';
import {
  compareLines,
  lineStats,
  normaliseJson,
  unifiedPatch,
  type Part,
  type Row,
} from '@niftyfix/engine-text';
import { downloadBlob } from '@niftyfix/runtime';
import { Button, CheckboxInput, cx, Panel, SegmentedControl, type ToolUiProps } from '@niftyfix/ui';

type Mode = 'text' | 'json';
type View = 'split' | 'unified';

const AREA =
  'min-h-48 w-full resize-y rounded-[var(--radius-control)] border border-stone-300 bg-paper p-3 font-mono text-sm dark:border-stone-700 dark:bg-stone-900';

function Highlighted({ parts, fallback }: { parts: Part[]; fallback: string }) {
  if (parts.length === 0) return <>{fallback || ' '}</>;
  return (
    <>
      {parts.map((part, i) =>
        part.op === 'equal' ? (
          <span key={i}>{part.text}</span>
        ) : (
          <mark
            key={i}
            class={cx(
              'rounded-sm',
              part.op === 'insert'
                ? 'bg-emerald-300 text-emerald-950 dark:bg-emerald-700 dark:text-emerald-50'
                : 'bg-red-300 text-red-950 dark:bg-red-800 dark:text-red-50',
            )}
          >
            {part.text}
          </mark>
        ),
      )}
    </>
  );
}

const ROW_TINT: Record<Row['type'], [string, string]> = {
  equal: ['', ''],
  change: ['bg-red-50 dark:bg-red-950/60', 'bg-emerald-50 dark:bg-emerald-950/60'],
  delete: ['bg-red-50 dark:bg-red-950/60', 'bg-stone-50 dark:bg-stone-900'],
  insert: ['bg-stone-50 dark:bg-stone-900', 'bg-emerald-50 dark:bg-emerald-950/60'],
};

function Cell({ side, tint }: { side: Row['left']; tint: string }) {
  return (
    <>
      <td class={cx('select-none px-2 text-right align-top text-xs text-stone-500', tint)}>
        {side?.line ?? ''}
      </td>
      <td class={cx('whitespace-pre-wrap break-all px-2 align-top', tint)}>
        {side ? <Highlighted parts={side.parts} fallback={side.text} /> : null}
      </td>
    </>
  );
}

function SplitView({ rows }: { rows: Row[] }) {
  return (
    <div class="overflow-x-auto">
      <table class="w-full border-collapse font-mono text-sm" data-testid="diff-table">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} data-type={row.type}>
              <Cell side={row.left} tint={ROW_TINT[row.type][0]} />
              <Cell side={row.right} tint={ROW_TINT[row.type][1]} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UnifiedView({ rows }: { rows: Row[] }) {
  const lines = rows.flatMap((row) =>
    row.type === 'equal'
      ? [{ sign: ' ', side: row.left, tint: '' }]
      : [
          ...(row.left ? [{ sign: '-', side: row.left, tint: ROW_TINT.delete[0] }] : []),
          ...(row.right ? [{ sign: '+', side: row.right, tint: ROW_TINT.insert[1] }] : []),
        ],
  );
  return (
    <div class="overflow-x-auto">
      <table class="w-full border-collapse font-mono text-sm" data-testid="diff-table">
        <tbody>
          {lines.map(({ sign, side, tint }, i) => (
            <tr key={i}>
              <td
                class={cx('w-6 select-none px-2 text-center align-top', tint)}
                aria-label={sign === '+' ? 'added' : sign === '-' ? 'removed' : undefined}
              >
                {sign}
              </td>
              <Cell side={side} tint={tint} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
}) {
  const id = `diff-${label.toLowerCase()}`;
  return (
    <div class="flex min-w-0 flex-col gap-1.5">
      <div class="flex items-center justify-between gap-2">
        <label htmlFor={id} class="text-sm font-medium">
          {label}
        </label>
        <label class="cursor-pointer text-sm text-brand-800 underline dark:text-brand-300">
          Open file
          <input
            type="file"
            class="sr-only"
            accept=".txt,.md,.csv,.json,.xml,.html,.css,.js,.ts,.py,.java,.c,.cpp,.sql,.yaml,.yml,.log,text/*"
            onChange={async (event) => {
              const file = event.currentTarget.files?.[0];
              if (file) onChange(await file.text());
            }}
          />
        </label>
      </div>
      <textarea
        id={id}
        class={AREA}
        spellcheck={false}
        value={value}
        onInput={(e) => onChange(e.currentTarget.value)}
        data-testid={id}
      />
    </div>
  );
}

export default function TextDiff({ preset }: ToolUiProps) {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [mode, setMode] = useState<Mode>(preset === 'json' ? 'json' : 'text');
  const [view, setView] = useState<View>('split');
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  const prepared = useMemo(() => {
    if (mode === 'text') return { ok: true as const, a: left, b: right };
    const a = normaliseJson(left);
    const b = normaliseJson(right);
    if (!a.ok) return { ok: false as const, error: `Original JSON: ${a.error}` };
    if (!b.ok) return { ok: false as const, error: `Changed JSON: ${b.error}` };
    return { ok: true as const, a: a.text, b: b.text };
  }, [left, right, mode]);
  const rows = useMemo(
    () =>
      prepared.ok && (left || right)
        ? compareLines(prepared.a, prepared.b, { ignoreCase, ignoreWhitespace })
        : null,
    [prepared, ignoreCase, ignoreWhitespace],
  );
  const stats = rows ? lineStats(rows) : null;
  const same = stats && stats.added + stats.removed + stats.changed === 0;

  return (
    <div class="flex flex-col gap-4">
      <Panel>
        <div class="flex flex-col gap-4">
          <div class="grid gap-4 md:grid-cols-2">
            <Input label="Original" value={left} onChange={setLeft} />
            <Input label="Changed" value={right} onChange={setRight} />
          </div>
          <div class="flex flex-wrap items-end gap-4">
            <SegmentedControl<Mode>
              label="Compare as"
              value={mode}
              options={[
                { value: 'text', label: 'Text' },
                { value: 'json', label: 'JSON' },
              ]}
              onChange={setMode}
            />
            <SegmentedControl<View>
              label="Show"
              value={view}
              options={[
                { value: 'split', label: 'Side by side' },
                { value: 'unified', label: 'Unified' },
              ]}
              onChange={setView}
            />
            <Button variant="ghost" onClick={() => (setLeft(right), setRight(left))}>
              Swap
            </Button>
          </div>
          <div class="flex flex-wrap gap-6">
            <CheckboxInput label="Ignore case" checked={ignoreCase} onChange={setIgnoreCase} />
            <CheckboxInput
              label="Ignore spaces and indentation"
              checked={ignoreWhitespace}
              onChange={setIgnoreWhitespace}
            />
          </div>
        </div>
      </Panel>
      {!prepared.ok ? (
        <p role="alert" class="text-sm text-red-800 dark:text-red-300" data-testid="diff-error">
          {prepared.error}
        </p>
      ) : null}
      {rows && stats ? (
        <Panel>
          <div class="flex flex-col gap-3">
            <div
              class="flex flex-wrap items-center justify-between gap-2"
              data-testid="diff-summary"
            >
              <p class="text-sm">
                {same ? (
                  <span class="font-semibold">No differences.</span>
                ) : (
                  <>
                    <span class="font-semibold text-emerald-800 dark:text-emerald-300">
                      {stats.added} lines added
                    </span>
                    {' · '}
                    <span class="font-semibold text-red-800 dark:text-red-300">
                      {stats.removed} removed
                    </span>
                    {' · '}
                    <span class="font-semibold">{stats.changed} changed</span>
                  </>
                )}
              </p>
              {!same ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    downloadBlob(
                      new Blob([unifiedPatch(rows, ['original.txt', 'changed.txt'])], {
                        type: 'text/x-diff',
                      }),
                      'changes.patch',
                    )
                  }
                >
                  Download .patch
                </Button>
              ) : null}
            </div>
            {view === 'split' ? <SplitView rows={rows} /> : <UnifiedView rows={rows} />}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
