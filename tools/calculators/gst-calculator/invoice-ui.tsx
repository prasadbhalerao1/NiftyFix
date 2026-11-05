import { useState } from 'preact/hooks';
import { Button, Panel, StatTile } from '@niftyfix/ui';
import { GST_RATES, inr, type Supply } from './gst';
import { invoiceTotals, type InvoiceLine } from './invoice';

interface Row {
  id: number;
  name: string;
  quantity: string;
  unitPrice: string;
  rate: string;
}

const RATES = [0, ...GST_RATES];
const field =
  'min-h-11 w-full rounded-[var(--radius-control)] border border-stone-300 bg-white px-2.5 text-sm text-stone-900 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100';

let nextId = 1;
const newRow = (rate = '18'): Row => ({
  id: nextId++,
  name: '',
  quantity: '1',
  unitPrice: '',
  rate,
});

/** Several items at different GST rates, with the rate-wise summary invoices need. */
export function InvoiceCalculator({ supply }: { supply: Supply }) {
  const [rows, setRows] = useState<Row[]>(() => [newRow(), newRow('5')]);
  const update = (id: number, patch: Partial<Row>): void =>
    setRows((all) => all.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const lines: InvoiceLine[] = rows
    .map((row) => ({
      quantity: Number(row.quantity),
      unitPrice: Number(row.unitPrice),
      rate: Number(row.rate),
    }))
    .filter((l) => l.quantity > 0 && l.unitPrice > 0 && Number.isFinite(l.quantity + l.unitPrice));
  const totals = lines.length > 0 ? invoiceTotals(lines, supply) : null;

  return (
    <div class="flex flex-col gap-4">
      <Panel title="Items">
        <div class="flex flex-col gap-3" data-testid="invoice-rows">
          {/* Column headings: phones show the name field on its own line above each row. */}
          <div
            aria-hidden="true"
            class="grid grid-cols-[4.5rem_minmax(0,1fr)_5.5rem_2.75rem] gap-2 text-xs text-stone-600 sm:hidden dark:text-stone-400"
          >
            <span>Qty</span>
            <span>Price each, before GST (₹)</span>
            <span>GST</span>
            <span />
          </div>
          <div
            aria-hidden="true"
            class="hidden grid-cols-[minmax(0,2fr)_4.5rem_minmax(0,1fr)_5.5rem_2.75rem] gap-2 text-xs text-stone-600 sm:grid dark:text-stone-400"
          >
            <span>Item (optional)</span>
            <span>Qty</span>
            <span>Price each, before GST (₹)</span>
            <span>GST</span>
            <span />
          </div>
          {rows.map((row, index) => (
            <div
              key={row.id}
              class="nf-enter grid grid-cols-[4.5rem_minmax(0,1fr)_5.5rem_2.75rem] gap-2 sm:grid-cols-[minmax(0,2fr)_4.5rem_minmax(0,1fr)_5.5rem_2.75rem]"
              data-testid="invoice-row"
            >
              <input
                class={`${field} col-span-4 sm:col-span-1`}
                aria-label={`Item ${index + 1} name`}
                placeholder={`Item ${index + 1}`}
                value={row.name}
                onInput={(e) => update(row.id, { name: e.currentTarget.value })}
              />
              <input
                class={field}
                type="number"
                inputMode="decimal"
                min={0}
                aria-label={`Item ${index + 1} quantity`}
                value={row.quantity}
                onInput={(e) => update(row.id, { quantity: e.currentTarget.value })}
                data-testid="row-qty"
              />
              <input
                class={field}
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                aria-label={`Item ${index + 1} price before GST`}
                placeholder="0.00"
                value={row.unitPrice}
                onInput={(e) => update(row.id, { unitPrice: e.currentTarget.value })}
                data-testid="row-price"
              />
              <select
                class={field}
                aria-label={`Item ${index + 1} GST rate`}
                value={row.rate}
                onChange={(e) => update(row.id, { rate: e.currentTarget.value })}
                data-testid="row-rate"
              >
                {RATES.map((rate) => (
                  <option key={rate} value={String(rate)}>
                    {rate}%
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                aria-label={`Remove item ${index + 1}`}
                disabled={rows.length === 1}
                onClick={() => setRows((all) => all.filter((r) => r.id !== row.id))}
              >
                ×
              </Button>
            </div>
          ))}
          <div>
            <Button
              variant="secondary"
              onClick={() => setRows((all) => [...all, newRow()])}
              data-testid="add-row"
            >
              Add item
            </Button>
          </div>
        </div>
      </Panel>

      <Panel title="Invoice summary">
        {totals ? (
          <div class="flex flex-col gap-4">
            <div class="overflow-x-auto">
              <table class="w-full text-xs sm:text-sm" data-testid="rate-summary">
                <thead class="text-xs text-stone-600 dark:text-stone-400">
                  <tr>
                    <th class="py-2 text-left font-medium">GST rate</th>
                    <th class="py-2 pl-3 text-right font-medium">Taxable value</th>
                    {supply === 'intra' ? (
                      <>
                        <th class="py-2 pl-3 text-right font-medium">CGST</th>
                        <th class="py-2 pl-3 text-right font-medium">SGST</th>
                      </>
                    ) : (
                      <th class="py-2 pl-3 text-right font-medium">IGST</th>
                    )}
                  </tr>
                </thead>
                <tbody class="divide-y divide-stone-200 tabular-nums dark:divide-stone-800">
                  {totals.byRate.map((g) => (
                    <tr key={g.rate}>
                      <td class="py-2">{g.rate}%</td>
                      <td class="py-2 pl-3 text-right whitespace-nowrap">{inr(g.taxable)}</td>
                      {supply === 'intra' ? (
                        <>
                          <td class="py-2 pl-3 text-right whitespace-nowrap">{inr(g.cgst)}</td>
                          <td class="py-2 pl-3 text-right whitespace-nowrap">{inr(g.sgst)}</td>
                        </>
                      ) : (
                        <td class="py-2 pl-3 text-right whitespace-nowrap">{inr(g.igst)}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile label="Taxable value" value={inr(totals.taxable)} />
              <StatTile label="Total GST" value={inr(totals.tax)} testId="invoice-tax" />
              <StatTile
                label="Round off"
                value={`${totals.roundOff >= 0 ? '+' : '−'}${inr(Math.abs(totals.roundOff))}`}
                testId="round-off"
              />
              <StatTile
                label="Invoice total"
                value={inr(totals.total)}
                emphasis
                testId="invoice-total"
              />
            </div>
          </div>
        ) : (
          <p class="text-sm text-stone-600 dark:text-stone-400">
            Enter a quantity and price for at least one item.
          </p>
        )}
      </Panel>
    </div>
  );
}
