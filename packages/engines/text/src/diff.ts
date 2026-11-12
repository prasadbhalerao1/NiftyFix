/**
 * Text differences: Myers' diff on lines, then on words inside each changed
 * block, so a long document with a few edits stays fast and the result reads
 * naturally. Pure and unit-tested; shared by the text and PDF compare tools.
 */
export type Op = 'equal' | 'insert' | 'delete';
export interface Part {
  op: Op;
  text: string;
}

/** Myers' O((N+M)D) shortest edit script over two sequences. */
export function diffSequences<T>(
  a: readonly T[],
  b: readonly T[],
  maxEdits = 4000,
): { op: Op; item: T }[] | null {
  // Trim the common start and end first: most edits are local.
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start += 1;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA -= 1;
    endB -= 1;
  }
  const x0 = a.slice(start, endA);
  const y0 = b.slice(start, endB);
  const n = x0.length;
  const m = y0.length;
  const max = n + m;
  const v = new Int32Array(2 * max + 2);
  const trace: Int32Array[] = [];
  let found = false;
  for (let d = 0; d <= max && d <= maxEdits; d += 1) {
    trace.push(v.slice());
    for (let k = -d; k <= d; k += 2) {
      let x =
        k === -d || (k !== d && (v[max + k - 1] ?? 0) < (v[max + k + 1] ?? 0))
          ? (v[max + k + 1] ?? 0)
          : (v[max + k - 1] ?? 0) + 1;
      let y = x - k;
      while (x < n && y < m && x0[x] === y0[y]) {
        x += 1;
        y += 1;
      }
      v[max + k] = x;
      if (x >= n && y >= m) {
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (!found) return null;
  // Walk the trace back to recover the edits.
  const middle: { op: Op; item: T }[] = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d >= 0; d -= 1) {
    const vd = trace[d] as Int32Array;
    const k = x - y;
    const prevK =
      k === -d || (k !== d && (vd[max + k - 1] ?? 0) < (vd[max + k + 1] ?? 0)) ? k + 1 : k - 1;
    const prevX = vd[max + prevK] ?? 0;
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      middle.push({ op: 'equal', item: x0[x - 1] as T });
      x -= 1;
      y -= 1;
    }
    if (d > 0) {
      if (x === prevX) middle.push({ op: 'insert', item: y0[y - 1] as T });
      else middle.push({ op: 'delete', item: x0[x - 1] as T });
    }
    x = prevX;
    y = prevY;
  }
  middle.reverse();
  return [
    ...a.slice(0, start).map((item) => ({ op: 'equal' as const, item })),
    ...middle,
    ...a.slice(endA).map((item) => ({ op: 'equal' as const, item })),
  ];
}

/** Words with the spaces after them, so joining the parts gives the text back. */
const words = (text: string): string[] => text.match(/\S+\s*|\s+/g) ?? [];

function merge(parts: Part[]): Part[] {
  const out: Part[] = [];
  for (const part of parts) {
    const last = out.at(-1);
    if (last && last.op === part.op) last.text += part.text;
    else if (part.text) out.push({ ...part });
  }
  return out;
}

export function diffText(before: string, after: string): Part[] {
  const a = before.split(/(?<=\n)/);
  const b = after.split(/(?<=\n)/);
  const lines = diffSequences(a, b) ?? [
    ...a.map((item) => ({ op: 'delete' as const, item })),
    ...b.map((item) => ({ op: 'insert' as const, item })),
  ];
  const parts: Part[] = [];
  // Changed runs of lines are compared again word by word.
  for (let i = 0; i < lines.length;) {
    const line = lines[i];
    if (!line || line.op === 'equal') {
      if (line) parts.push({ op: 'equal', text: line.item });
      i += 1;
      continue;
    }
    let removed = '';
    let added = '';
    while (i < lines.length && lines[i]?.op !== 'equal') {
      const changed = lines[i];
      if (changed?.op === 'delete') removed += changed.item;
      else if (changed) added += changed.item;
      i += 1;
    }
    const refined = diffSequences(words(removed), words(added), 2000);
    if (refined && removed && added) {
      for (const { op, item } of refined) parts.push({ op, text: item });
    } else {
      parts.push({ op: 'delete', text: removed }, { op: 'insert', text: added });
    }
  }
  return merge(parts);
}

export interface Summary {
  added: number;
  removed: number;
  unchanged: number;
}

const countWords = (text: string): number => (text.match(/\S+/g) ?? []).length;

export function summarise(parts: readonly Part[]): Summary {
  const summary = { added: 0, removed: 0, unchanged: 0 };
  for (const part of parts) {
    const n = countWords(part.text);
    if (part.op === 'insert') summary.added += n;
    else if (part.op === 'delete') summary.removed += n;
    else summary.unchanged += n;
  }
  return summary;
}
