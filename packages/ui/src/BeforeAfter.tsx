import { formatBytes } from '@niftyfix/tool-sdk';

interface Side {
  url: string;
  label: string;
  width: number;
  height: number;
  bytes: number;
}

/** Side-by-side original vs result with the facts that matter for uploads. */
export function BeforeAfter({ before, after }: { before: Side; after: Side }) {
  return (
    <div class="grid grid-cols-2 gap-3">
      {[before, after].map((side) => (
        <figure key={side.label} class="flex flex-col gap-2">
          <div class="flex aspect-square items-center justify-center overflow-hidden rounded-[var(--radius-control)] bg-[conic-gradient(#e7e5e4_25%,#fafaf9_0_50%,#e7e5e4_0_75%,#fafaf9_0)] bg-[length:16px_16px] dark:bg-[conic-gradient(#292524_25%,#1c1917_0_50%,#292524_0_75%,#1c1917_0)]">
            <img src={side.url} alt={side.label} class="max-h-full max-w-full object-contain" />
          </div>
          <figcaption class="text-sm">
            <span class="font-medium">{side.label}</span>
            <span class="block tabular-nums text-stone-600 dark:text-stone-400">
              {side.width} × {side.height} px · {formatBytes(side.bytes)}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
