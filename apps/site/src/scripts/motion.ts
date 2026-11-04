/**
 * Purposeful motion for the site (styles in src/styles/global.css):
 * - [data-reveal] sections and [data-stagger] lists fade up as they scroll into view;
 * - [data-demo] previews play once when visible (checks tick, sizes count down,
 *   pages rearrange), with a Replay button where one is provided;
 * - [data-tilt] hero layers follow the pointer, and the hero glow tracks it;
 * - .spotlight cards light up under the pointer;
 * - [data-typewriter] inputs cycle example searches in their placeholder.
 *
 * public/theme.js adds the `motion` class before first paint unless the user prefers
 * reduced motion; without it (or without JavaScript) everything shows its final state.
 */
const root = document.documentElement;
root.classList.add('motion-ready');
const motion = root.classList.contains('motion');
const finePointer = matchMedia('(pointer: fine)').matches;

// Reveal on scroll, with a staggered entrance for list items.
for (const list of document.querySelectorAll<HTMLElement>('[data-stagger]')) {
  [...list.children].forEach((child, i) => {
    if (child instanceof HTMLElement) child.style.setProperty('--i', String(Math.min(i, 12)));
  });
}
const revealer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      revealer.unobserve(entry.target);
    }
  },
  { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
);
for (const el of document.querySelectorAll('[data-reveal], [data-stagger]')) revealer.observe(el);

// Demos: a scripted run of the real result screens.
const formatKb = (kb: number): string =>
  kb >= 1000 ? `${(kb / 1000).toFixed(1)} MB` : `${Math.round(kb)} KB`;

function countDown(el: HTMLElement, from: number, to: number, ms: number, done: () => void): void {
  const final = el.dataset.final ?? el.textContent;
  const start = performance.now();
  const step = (now: number): void => {
    const t = Math.min(1, (now - start) / ms);
    // Ease out exponentially: big drops first, then it settles on the target.
    const eased = 1 - Math.pow(2, -10 * t);
    el.textContent = t < 1 ? formatKb(from + (to - from) * eased) : final;
    if (t < 1) requestAnimationFrame(step);
    else done();
  };
  requestAnimationFrame(step);
}

function play(demo: HTMLElement): void {
  const timers: number[] = [];
  const at = (ms: number, fn: () => void): void => void timers.push(window.setTimeout(fn, ms));
  demo.dataset.timers = '';
  demo.classList.remove('checks-done');
  for (const run of demo.querySelectorAll<HTMLElement>('[data-run]')) {
    run.classList.remove('is-run', 'is-done');
    for (const row of run.querySelectorAll('[data-check]')) row.classList.remove('is-done');
  }
  void demo.offsetWidth; // Restart transitions from the initial state.

  for (const run of demo.querySelectorAll<HTMLElement>('[data-run]')) {
    if (run.dataset.run === 'checks') {
      const rows = [...run.querySelectorAll('[data-check]')];
      rows.forEach((row, i) => at(450 + i * 380, () => row.classList.add('is-done')));
      at(450 + rows.length * 380, () => demo.classList.add('checks-done'));
    } else if (run.dataset.run === 'size') {
      // Show the original size until the count-down starts.
      const value = run.querySelector<HTMLElement>('[data-count-from]');
      if (value) {
        value.dataset.final ??= value.textContent ?? '';
        value.textContent = formatKb(Number(value.dataset.countFrom));
      }
      at(700, () => {
        run.classList.add('is-run');
        const value = run.querySelector<HTMLElement>('[data-count-from]');
        const from = Number(value?.dataset.countFrom);
        const to = Number(value?.dataset.countTo);
        if (value && from && to)
          countDown(value, from, to, 1600, () => run.classList.add('is-done'));
        else run.classList.add('is-done');
      });
    } else if (run.dataset.run === 'pages') {
      at(1100, () => run.classList.add('is-run'));
    }
  }
  demo.dataset.timers = timers.join(',');
}

function stop(demo: HTMLElement): void {
  for (const id of (demo.dataset.timers ?? '').split(',')) if (id) clearTimeout(Number(id));
}

if (motion) {
  const player = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        play(entry.target as HTMLElement);
        player.unobserve(entry.target);
      }
    },
    { threshold: 0.35 },
  );
  for (const demo of document.querySelectorAll<HTMLElement>('[data-demo]')) {
    player.observe(demo);
    const replay = demo.querySelector<HTMLButtonElement>('[data-demo-replay]');
    if (replay) {
      replay.hidden = false;
      replay.addEventListener('click', () => {
        stop(demo);
        play(demo);
      });
    }
  }
}

