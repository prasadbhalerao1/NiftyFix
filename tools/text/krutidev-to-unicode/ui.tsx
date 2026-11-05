import { useMemo, useRef, useState } from 'preact/hooks';
import { downloadBlob } from '@niftyfix/runtime';
import { Button, Panel, SegmentedControl, type ToolUiProps } from '@niftyfix/ui';
import { detectDirection, krutiDevToUnicode, unicodeToKrutiDev, type Direction } from './krutidev';

type Choice = 'auto' | Direction;

const AREA =
  'w-full resize-y rounded-[var(--radius-control)] border border-stone-300 bg-white p-3 text-base leading-relaxed text-stone-900 placeholder:text-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-400';

export default function KrutiDevConverter({ preset }: ToolUiProps) {
  const [text, setText] = useState('');
  // The Unicode to Kruti Dev page opens in that direction.
  const [choice, setChoice] = useState<Choice>(preset === 'to-krutidev' ? 'to-krutidev' : 'auto');
  const [copied, setCopied] = useState(false);
  const output = useRef<HTMLTextAreaElement>(null);

  const detected = detectDirection(text);
  const direction: Direction = choice === 'auto' ? (detected ?? 'to-unicode') : choice;
  const result = useMemo(() => {
    if (direction === 'to-unicode') {
      return { text: krutiDevToUnicode(text), english: [], unsupported: [] };
    }
    return unicodeToKrutiDev(text);
  }, [text, direction]);
  const toKrutiDev = direction === 'to-krutidev';
  const alreadyUnicode = !toKrutiDev && /[\u0900-\u097f]/.test(text);

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(result.text);
    } catch {
      // Clipboard API blocked in this frame: select the text and use the older command.
      output.current?.select();
      document.execCommand('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const swap = (): void => {
    setText(result.text);
    setChoice(toKrutiDev ? 'to-unicode' : 'to-krutidev');
  };

  return (
    <div class="flex flex-col gap-4">
      <Panel>
        <div class="flex flex-wrap items-end justify-between gap-3">
          <SegmentedControl<Choice>
            label="Convert"
            value={choice}
            options={[
              { value: 'auto', label: 'Detect' },
              { value: 'to-unicode', label: 'Kruti Dev to Unicode' },
              { value: 'to-krutidev', label: 'Unicode to Kruti Dev' },
            ]}
            onChange={setChoice}
          />
          {choice === 'auto' && detected ? (
            <p class="nf-enter text-sm text-stone-600 dark:text-stone-400" data-testid="detected">
              {detected === 'to-unicode'
                ? 'Looks like Kruti Dev text: converting to Unicode.'
                : 'Looks like Unicode Hindi: converting to Kruti Dev.'}
            </p>
          ) : null}
        </div>
      </Panel>

      <div class="grid gap-4 lg:grid-cols-2">
        <Panel>
          <div class="mb-2 flex items-center justify-between gap-2">
            <label htmlFor="kd-input" class="text-sm font-medium">
              {toKrutiDev ? 'Unicode Hindi' : 'Kruti Dev text'}
            </label>
            <Button variant="ghost" disabled={text === ''} onClick={() => setText('')}>
              Clear
            </Button>
          </div>
          <textarea
            id="kd-input"
            rows={12}
            value={text}
            placeholder="Paste Kruti Dev text (it looks like Hkkjr) or Unicode Hindi (भारत)."
            onInput={(event) => setText(event.currentTarget.value)}
            data-testid="text-input"
            class={AREA}
          />
        </Panel>

        <Panel>
          <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="kd-output" class="text-sm font-medium">
              {toKrutiDev ? 'Kruti Dev 010' : 'Unicode Hindi'}
            </label>
            <div class="flex gap-1">
              <Button variant="ghost" disabled={text === ''} onClick={swap} data-testid="swap">
                Convert back
              </Button>
              <Button
                variant="ghost"
                disabled={text === ''}
                onClick={() =>
                  downloadBlob(
                    new Blob([result.text], { type: 'text/plain;charset=utf-8' }),
                    toKrutiDev ? 'krutidev.txt' : 'unicode-hindi.txt',
                  )
                }
              >
                Download
              </Button>
              <Button
                variant="secondary"
                disabled={text === ''}
                onClick={() => void copy()}
                data-testid="copy-text"
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
          <textarea
            id="kd-output"
            ref={output}
            readOnly
            rows={12}
            value={result.text}
            data-testid="text-output"
            class={AREA}
          />
          <div class="mt-3 flex flex-col gap-2 text-sm">
            {toKrutiDev && text !== '' ? (
              <p class="text-stone-600 dark:text-stone-400">
                Kruti Dev stores Hindi as Latin letters, so it looks like this until you paste it
                into Word or your typing software and choose the Kruti Dev 010 font.
              </p>
            ) : null}
            {result.english.length > 0 ? (
              <p class="nf-enter text-amber-800 dark:text-amber-300" data-testid="english-words">
                Kruti Dev has no English letters. Kept as they are:{' '}
                <strong>{result.english.slice(0, 12).join(', ')}</strong>
                {result.english.length > 12 ? ` and ${result.english.length - 12} more` : ''}. In
                Word, set these in an English font such as Arial, or they will show as Hindi
                letters.
              </p>
            ) : null}
            {result.unsupported.length > 0 ? (
              <p class="nf-enter text-amber-800 dark:text-amber-300" data-testid="unsupported">
                Kruti Dev cannot show <strong>{result.unsupported.join(' ')}</strong>; kept as they
                are.
                {result.unsupported.includes('₹') ? ' Write ₹ as रु. instead.' : ''}
                {result.unsupported.includes('%') ? ' Write % as प्रतिशत instead.' : ''}
              </p>
            ) : null}
            {alreadyUnicode ? (
              <p class="nf-enter text-amber-800 dark:text-amber-300" data-testid="already-unicode">
                Your text already has Unicode Hindi letters; they were kept as they are.
              </p>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
