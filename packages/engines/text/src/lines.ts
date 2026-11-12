import { diffSequences, type Part } from './diff';

/**
 * Line-by-line comparison for side-by-side and unified views, with optional
 * case and whitespace insensitivity, word-level highlights inside changed
 * lines, and a standard unified patch.
 */
export interface CompareOptions {
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
}

export interface Side {
  /** 1-based line number. */
  line: number;
  text: string;
  /** Word-level parts for a changed line (empty for unchanged lines). */
  parts: Part[];
}

export interface Row {
  type: 'equal' | 'change' | 'insert' | 'delete';
  left: Side | null;
  right: Side | null;
}

const key = (line: string, { ignoreCase, ignoreWhitespace }: CompareOptions): string => {
  let out = ignoreWhitespace ? line.replace(/\s+/g, ' ').trim() : line;
  if (ignoreCase) out = out.toLowerCase();
  return out;
};

const words = (text: string): string[] => text.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu) ?? [];

/** Word-level parts of a changed line pair: what was removed on the left and added on the right. */
function intraline(before: string, after: string): [Part[], Part[]] {
  const ops = diffSequences(words(before), words(after), 500);
  if (!ops) return [[{ op: 'delete', text: before }], [{ op: 'insert', text: after }]];
  const left: Part[] = [];
  const right: Part[] = [];
  const push = (list: Part[], op: Part['op'], text: string): void => {
    const last = list.at(-1);
    if (last && last.op === op) last.text += text;
    else list.push({ op, text });
  };
  for (const { op, item } of ops) {
    if (op !== 'insert') push(left, op, item);
    if (op !== 'delete') push(right, op, item);
  }
  return [left, right];
}

export function compareLines(before: string, after: string, options: CompareOptions): Row[] {
  const a = before === '' ? [] : before.replace(/\r\n?/g, '\n').split('\n');
  const b = after === '' ? [] : after.replace(/\r\n?/g, '\n').split('\n');
  const keysA = a.map((line) => key(line, options));
  const keysB = b.map((line) => key(line, options));
  // Compare keys by index so equal lines map back to their own text on each side.
  const ops = diffSequences(keysA, keysB, 20_000) ?? [
    ...keysA.map((item) => ({ op: 'delete' as const, item })),
    ...keysB.map((item) => ({ op: 'insert' as const, item })),
  ];
  const rows: Row[] = [];
  let ia = 0;
  let ib = 0;
  for (let i = 0; i < ops.length;) {
    if (ops[i]?.op === 'equal') {
      rows.push({
        type: 'equal',
        left: { line: ia + 1, text: a[ia] ?? '', parts: [] },
        right: { line: ib + 1, text: b[ib] ?? '', parts: [] },
      });
      ia += 1;
      ib += 1;
      i += 1;
      continue;
    }
    const removed: number[] = [];
    const added: number[] = [];
    while (i < ops.length && ops[i]?.op !== 'equal') {
      if (ops[i]?.op === 'delete') removed.push(ia++);
      else added.push(ib++);
      i += 1;
    }
    // Pair removed and added lines as changes; the rest are pure deletions or insertions.
    for (let k = 0; k < Math.max(removed.length, added.length); k += 1) {
      const l = removed[k];
      const r = added[k];
      if (l !== undefined && r !== undefined) {
        const [leftParts, rightParts] = intraline(a[l] ?? '', b[r] ?? '');
        rows.push({
          type: 'change',
          left: { line: l + 1, text: a[l] ?? '', parts: leftParts },
          right: { line: r + 1, text: b[r] ?? '', parts: rightParts },
        });
      } else if (l !== undefined) {
        rows.push({
          type: 'delete',
          left: { line: l + 1, text: a[l] ?? '', parts: [] },
          right: null,
        });
      } else if (r !== undefined) {
        rows.push({
          type: 'insert',
          left: null,
          right: { line: r + 1, text: b[r] ?? '', parts: [] },
        });
      }
    }
  }
  return rows;
}

export function lineStats(rows: readonly Row[]): {
  added: number;
  removed: number;
  changed: number;
} {
  return {
    added: rows.filter((r) => r.type === 'insert').length,
    removed: rows.filter((r) => r.type === 'delete').length,
    changed: rows.filter((r) => r.type === 'change').length,
  };
}

/** A unified diff (as `diff -u` and git write it) with `context` unchanged lines around changes. */
export function unifiedPatch(rows: readonly Row[], names: [string, string], context = 3): string {
  const lines: { kind: ' ' | '-' | '+'; text: string; a: number; b: number }[] = [];
  let a = 0;
  let b = 0;
  for (const row of rows) {
    if (row.type === 'equal') {
      a += 1;
      b += 1;
      lines.push({ kind: ' ', text: row.left?.text ?? '', a, b });
      continue;
    }
    if (row.left) {
      a += 1;
      lines.push({ kind: '-', text: row.left.text, a, b });
    }
    if (row.right) {
      b += 1;
      lines.push({ kind: '+', text: row.right.text, a, b });
    }
  }
  // A change row emits "-" then "+": move all "-" of a block before its "+" lines.
  const changed = lines.map((l, i) => (l.kind !== ' ' ? i : -1)).filter((i) => i >= 0);
  if (changed.length === 0) return '';
  const out = [`--- ${names[0]}`, `+++ ${names[1]}`];
  let i = 0;
  while (i < changed.length) {
    const first = changed[i] ?? 0;
    let last = first;
    while (i + 1 < changed.length && (changed[i + 1] ?? 0) - last <= context * 2 + 1) {
      i += 1;
      last = changed[i] ?? last;
    }
    i += 1;
    const from = Math.max(0, first - context);
    const to = Math.min(lines.length - 1, last + context);
    const block = lines.slice(from, to + 1);
    const ordered: typeof block = [];
    for (let k = 0; k < block.length;) {
      if (block[k]?.kind === ' ') {
        ordered.push(block[k] as (typeof block)[number]);
        k += 1;
        continue;
      }
      const run: typeof block = [];
      while (k < block.length && block[k]?.kind !== ' ')
        run.push(block[k++] as (typeof block)[number]);
      ordered.push(...run.filter((l) => l.kind === '-'), ...run.filter((l) => l.kind === '+'));
    }
    const countA = ordered.filter((l) => l.kind !== '+').length;
    const countB = ordered.filter((l) => l.kind !== '-').length;
    // An empty side starts at the line before the change, as diff -u writes it.
    const startA = ordered.find((l) => l.kind !== '+')?.a ?? ordered[0]?.a ?? 0;
    const startB = ordered.find((l) => l.kind !== '-')?.b ?? ordered[0]?.b ?? 0;
    out.push(`@@ -${startA},${countA} +${startB},${countB} @@`);
    for (const l of ordered) out.push(`${l.kind}${l.text}`);
  }
  return `${out.join('\n')}\n`;
}

/** Pretty-print JSON with sorted keys, so two documents compare by content, not formatting. */
export function normaliseJson(
  text: string,
): { ok: true; text: string } | { ok: false; error: string } {
  if (text.trim() === '') return { ok: true, text: '' };
  try {
    const sort = (value: unknown): unknown =>
      Array.isArray(value)
        ? value.map(sort)
        : value !== null && typeof value === 'object'
          ? Object.fromEntries(
              Object.keys(value as object)
                .sort()
                .map((k) => [k, sort((value as Record<string, unknown>)[k])]),
            )
          : value;
    return { ok: true, text: JSON.stringify(sort(JSON.parse(text)), null, 2) };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}
