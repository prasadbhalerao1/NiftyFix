import { type Theme } from '@niftyfix/analytics-schema';

/** Dispatched on `document` after the theme toggle changes the theme. */
export const THEME_EVENT = 'niftyfix:theme';

/** The theme chosen on this page: data-theme on <html>, or the system setting. */
export function chosenTheme(): Theme {
  const theme = document.documentElement.dataset.theme;
  return theme === 'light' || theme === 'dark' ? theme : 'system';
}
