import {
  FRAME_SOURCE,
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
