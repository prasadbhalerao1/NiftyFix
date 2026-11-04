import {
  FRAME_SOURCE,
  parseSiteMessage,
  PROTOCOL_VERSION,
  type FrameMessage,
  type ToolEventName,
} from '@niftyfix/analytics-schema';
import { REVEAL_EVENT, type RevealDetail } from '@niftyfix/ui';

/**
 * The only channel from the frame to the parent page. Messages are addressed
 * to the configured site origin, so no other embedding page can receive them,
 * and they carry no user content by construction (see analytics-schema).
 */
const siteOrigin = import.meta.env.PUBLIC_SITE_ORIGIN;
const embedded = window.parent !== window;

function post(message: FrameMessage): void {
  if (embedded) window.parent.postMessage(message, siteOrigin);
}

export function reportEvent(toolId: string, name: ToolEventName, code?: string): void {
  post({
    source: FRAME_SOURCE,
    version: PROTOCOL_VERSION,
    type: 'event',
    name,
    toolId,
    ...(code === undefined ? {} : { code }),
  });
}

/**
 * Forward reveal requests from tool UIs (see `useFocusOnMount`) to the parent.
 * Needed because focusing inside a cross-origin frame does not scroll the
 * parent page in Safari.
 */
export function forwardReveals(): () => void {
  const onReveal = (event: Event): void => {
    const { top, height } = (event as CustomEvent<RevealDetail>).detail;
    post({ source: FRAME_SOURCE, version: PROTOCOL_VERSION, type: 'reveal', top, height });
  };
  document.addEventListener(REVEAL_EVENT, onReveal);
  return () => document.removeEventListener(REVEAL_EVENT, onReveal);
}

/**
 * Follow the site's theme toggle. The only message accepted from the parent:
 * it must come from the configured site origin and the parent window, and
 * parse as exactly a theme message.
 */
export function followParentTheme(): () => void {
  const onMessage = (event: MessageEvent): void => {
    if (event.origin !== siteOrigin || event.source !== window.parent) return;
    const message = parseSiteMessage(event.data);
    if (message === null) return;
    if (message.theme === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = message.theme;
  };
  window.addEventListener('message', onMessage);
  return () => window.removeEventListener('message', onMessage);
}

/** Keep the iframe exactly as tall as its content, so the parent never shows a nested scrollbar. */
export function syncHeight(): () => void {
  let last = -1;
  const observer = new ResizeObserver(() => {
    const height = Math.ceil(document.documentElement.getBoundingClientRect().height);
    if (height === last) return;
    last = height;
    post({ source: FRAME_SOURCE, version: PROTOCOL_VERSION, type: 'resize', height });
  });
  observer.observe(document.documentElement);
  return () => observer.disconnect();
}
