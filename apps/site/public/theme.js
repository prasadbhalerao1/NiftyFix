// Applies the saved colour theme before first paint, so pages never flash the
// wrong theme. Loaded synchronously from <head>; the CSP allows no inline script.
try {
  const theme = localStorage.getItem('niftyfix-theme');
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
} catch {
  // Storage blocked (private mode, disabled cookies): the default dark theme applies.
}

// Motion (src/scripts/motion.ts) starts from hidden or initial states, so it is
// switched on before first paint, and off again if the motion script never runs.
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const root = document.documentElement;
  root.classList.add('motion');
  window.setTimeout(() => {
    if (!root.classList.contains('motion-ready')) root.classList.remove('motion');
  }, 3000);
}
