import { useMemo, useState } from 'preact/hooks';
import { cleanText, type CleanOptions } from '@niftyfix/engine-text';
import { Button, CheckboxInput, copyText, Panel, type ToolUiProps } from '@niftyfix/ui';

const AREA =
  'min-h-48 w-full resize-y rounded-[var(--radius-control)] border border-stone-300 bg-paper p-3 text-sm dark:border-stone-700 dark:bg-stone-900';

const LABELS: { key: keyof CleanOptions; label: string; hint?: string }[] = [
  {
    key: 'joinLines',
    label: 'Join broken lines',
    hint: 'For text copied from PDFs and emails: keeps paragraphs.',
  },
  {
    key: 'removeAllBreaks',
    label: 'Remove all line breaks',
    hint: 'Everything on one line, paragraphs too.',
  },
  { key: 'collapseSpaces', label: 'Remove extra spaces and tabs' },
  { key: 'trimLines', label: 'Trim spaces at line ends' },
  { key: 'removeEmptyLines', label: 'Remove empty lines' },
  {
    key: 'plainPunctuation',
    label: 'Plain quotes, dashes and dots',
    hint: 'Curly quotes and long dashes to keyboard characters.',
  },
  { key: 'stripHtml', label: 'Remove HTML tags' },
  { key: 'removeEmoji', label: 'Remove emoji' },
  {
    key: 'removeInvisible',
    label: 'Remove invisible characters',
    hint: 'Zero-width spaces and soft hyphens that break searches and forms.',
  },
];

export default function TextCleaner({ preset }: ToolUiProps) {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<CleanOptions>({
    joinLines: preset !== 'all',
    removeAllBreaks: preset === 'all',
    collapseSpaces: true,
    trimLines: true,
    removeEmptyLines: false,
    plainPunctuation: false,
    stripHtml: false,
    removeEmoji: false,
    removeInvisible: true,
  });
  const [copied, setCopied] = useState(false);
  const output = useMemo(() => cleanText(input, options), [input, options]);

  return (
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div class="flex min-w-0 flex-col gap-4">
        <Panel>
          <div class="flex flex-col gap-1.5">
            <label htmlFor="clean-in" class="text-sm font-medium">
              Your text
            </label>
            <textarea
              id="clean-in"
              class={AREA}
              value={input}
              onInput={(e) => setInput(e.currentTarget.value)}
              data-testid="clean-in"
            />
          </div>
        </Panel>
        <Panel>
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-2">
              <label htmlFor="clean-out" class="text-sm font-medium">
                Clean text
              </label>
              <Button
                variant="secondary"
                disabled={!output}
                onClick={() =>
                  void copyText(output).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  })
                }
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <textarea id="clean-out" class={AREA} readOnly value={output} data-testid="clean-out" />
          </div>
        </Panel>
      </div>
      <Panel title="Clean" class="h-fit">
        <div class="flex flex-col gap-4">
          {LABELS.map(({ key, label, hint }) => (
            <CheckboxInput
              key={key}
              label={label}
              {...(hint ? { hint } : {})}
              checked={options[key]}
              onChange={(value) =>
                setOptions({
                  ...options,
                  [key]: value,
                  // The two line-break modes exclude each other.
                  ...(key === 'joinLines' && value ? { removeAllBreaks: false } : {}),
                  ...(key === 'removeAllBreaks' && value ? { joinLines: false } : {}),
                })
              }
            />
          ))}
        </div>
      </Panel>
    </div>
  );
}
