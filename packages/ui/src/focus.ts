import { useEffect, useRef } from 'preact/hooks';

/** Dispatched on `document` with the element's bounds when content must be brought into view. */
export const REVEAL_EVENT = 'niftyfix:reveal';
export type RevealDetail = { top: number; height: number };

/**
 * Move focus to an element when it first renders. Used for results and errors
 * that appear above the control that triggered them (e.g. on phones, where the
 * settings panel sits below the result), so the outcome is announced to screen
 * readers and brought into view. Focus alone does not scroll the parent page
 * from a cross-origin frame in Safari, so a reveal event is also dispatched for
 * the frame shell to forward. The element needs tabIndex={-1}.
 */
export function useFocusOnMount<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const element = ref.current;
    if (!enabled || element === null) return;
    element.focus();
    const rect = element.getBoundingClientRect();
    const detail: RevealDetail = { top: rect.top + window.scrollY, height: rect.height };
    document.dispatchEvent(new CustomEvent<RevealDetail>(REVEAL_EVENT, { detail }));
  }, [enabled]);
  return ref;
}
