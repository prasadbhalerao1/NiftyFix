import type { ComponentType } from 'preact';
import type { DeviceClass, JobHandle, JobHandlers } from '@niftyfix/runtime';
import type { ToolManifest } from '@niftyfix/tool-sdk';

/** Coarse, content-free lifecycle events a tool UI reports (forwarded to the parent page). */
export type ToolUiEvent =
  'file_selected' | 'tool_start' | 'tool_success' | 'tool_fail' | 'download';

export interface ToolUiProps {
  manifest: ToolManifest;
  device: DeviceClass;
  /** Run this tool's processor in the shared worker pool, on one file or several (in order). */
  run(files: File | readonly File[], options: unknown, handlers?: JobHandlers): JobHandle;
  /** Start loading this tool's processing engine now (e.g. once files are chosen). */
  preload(): void;
  report(event: ToolUiEvent, detail?: { code?: string }): void;
  /**
   * Starting settings chosen by the page the tool is embedded in (an intent page
   * such as "compress PDF to 200 KB"). Tools ignore presets they do not know.
   */
  preset?: string;
}

export type ToolUi = ComponentType<ToolUiProps>;
