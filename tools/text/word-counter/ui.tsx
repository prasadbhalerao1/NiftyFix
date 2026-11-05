import { useMemo, useState } from 'preact/hooks';
import { Button, Panel, StatTile, type ToolUiProps } from '@niftyfix/ui';
import { LIMITS, textStats } from './stats';

const number = (n: number): string => n.toLocaleString('en-IN');
const minutes = (n: number): string => (n === 0 ? '0 min' : n === 1 ? 'under 1 min' : `${n} min`);

export default function WordCounter(_props: ToolUiProps) {
  const [text, setText] = useState('');
  const stats = useMemo(() => textStats(text), [text]);

  return (
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Panel>
        <div class="mb-2 flex items-center justify-between gap-2">
          <label htmlFor="word-counter-text" class="text-sm font-medium">
            Your text
          </label>
          <Button variant="ghost" disabled={text === ''} onClick={() => setText('')}>
            Clear
          </Button>
        </div>
        <textarea
          id="word-counter-text"
          rows={14}
          value={text}
          placeholder="Type or paste your text here. Counts update as you type, in any language."
          onInput={(event) => setText(event.currentTarget.value)}
          data-testid="text-input"
          class="w-full resize-y rounded-[var(--radius-control)] border border-stone-300 bg-white p-3 text-base leading-relaxed text-stone-900 placeholder:text-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-400"
        />
      </Panel>
      <div class="flex flex-col gap-4">
        <Panel title="Counts">
          <div class="grid grid-cols-2 gap-2">
            <StatTile label="Words" value={number(stats.words)} emphasis testId="words" />
            <StatTile label="Characters" value={number(stats.characters)} testId="characters" />
            <StatTile
              label="Without spaces"
              value={number(stats.charactersNoSpaces)}
              testId="characters-no-spaces"
            />
            <StatTile label="Sentences" value={number(stats.sentences)} testId="sentences" />
            <StatTile label="Paragraphs" value={number(stats.paragraphs)} testId="paragraphs" />
            <StatTile label="Lines" value={number(stats.lines)} />
            <StatTile label="Reading time" value={minutes(stats.readingMinutes)} testId="reading" />
            <StatTile label="Speaking time" value={minutes(stats.speakingMinutes)} />
          </div>
        </Panel>
        <Panel title="Common limits">
          <ul class="flex flex-col gap-3">
            {LIMITS.map((limit) => {
              const used = stats.characters / limit.max;
              const over = stats.characters > limit.max;
              return (
                <li key={limit.label} class="text-sm">
                  <div class="flex justify-between gap-2">
                    <span>{limit.label}</span>
                    <span
                      class={
                        over
                          ? 'font-medium text-red-700 dark:text-red-400'
                          : 'text-stone-600 dark:text-stone-400'
                      }
                    >
                      {number(stats.characters)} / {number(limit.max)}
                    </span>
                  </div>
                  <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                    <div
                      class={`h-full origin-left rounded-full transition-transform duration-200 ${over ? 'bg-red-600' : 'bg-brand-600'}`}
                      style={{ transform: `scaleX(${Math.min(1, used)})` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
