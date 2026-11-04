import { isErrorCode } from '@niftyfix/tool-sdk';

/**
 * Messages the sandboxed tool frame may send to the parent page. This is the
 * entire vocabulary: no free-text fields exist, so file names, file contents
 * or pasted text cannot be carried even by mistake.
 */
export const FRAME_SOURCE = 'niftyfix-frame';
export const PROTOCOL_VERSION = 1;

export const TOOL_EVENTS = [
  'tool_ready',
  'file_selected',
  'tool_start',
  'tool_success',
  'tool_fail',
  'download',
] as const;
export type ToolEventName = (typeof TOOL_EVENTS)[number];

/** Failure codes allowed in events: tool error codes plus verification failure. */
export type EventCode = string;

export type FrameMessage =
  | {
      source: typeof FRAME_SOURCE;
      version: typeof PROTOCOL_VERSION;
      type: 'resize';
      height: number;
    }
  | {
      /** Ask the parent to scroll a region of the frame (frame-relative px) into view. */
      source: typeof FRAME_SOURCE;
      version: typeof PROTOCOL_VERSION;
      type: 'reveal';
      top: number;
      height: number;
    }
  | {
      source: typeof FRAME_SOURCE;
      version: typeof PROTOCOL_VERSION;
      type: 'event';
      name: ToolEventName;
      toolId: string;
      code?: EventCode;
    };

/**
 * Messages the parent page may send to the tool frame. Only the colour theme,
 * so the frame matches the site's theme toggle.
 */
export const SITE_SOURCE = 'niftyfix-site';
export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEMES)[number];

export interface SiteMessage {
  source: typeof SITE_SOURCE;
  version: typeof PROTOCOL_VERSION;
  type: 'theme';
  theme: Theme;
}

/** Strictly parse an untrusted message from the parent page; null unless exactly a known shape. */
export function parseSiteMessage(data: unknown): SiteMessage | null {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  if (record.source !== SITE_SOURCE || record.version !== PROTOCOL_VERSION) return null;
  if (Object.keys(record).sort().join(',') !== 'source,theme,type,version') return null;
  const { type, theme } = record;
  if (type !== 'theme' || typeof theme !== 'string') return null;
  if (!(THEMES as readonly string[]).includes(theme)) return null;
  return { source: SITE_SOURCE, version: PROTOCOL_VERSION, type: 'theme', theme: theme as Theme };
}

const TOOL_ID = /^[a-z]+\.[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_PX = 20_000;
const isPixels = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_PX;
const isEventCode = (value: unknown): value is EventCode =>
  isErrorCode(value) || value === 'VERIFICATION_FAILED';

/**
 * Strictly parse an untrusted message. Returns null for anything that is not
 * exactly a known message shape (unknown keys are rejected too).
 */
export function parseFrameMessage(data: unknown): FrameMessage | null {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  if (record.source !== FRAME_SOURCE || record.version !== PROTOCOL_VERSION) return null;
  const keys = Object.keys(record).sort().join(',');

  if (record.type === 'resize') {
    const height = record.height;
    if (keys !== 'height,source,type,version' || !isPixels(height)) return null;
    return {
      source: FRAME_SOURCE,
      version: PROTOCOL_VERSION,
      type: 'resize',
      height: Math.ceil(height),
    };
  }

  if (record.type === 'reveal') {
    const { top, height } = record;
    if (keys !== 'height,source,top,type,version' || !isPixels(top) || !isPixels(height))
      return null;
    return {
      source: FRAME_SOURCE,
      version: PROTOCOL_VERSION,
      type: 'reveal',
      top: Math.round(top),
      height: Math.round(height),
    };
  }

  if (record.type === 'event') {
    const { name, toolId, code } = record;
    const allowedKeys =
      code === undefined
        ? 'name,source,toolId,type,version'
        : 'code,name,source,toolId,type,version';
    if (keys !== allowedKeys) return null;
    if (typeof name !== 'string' || !(TOOL_EVENTS as readonly string[]).includes(name)) return null;
    if (typeof toolId !== 'string' || !TOOL_ID.test(toolId)) return null;
    if (code !== undefined && !isEventCode(code)) return null;
    return {
      source: FRAME_SOURCE,
      version: PROTOCOL_VERSION,
      type: 'event',
      name: name as ToolEventName,
      toolId,
      ...(code === undefined ? {} : { code }),
    };
  }
  return null;
}
