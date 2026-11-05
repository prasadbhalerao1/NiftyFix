import { useState } from 'preact/hooks';
import { Button, Panel, type ToolUiProps } from '@niftyfix/ui';
import { CASES, convertCase, type CaseId } from './convert';

export default function CaseConverter({ preset }: ToolUiProps) {
  const [text, setText] = useState('');
  const [previous, setPrevious] = useState<string | null>(null);
  const [applied, setApplied] = useState<CaseId | null>(null);
  const [copied, setCopied] = useState(false);

  const apply = (id: CaseId): void => {
    if (text === '') return;
    setPrevious(text);
    setText(convertCase(text, id));
    setApplied(id);
  };
  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API blocked in this frame: select the text and use the older command.
      const area = document.getElementById('case-text') as HTMLTextAreaElement | null;
      area?.select();
      document.execCommand('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  // Intent pages ("text to uppercase") list their case first.
  const ordered = [...CASES].sort((a, b) => Number(b.id === preset) - Number(a.id === preset));

  return (
    <Panel>
      <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="case-text" class="text-sm font-medium">
          Your text
        </label>
        <div class="flex gap-1">
          <Button
            variant="ghost"
            disabled={previous === null}
            onClick={() => {
              if (previous === null) return;
              setText(previous);
              setPrevious(null);
              setApplied(null);
            }}
          >
            Undo
          </Button>
          <Button variant="ghost" disabled={text === ''} onClick={() => setText('')}>
            Clear
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
        id="case-text"
        rows={10}
        value={text}
        placeholder="Type or paste text, then choose a case below."
        onInput={(event) => {
          setText(event.currentTarget.value);
          setApplied(null);
        }}
        data-testid="text-input"
        class="w-full resize-y rounded-[var(--radius-control)] border border-stone-300 bg-white p-3 text-base leading-relaxed text-stone-900 placeholder:text-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-400"
      />
      <div
        class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
        role="group"
        aria-label="Convert to"
      >
        {ordered.map((option) => (
          <Button
            key={option.id}
            variant={applied === option.id ? 'primary' : 'secondary'}
            disabled={text === ''}
            onClick={() => apply(option.id)}
            data-testid={`case-${option.id}`}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </Panel>
  );
}
