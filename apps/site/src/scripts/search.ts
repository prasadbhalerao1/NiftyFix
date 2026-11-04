/**
 * Search boxes ([data-search]) and the ⌘K command palette ([data-palette]).
 *
 * Each box is an ARIA combobox: type to see matching tools, ↑/↓ to move,
 * Enter to open, Esc to clear. The index is fetched once, on first use.
 * Results are built with DOM APIs (no HTML strings), and planned tools are
 * listed as "soon" without a link.
 */
import { searchRecords, type SearchRecord } from '@niftyfix/registry/search';

let index: Promise<SearchRecord[]> | undefined;
const loadIndex = (): Promise<SearchRecord[]> =>
  (index ??= fetch('/search.json')
    .then((response) => (response.ok ? (response.json() as Promise<SearchRecord[]>) : []))
    .catch(() => {
      index = undefined;
      return [];
    }));

const KIND_LABEL: Record<SearchRecord['kind'], string> = {
  tool: 'Tool',
  intent: 'Preset',
  planned: 'Soon',
};

let boxes = 0;

function attach(root: HTMLElement): void {
  const input = root.querySelector<HTMLInputElement>('[data-search-input]');
  const list = root.querySelector<HTMLUListElement>('[data-search-results]');
  if (!input || !list) return;
  const id = `search-${(boxes += 1)}`;
  list.id = `${id}-results`;
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', list.id);
  input.setAttribute('aria-expanded', 'false');
  const suggestions = root.dataset.suggest === 'true';
  let active = -1;

  const options = (): HTMLElement[] => [...list.querySelectorAll<HTMLElement>('[role="option"]')];

  const setActive = (next: number): void => {
    const items = options();
    if (items.length === 0) return;
    active = (next + items.length) % items.length;
    items.forEach((item, i) => item.setAttribute('aria-selected', String(i === active)));
    const current = items[active];
    if (current) {
      input.setAttribute('aria-activedescendant', current.id);
      current.scrollIntoView({ block: 'nearest' });
    }
  };

  const render = (records: readonly SearchRecord[], query: string): void => {
    list.replaceChildren();
    active = -1;
    input.removeAttribute('aria-activedescendant');
    records.forEach((record, i) => {
      const item = document.createElement('li');
      item.setAttribute('role', 'presentation');
      const row = document.createElement(record.path ? 'a' : 'div');
      row.id = `${id}-option-${i}`;
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', 'false');
      row.className = 'search-option';
      row.style.setProperty('--i', String(i));
      if (record.path && row instanceof HTMLAnchorElement) row.href = record.path;
      else row.setAttribute('aria-disabled', 'true');
      const text = document.createElement('span');
      text.className = 'flex min-w-0 flex-col';
      const name = document.createElement('span');
      name.className = 'truncate font-medium';
      name.textContent = record.name;
      const category = document.createElement('span');
      category.className = 'truncate text-xs text-stone-600 dark:text-stone-400';
      category.textContent = record.category;
      text.append(name, category);
      const kind = document.createElement('span');
      kind.className = `search-kind search-kind-${record.kind}`;
      kind.textContent = KIND_LABEL[record.kind];
      row.append(text, kind);
      row.addEventListener('mousemove', () => {
        if (active !== i) setActive(i);
      });
      item.append(row);
      list.append(item);
    });
    if (records.length === 0 && query) {
      const empty = document.createElement('li');
      empty.className = 'px-4 py-6 text-center text-sm text-stone-600 dark:text-stone-400';
      empty.textContent =
        'No tool matches that yet. Try “photo size”, “merge pdf” or “png to jpg”.';
      list.append(empty);
    }
    const open = list.childElementCount > 0;
    list.hidden = !open;
    input.setAttribute('aria-expanded', String(open));
    if (records.length > 0 && query) setActive(0);
  };

  const update = async (): Promise<void> => {
    const query = input.value.trim();
    const records = await loadIndex();
    if (input.value.trim() !== query) return; // A newer keystroke has taken over.
    if (query) render(searchRecords(records, query, 8), query);
    else if (suggestions) render(records.filter((r) => r.kind !== 'planned').slice(0, 6), '');
    else render([], '');
  };

  input.addEventListener('input', () => void update());
  input.addEventListener('focus', () => void (suggestions || input.value ? update() : loadIndex()));
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (list.hidden) void update();
      else setActive(active + (event.key === 'ArrowDown' ? 1 : -1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = options()[Math.max(active, 0)];
      if (target instanceof HTMLAnchorElement) target.click();
    } else if (event.key === 'Escape' && !list.hidden && !root.closest('dialog')) {
      event.preventDefault();
      input.value = '';
      render([], '');
    }
  });
  // Close the hero results when focus or clicks move elsewhere.
  document.addEventListener('pointerdown', (event) => {
    if (!root.contains(event.target as Node) && !root.closest('dialog')) render([], '');
  });
  root.querySelector('form')?.addEventListener('submit', (event) => event.preventDefault());

  const preset = new URLSearchParams(location.search).get('q');
  if (preset && root.dataset.readQuery === 'true') {
    input.value = preset;
    void update();
  }
}

for (const root of document.querySelectorAll<HTMLElement>('[data-search]')) attach(root);

// Command palette: ⌘K / Ctrl+K or "/" anywhere, or any [data-open-search] button.
const palette = document.querySelector<HTMLDialogElement>('[data-palette]');
if (palette) {
  const input = palette.querySelector<HTMLInputElement>('[data-search-input]');
  const open = (): void => {
    if (palette.open) return;
    palette.showModal();
    input?.select();
    input?.dispatchEvent(new Event('focus'));
  };
  for (const button of document.querySelectorAll<HTMLElement>('[data-open-search]')) {
    button.addEventListener('click', open);
  }
  document.addEventListener('keydown', (event) => {
    const typing =
      event.target instanceof HTMLElement &&
      (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName));
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (palette.open) palette.close();
      else open();
    } else if (event.key === '/' && !typing) {
      event.preventDefault();
      open();
    }
  });
  // A click on the backdrop (outside the panel) closes the palette.
  palette.addEventListener('click', (event) => {
    if (event.target === palette) palette.close();
  });
}
