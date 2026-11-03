import type { ComponentType } from 'preact';
import type { DeviceClass, JobHandle, JobHandlers } from '@niftyfix/runtime';
import type { ToolManifest } from '@niftyfix/tool-sdk';

/** Coarse, content-free lifecycle events a tool UI reports (forwarded to the parent page). */
export type ToolUiEvent =
  'file_selected' | 'tool_start' | 'tool_success' | 'tool_fail' | 'download';

export interface ToolUiProps {
  manifest: ToolManifest;
  device: DeviceClass;
  /** Run this tool's processor in the shared worker pool. */
  run(file: File, options: unknown, handlers?: JobHandlers): JobHandle;
  report(event: ToolUiEvent, detail?: { code?: string }): void;
}

export type ToolUi = ComponentType<ToolUiProps>;
