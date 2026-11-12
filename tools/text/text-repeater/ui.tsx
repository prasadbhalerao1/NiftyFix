import { useMemo, useState } from 'preact/hooks';
import { repeatText, type Separator } from '@niftyfix/engine-text';
import { downloadBlob } from '@niftyfix/runtime';
import {
  Button,
  CheckboxInput,
  copyText,
  NumberInput,
  Panel,
  SegmentedControl,
  TextInput,
  type ToolUiProps,
} from '@niftyfix/ui';

/** WhatsApp cuts messages longer than this many characters. */
const WHATSAPP_LIMIT = 65_536;
const AREA =
  'w-full resize-y rounded-[var(--radius-control)] border border-stone-300 bg-paper p-3 text-sm dark:border-stone-700 dark:bg-stone-900';

export default function TextRepeater(_props: ToolUiProps) {
  const [text, setText] = useState('');
  const [times, setTimes] = useState<number | null>(10);
  const [separator, setSeparator] = useState<Separator>('newline');
  const [custom, setCustom] = useState(' ');
  const [numbered, setNumbered] = useState(false);
  const [copied, setCopied] = useState(false);
  const output = useMemo(
    () => (text ? repeatText(text, times ?? 0, separator, custom, numbered) : ''),
    [text, times, separator, custom, numbered],
  );
  const length = [...output].length;

  return (
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div class="flex min-w-0 flex-col gap-4">
        <Panel>
          <div class="flex flex-col gap-1.5">
            <label htmlFor="repeat-in" class="text-sm font-medium">
              Text or emoji to repeat
            </label>
            <textarea
              id="repeat-in"
              rows={3}
              class={AREA}
              value={text}
              onInput={(e) => setText(e.currentTarget.value)}
              data-testid="repeat-in"
            />
          </div>
        </Panel>
        <Panel>
          <div class="flex flex-col gap-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-sm" data-testid="repeat-stats">
                {length.toLocaleString('en-IN')} characters
                {length > WHATSAPP_LIMIT ? ' · longer than one WhatsApp message' : ''}
              </p>
              <div class="flex flex-wrap gap-2">
                <Button
                  disabled={!output}
                  onClick={() =>
                    void copyText(output).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    })
                  }
                  data-testid="copy"
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  variant="ghost"
                  disabled={!output}
                  onClick={() =>
                    downloadBlob(new Blob([output], { type: 'text/plain' }), 'repeated.txt')
                  }
                >
                  Download .txt
                </Button>
              </div>
            </div>
            <label htmlFor="repeat-out" class="sr-only">
              Repeated text
            </label>
            <textarea
              id="repeat-out"
              rows={10}
              readOnly
              class={AREA}
              value={output}
              data-testid="repeat-out"
            />
          </div>
        </Panel>
      </div>
      <Panel title="Repeat" class="h-fit">
        <div class="flex flex-col gap-4">
          <NumberInput
            label="Times"
            value={times}
            min={1}
            max={100000}
            step={1}
            onChange={setTimes}
            testId="times"
            hint="Up to 100,000."
          />
          <SegmentedControl<Separator>
            label="Between copies"
            value={separator}
            options={[
              { value: 'newline', label: 'New line' },
              { value: 'space', label: 'Space' },
              { value: 'none', label: 'Nothing' },
              { value: 'comma', label: 'Comma' },
              { value: 'custom', label: 'Custom' },
            ]}
            onChange={setSeparator}
          />
          {separator === 'custom' ? (
            <TextInput label="Custom separator" value={custom} onChange={setCustom} />
          ) : null}
          <CheckboxInput label="Number each copy" checked={numbered} onChange={setNumbered} />
        </div>
      </Panel>
    </div>
  );
}
