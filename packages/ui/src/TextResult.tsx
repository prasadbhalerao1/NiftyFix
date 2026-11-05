import { useEffect, useRef, useState } from 'preact/hooks';
import { Button } from './Button';

/** A text result to read and copy in place (OCR, extracted text), read from the result file. */
export function TextResult({ blob, label = 'Text' }: { blob: Blob; label?: string }) {
  const [text, setText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    let current = true;
    void blob.text().then((value) => current && setText(value));
    return () => {
      current = false;
    };
  }, [blob]);

  const copy = async (): Promise<void> => {
    if (text === null) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API blocked in this frame: select the text and use the older command.
      area.current?.select();
      document.execCommand('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (text === null) return null;
  return (
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between gap-2">
        <label for="text-result" class="text-sm font-medium">
          {label}
        </label>
        <Button variant="secondary" onClick={() => void copy()} data-testid="copy-text">
          {copied ? 'Copied' : 'Copy text'}
        </Button>
      </div>
      <textarea
        id="text-result"
        ref={area}
        readOnly
        rows={10}
        value={text}
        data-testid="text-result"
        class="w-full resize-y rounded-[var(--radius-control)] border border-stone-300 bg-white p-3 font-mono text-sm leading-relaxed text-stone-900 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
      />
    </div>
  );
}
