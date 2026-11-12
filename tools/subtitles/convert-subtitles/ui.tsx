import { useMemo, useState } from 'preact/hooks';
import { parseSubtitles, retime, writeSubtitles, type SubtitleFormat } from '@niftyfix/engine-text';
import { downloadBlob } from '@niftyfix/runtime';
import {
  Button,
  CheckboxInput,
  copyText,
  Dropzone,
  NumberInput,
  Panel,
  SegmentedControl,
  SelectInput,
  type ToolUiProps,
} from '@niftyfix/ui';

const AREA =
  'min-h-48 w-full resize-y rounded-[var(--radius-control)] border border-stone-300 bg-paper p-3 font-mono text-xs dark:border-stone-700 dark:bg-stone-900';

const NAMES: Record<SubtitleFormat, string> = {
  srt: 'SRT',
  vtt: 'WebVTT',
  ass: 'ASS',
  sbv: 'YouTube SBV',
  txt: 'Plain text',
};

/** Frame-rate fixes: subtitles timed for one rate, played at another. */
const RATES = [
  { value: '1', label: 'No change' },
  { value: String(25 / 23.976), label: '23.976 → 25 fps (PAL speed-up)' },
  { value: String(23.976 / 25), label: '25 → 23.976 fps' },
  { value: String(25 / 24), label: '24 → 25 fps' },
  { value: String(30 / 29.97), label: '29.97 → 30 fps' },
];

export default function ConvertSubtitles({ preset }: ToolUiProps) {
  const [name, setName] = useState('subtitles');
  const [input, setInput] = useState('');
  const [format, setFormat] = useState<SubtitleFormat>(preset === 'sync' ? 'srt' : 'vtt');
  const [shift, setShift] = useState<number | null>(0);
  const [rate, setRate] = useState('1');
  const [repair, setRepair] = useState(true);
  const [strip, setStrip] = useState(false);
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => (input.trim() ? parseSubtitles(input) : null), [input]);
  const output = useMemo(() => {
    if (!parsed) return '';
    const cues = retime(parsed.cues, {
      shift: Math.round((shift ?? 0) * 1000),
      scale: Number(rate),
      repair,
      stripFormatting: strip,
    });
    return writeSubtitles(cues, format);
  }, [parsed, format, shift, rate, repair, strip]);

  const open = async (files: File[]): Promise<void> => {
    const file = files[0];
    if (!file) return;
    setName(file.name.replace(/\.[^.]+$/, ''));
    setInput(await file.text());
  };

  return (
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div class="flex min-w-0 flex-col gap-4">
        <Dropzone
          accept=".srt,.vtt,.ass,.ssa,.sbv,.sub,.txt,text/*"
          compact={input !== ''}
          title={input ? 'Open another subtitle file' : 'Choose a subtitle file'}
          detail="SRT, VTT, ASS, SSA or SBV · or paste below · stays on your device"
          onFiles={(files) => void open(files)}
        />
        <Panel>
          <div class="flex flex-col gap-1.5">
            <label htmlFor="subs-in" class="text-sm font-medium">
              Subtitles
            </label>
            <textarea
              id="subs-in"
              class={AREA}
              spellcheck={false}
              value={input}
              onInput={(e) => setInput(e.currentTarget.value)}
              data-testid="subs-in"
            />
            {input.trim() && !parsed ? (
              <p
                role="alert"
                class="text-sm text-red-800 dark:text-red-300"
                data-testid="subs-error"
              >
                This does not look like SRT, VTT, ASS or SBV subtitles: no timings like 00:00:01,000
                --&gt; 00:00:03,000 were found.
              </p>
            ) : null}
          </div>
        </Panel>
        {parsed ? (
          <Panel>
            <div class="flex flex-col gap-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-sm" data-testid="subs-stats">
                  {parsed.cues.length} subtitles read from {NAMES[parsed.format]}
                </p>
                <div class="flex flex-wrap gap-2">
                  <Button
                    onClick={() =>
                      downloadBlob(
                        new Blob([output], { type: 'text/plain;charset=utf-8' }),
                        `${name}.${format}`,
                      )
                    }
                    data-testid="download-subs"
                  >
                    Download .{format}
                  </Button>
                  <Button
                    variant="secondary"
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
              </div>
              <label htmlFor="subs-out" class="sr-only">
                Converted subtitles
              </label>
              <textarea id="subs-out" class={AREA} readOnly value={output} data-testid="subs-out" />
            </div>
          </Panel>
        ) : null}
      </div>
      <Panel title="Convert and sync" class="h-fit">
        <div class="flex flex-col gap-4">
          <SegmentedControl<SubtitleFormat>
            label="Save as"
            value={format}
            options={[
              { value: 'srt', label: 'SRT' },
              { value: 'vtt', label: 'VTT' },
              { value: 'ass', label: 'ASS' },
              { value: 'sbv', label: 'SBV' },
              { value: 'txt', label: 'Text' },
            ]}
            onChange={setFormat}
          />
          <NumberInput
            label="Shift all timings"
            value={shift}
            step={0.1}
            suffix="seconds"
            hint="Negative shows subtitles earlier, positive later. Example: -1.5"
            onChange={setShift}
            testId="shift"
          />
          <SelectInput
            label="Frame-rate fix"
            value={rate}
            options={RATES}
            onChange={setRate}
            hint="When subtitles drift further out of sync as the video plays."
          />
          <CheckboxInput
            label="Fix order and overlaps"
            hint="Sorts by time, removes empty subtitles, stops each one before the next."
            checked={repair}
            onChange={setRepair}
          />
          <CheckboxInput
            label="Remove formatting tags"
            hint="Italic, bold, colour and position codes."
            checked={strip}
            onChange={setStrip}
          />
        </div>
      </Panel>
    </div>
  );
}
