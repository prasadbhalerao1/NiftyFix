import { useEffect, useState } from 'preact/hooks';
import {
  Button,
  CheckboxInput,
  copyText,
  cx,
  NumberInput,
  Panel,
  RangeInput,
  SegmentedControl,
  type ToolUiProps,
} from '@niftyfix/ui';
import {
  checkStrength,
  entropyBits,
  generatePassphrase,
  generatePassword,
  generatePin,
  SETS,
  type SetName,
} from './password';

type Kind = 'password' | 'passphrase' | 'pin';
const random = (count: number): Uint32Array => crypto.getRandomValues(new Uint32Array(count));

const METER = ['bg-red-600', 'bg-orange-600', 'bg-amber-500', 'bg-lime-600', 'bg-emerald-600'];

function StrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const result = checkStrength(password);
  return (
    <div class="flex flex-col gap-2" data-testid="strength">
      <div class="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            class={cx(
              'h-2 flex-1 rounded-full',
              i <= result.score ? METER[result.score] : 'bg-stone-200 dark:bg-stone-700',
            )}
          />
        ))}
      </div>
      <p class="text-sm">
        <span class="font-semibold">{result.label}</span> · about {result.bits} bits · cracked{' '}
        {result.crackTime === 'instantly' ? 'instantly' : `in ${result.crackTime}`} by a fast
        offline attack
      </p>
      {result.warnings.map((warning) => (
        <p key={warning} class="text-sm text-amber-800 dark:text-amber-300">
          {warning}
        </p>
      ))}
    </div>
  );
}

function CopyRow({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <li class="flex items-center gap-2">
      <code
        class="min-w-0 flex-1 break-all rounded bg-stone-100 px-2 py-1.5 font-mono text-sm dark:bg-stone-800"
        data-testid="password"
      >
        {value}
      </code>
      <Button
        variant="secondary"
        onClick={() =>
          void copyText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })
        }
      >
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </li>
  );
}

export default function PasswordGenerator({ preset }: ToolUiProps) {
  const [kind, setKind] = useState<Kind>('password');
  const [length, setLength] = useState(16);
  const [words, setWords] = useState(4);
  const [sets, setSets] = useState<SetName[]>(['lower', 'upper', 'digits', 'symbols']);
  const [avoidSimilar, setAvoidSimilar] = useState(true);
  const [count, setCount] = useState<number | null>(1);
  const [results, setResults] = useState<string[]>([]);
  const [check, setCheck] = useState('');

  const generate = (): void => {
    const n = Math.max(1, Math.min(100, count ?? 1));
    setResults(
      Array.from({ length: n }, () =>
        kind === 'pin'
          ? generatePin(length, random)
          : kind === 'passphrase'
            ? generatePassphrase(words, random)
            : generatePassword({ length, sets, avoidSimilar }, random),
      ),
    );
  };
  useEffect(generate, [kind, length, words, sets.join(), avoidSimilar, count]);

  const pool =
    kind === 'pin'
      ? 10
      : sets.reduce(
          (sum, set) =>
            sum + (avoidSimilar ? SETS[set].replace(/[Il1O0o|]/g, '') : SETS[set]).length,
          0,
        );
  const bits =
    kind === 'passphrase'
      ? words * 3 * Math.log2(16 * 5) + Math.log2(100)
      : entropyBits(pool, length);
  const toggle = (set: SetName) => (on: boolean) => {
    const next = on ? [...sets, set] : sets.filter((s) => s !== set);
    if (next.length > 0) setSets(next);
  };

  if (preset === 'check') {
    return (
      <Panel title="Check a password" class="max-w-2xl">
        <div class="flex flex-col gap-3">
          <label htmlFor="check-in" class="text-sm font-medium">
            Password to check (never leaves this page)
          </label>
          <input
            id="check-in"
            type="text"
            autoComplete="off"
            spellcheck={false}
            class="h-11 w-full rounded-[var(--radius-control)] border border-stone-300 bg-paper px-3 font-mono dark:border-stone-700 dark:bg-stone-900"
            value={check}
            onInput={(e) => setCheck(e.currentTarget.value)}
            data-testid="check-in"
          />
          <StrengthMeter password={check} />
        </div>
      </Panel>
    );
  }

  return (
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div class="flex min-w-0 flex-col gap-4">
        <Panel>
          <div class="flex flex-col gap-4">
            <ul class="flex flex-col gap-2">
              {results.map((value, i) => (
                <CopyRow key={`${value}-${i}`} value={value} />
              ))}
            </ul>
            <div class="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={generate} data-testid="generate">
                Generate new
              </Button>
              <p class="text-sm text-stone-600 dark:text-stone-400">
                About {Math.round(bits)} bits of randomness each.
              </p>
            </div>
          </div>
        </Panel>
        <Panel title="Check any password">
          <div class="flex flex-col gap-3">
            <label htmlFor="check-in" class="sr-only">
              Password to check
            </label>
            <input
              id="check-in"
              type="text"
              autoComplete="off"
              spellcheck={false}
              placeholder="Type a password to test its strength"
              class="h-11 w-full rounded-[var(--radius-control)] border border-stone-300 bg-paper px-3 font-mono dark:border-stone-700 dark:bg-stone-900"
              value={check}
              onInput={(e) => setCheck(e.currentTarget.value)}
              data-testid="check-in"
            />
            <StrengthMeter password={check} />
          </div>
        </Panel>
      </div>
      <Panel title="Settings" class="h-fit">
        <div class="flex flex-col gap-4">
          <SegmentedControl<Kind>
            label="Make a"
            value={kind}
            options={[
              { value: 'password', label: 'Password' },
              { value: 'passphrase', label: 'Passphrase' },
              { value: 'pin', label: 'PIN' },
            ]}
            onChange={(next) => {
              setKind(next);
              setLength(next === 'pin' ? 6 : 16);
            }}
          />
          {kind === 'passphrase' ? (
            <RangeInput
              label="Words"
              value={words}
              min={3}
              max={10}
              step={1}
              format={(v) => String(v)}
              onChange={setWords}
            />
          ) : (
            <RangeInput
              label="Length"
              value={length}
              min={kind === 'pin' ? 4 : 6}
              max={kind === 'pin' ? 12 : 128}
              step={1}
              format={(v) => `${v} characters`}
              onChange={setLength}
            />
          )}
          {kind === 'password' ? (
            <>
              <CheckboxInput
                label="Lower case (a-z)"
                checked={sets.includes('lower')}
                onChange={toggle('lower')}
              />
              <CheckboxInput
                label="Upper case (A-Z)"
                checked={sets.includes('upper')}
                onChange={toggle('upper')}
              />
              <CheckboxInput
                label="Numbers (0-9)"
                checked={sets.includes('digits')}
                onChange={toggle('digits')}
              />
              <CheckboxInput
                label="Symbols (!@#$...)"
                checked={sets.includes('symbols')}
                onChange={toggle('symbols')}
              />
              <CheckboxInput
                label="Avoid look-alikes (I, l, 1, O, 0)"
                checked={avoidSimilar}
                onChange={setAvoidSimilar}
              />
            </>
          ) : null}
          <NumberInput
            label="How many"
            value={count}
            min={1}
            max={100}
            step={1}
            onChange={setCount}
          />
        </div>
      </Panel>
    </div>
  );
}
