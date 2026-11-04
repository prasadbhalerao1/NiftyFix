// Applies the saved colour theme before first paint, so pages never flash the
// wrong theme. Loaded synchronously from <head>; the CSP allows no inline script.
try {
  const theme = localStorage.getItem('niftyfix-theme');
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
} catch {
  // Storage blocked (private mode, disabled cookies): follow the system setting.
}
