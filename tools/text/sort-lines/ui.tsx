import { useMemo, useState } from 'preact/hooks';
import { processLines, type LineOptions, type SortOrder } from '@niftyfix/engine-text';
import { downloadBlob } from '@niftyfix/runtime';
import {
  Button,
  CheckboxInput,
  copyText,
  Panel,
  SelectInput,
  type ToolUiProps,
} from '@niftyfix/ui';

const AREA =
  'min-h-56 w-full resize-y rounded-[var(--radius-control)] border border-stone-300 bg-paper p-3 font-mono text-sm dark:border-stone-700 dark:bg-stone-900';

const SORTS: { value: SortOrder; label: string }[] = [
  { value: 'none', label: 'Keep the order' },
  { value: 'az', label: 'A to Z' },
  { value: 'za', label: 'Z to A' },
  { value: 'natural', label: 'Numbers in order (2 before 10)' },
  { value: 'length', label: 'Shortest first' },
  { value: 'shuffle', label: 'Shuffle' },
];

export default function SortLines({ preset }: ToolUiProps) {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<LineOptions>({
    trim: true,
    removeEmpty: true,
    removeDuplicates: preset !== 'sort',
    ignoreCase: false,
    sort: preset === 'sort' ? 'az' : 'none',
    reverse: false,
    number: false,
  });
  const [seed, setSeed] = useState(1);
  const [copied, setCopied] = useState(false);
  const result = useMemo(() => processLines(input, options, seed), [input, options, seed]);
  const set =
    <K extends keyof LineOptions>(key: K) =>
    (value: LineOptions[K]) =>
      setOptions({ ...options, [key]: value });

  return (
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div class="flex min-w-0 flex-col gap-4">
        <Panel>
          <div class="flex flex-col gap-1.5">
            <label htmlFor="lines-in" class="text-sm font-medium">
              Your list (one item per line)
            </label>
            <textarea
              id="lines-in"
              class={AREA}
              spellcheck={false}
              value={input}
              onInput={(e) => setInput(e.currentTarget.value)}
              data-testid="lines-in"
            />
          </div>
        </Panel>
        <Panel>
          <div class="flex flex-col gap-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-sm" data-testid="lines-stats">
                {result.after} of {result.before} lines
                {result.duplicates > 0 ? ` · ${result.duplicates} duplicates removed` : ''}
                {result.empty > 0 ? ` · ${result.empty} empty removed` : ''}
              </p>
              <div class="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  disabled={!result.text}
                  onClick={() =>
                    void copyText(result.text).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    })
                  }
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  variant="ghost"
                  disabled={!result.text}
                  onClick={() =>
                    downloadBlob(new Blob([result.text], { type: 'text/plain' }), 'lines.txt')
                  }
                >
                  Download .txt
                </Button>
              </div>
            </div>
            <label htmlFor="lines-out" class="sr-only">
              Result
            </label>
            <textarea
              id="lines-out"
              class={AREA}
              readOnly
              value={result.text}
              data-testid="lines-out"
            />
          </div>
        </Panel>
      </div>
      <Panel title="Clean and sort" class="h-fit">
        <div class="flex flex-col gap-4">
          <CheckboxInput
            label="Remove duplicate lines"
            checked={options.removeDuplicates}
            onChange={set('removeDuplicates')}
          />
          <CheckboxInput
            label="Ignore upper and lower case"
            hint="For duplicates and A to Z sorting."
            checked={options.ignoreCase}
            onChange={set('ignoreCase')}
          />
          <CheckboxInput
            label="Trim spaces at line ends"
            checked={options.trim}
            onChange={set('trim')}
          />
          <CheckboxInput
            label="Remove empty lines"
            checked={options.removeEmpty}
            onChange={set('removeEmpty')}
          />
          <SelectInput<SortOrder>
            label="Sort"
            value={options.sort}
            options={SORTS}
            onChange={set('sort')}
            testId="sort"
          />
          {options.sort === 'shuffle' ? (
            <Button variant="secondary" onClick={() => setSeed(seed + 1)}>
              Shuffle again
            </Button>
          ) : null}
          <CheckboxInput
            label="Reverse the order"
            checked={options.reverse}
            onChange={set('reverse')}
          />
          <CheckboxInput
            label="Number the lines"
            checked={options.number}
            onChange={set('number')}
          />
        </div>
      </Panel>
    </div>
  );
}