// Pointer depth: the hero stage tilts and its layers shift; the glow follows.
// Transforms are set on the moving elements themselves (not inherited custom
// properties), so each frame is compositor work with no style recalculation.
if (motion && finePointer) {
  for (const stage of document.querySelectorAll<HTMLElement>('[data-tilt]')) {
    const area = stage.closest('section') ?? stage;
    const glow = area.querySelector<HTMLElement>('.hero-glow');
    const back = stage.querySelector<HTMLElement>('.depth-1');
    const front = stage.querySelector<HTMLElement>('.depth-3');
    let target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let frame = 0;
    const tick = (): void => {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      const { x, y } = current;
      stage.style.transform = `perspective(1400px) rotateX(${(y * -3).toFixed(3)}deg) rotateY(${(x * 4).toFixed(3)}deg)`;
      if (back) back.style.translate = `${(x * -10).toFixed(2)}px ${(y * -8).toFixed(2)}px`;
      if (front) front.style.translate = `${(x * 16).toFixed(2)}px ${(y * 12).toFixed(2)}px`;
      if (glow)
        glow.style.transform = `translate3d(${(x * 220).toFixed(1)}px, ${(y * 140).toFixed(1)}px, 0)`;
      const settled =
        Math.abs(target.x - current.x) < 0.001 && Math.abs(target.y - current.y) < 0.001;
      frame = settled ? 0 : requestAnimationFrame(tick);
    };
    const nudge = (): void => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    // Measure once per hover, not on every move.
    let box = area.getBoundingClientRect();
    area.addEventListener('pointerenter', () => {
      box = area.getBoundingClientRect();
    });
    area.addEventListener('pointermove', (event) => {
      target = {
        x: ((event.clientX - box.left) / box.width) * 2 - 1,
        y: ((event.clientY - box.top) / box.height) * 2 - 1,
      };
      nudge();
    });
    area.addEventListener('pointerleave', () => {
      target = { x: 0, y: 0 };
      nudge();
    });
  }
}

// Glows without a tilt stage (category headers) just follow the pointer.
if (motion && finePointer) {
  for (const glow of document.querySelectorAll<HTMLElement>('.hero-glow')) {
    const area = glow.parentElement;
    if (!area || area.querySelector('[data-tilt]')) continue;
    let frame = 0;
    area.addEventListener('pointermove', (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const box = area.getBoundingClientRect();
        const x = ((event.clientX - box.left) / box.width) * 2 - 1;
        const y = ((event.clientY - box.top) / box.height) * 2 - 1;
        glow.style.transform = `translate3d(${(x * 160).toFixed(1)}px, ${(y * 90).toFixed(1)}px, 0)`;
      });
    });
  }
}

// Spotlight: a soft light under the pointer on cards.
if (finePointer) {
  document.addEventListener(
    'pointermove',
    (event) => {
      const card = (event.target as Element | null)?.closest<HTMLElement>('.spotlight');
      if (!card) return;
      const box = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - box.left}px`);
      card.style.setProperty('--my', `${event.clientY - box.top}px`);
    },
    { passive: true },
  );
}

// Count-up for small numbers in the hero ("18 tools live").
if (motion) {
  for (const el of document.querySelectorAll<HTMLElement>('[data-count-up]')) {
    const to = Number(el.textContent);
    if (!to) continue;
    const start = performance.now();
    const step = (now: number): void => {
      const t = Math.min(1, (now - start) / 900);
      el.textContent = String(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = '0';
    requestAnimationFrame(step);
  }
}

// Typewriter placeholder: shows what the search understands, paused while in use.
if (motion) {
  for (const input of document.querySelectorAll<HTMLInputElement>('[data-typewriter]')) {
    const examples = (input.dataset.typewriter ?? '').split('|').filter(Boolean);
    const resting = input.placeholder;
    let example = 0;
    let shown = 0;
    let deleting = false;
    const idle = (): boolean => document.activeElement !== input && input.value === '';
    const tick = (): void => {
      if (document.hidden || !idle()) {
        input.placeholder = resting;
        shown = 0;
        deleting = false;
        window.setTimeout(tick, 1200);
        return;
      }
      const text = examples[example] ?? '';
      shown += deleting ? -1 : 1;
      input.placeholder = `Try “${text.slice(0, shown)}”`;
      let wait = deleting ? 28 : 55;
      if (!deleting && shown >= text.length) {
        deleting = true;
        wait = 1800;
      } else if (deleting && shown <= 0) {
        deleting = false;
        example = (example + 1) % examples.length;
        wait = 300;
      }
      window.setTimeout(tick, wait);
    };
    window.setTimeout(tick, 1600);
  }
}
