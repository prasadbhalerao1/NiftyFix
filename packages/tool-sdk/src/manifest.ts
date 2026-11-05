import type { CategoryId } from './categories';
import type { FileFormatId } from './formats';

export type ToolStatus = 'draft' | 'beta' | 'live';

/** Where processing happens. Launch tools are all 'browser'. */
export type ExecutionMode = 'browser';

/**
 * 'on-device': file bytes never leave the sandboxed tool frame. Enforced by the
 * frame's Content-Security-Policy and verified by network-egress tests.
 */
export type PrivacyClass = 'on-device';

export type EngineId = 'image' | 'pdf' | 'media' | 'ocr' | 'text' | 'data' | 'archive';

export interface DeviceLimit {
  /** Applied on devices classed as low/mid memory (most phones). */
  mobile: number;
  desktop: number;
}

export interface FileInputSpec {
  kind: 'files';
  formats: readonly FileFormatId[];
  maxBytes: DeviceLimit;
  /** Decompression-bomb guard: maximum decoded pixel count (width × height). */
  maxPixels?: DeviceLimit;
  maxFiles: number;
}

export interface ToolManifest {
  /** Stable forever, never reused: '<category>.<slug>'. */
  id: string;
  /** Bump when the processor's output changes for the same input and options. */
  version: number;
  slug: string;
  category: CategoryId;
  status: ToolStatus;
  name: string;
  h1: string;
  /** One sentence shown under the H1. */
  tagline: string;
  seoTitle: string;
  seoDescription: string;
  /** Task-language phrases users search with ("photo size for exam form"). */
  searchAliases: readonly string[];
  input: FileInputSpec;
  output: { formats: readonly FileFormatId[] };
  execution: ExecutionMode;
  privacy: PrivacyClass;
  engine: EngineId;
  capabilities: {
    batch: boolean;
    cancellable: boolean;
    progress: 'determinate' | 'indeterminate';
    /** True when results carry machine-checked verification of the requested constraints. */
    verifiesOutput: boolean;
  };
  /** Tool ids of related tools (validated by the registry). */
  related: readonly string[];
}

export interface ToolContent {
  /** 1–3 sentences shown above the how-to; must describe this tool, not tools in general. */
  intro: string;
  howTo: readonly string[];
  options: readonly { name: string; description: string }[];
  limits: readonly string[];
  example?: { title: string; input: string; settings: string; output: string };
  faqs: readonly { question: string; answer: string }[];
  /**
   * Search-intent pages built on this tool ("compress pdf to 200kb"): each has
   * its own URL, title and explanation, and opens the tool with a preset.
   * Only for intents with genuinely different needs, never thin duplicates.
   */
  variants?: readonly ToolVariant[];
}

export interface ToolVariant {
  /** URL slug in the tool's category, e.g. "compress-pdf-to-200kb". */
  slug: string;
  /** Preset id the tool UI understands, e.g. "target-200kb"; omit to open the tool as is. */
  preset?: string;
  /** Short label for links between variants, e.g. "200 KB". */
  label: string;
  h1: string;
  seoTitle: string;
  seoDescription: string;
  /** What is specific about this intent (shown above the tool's own content). */
  intro: string;
  faqs?: readonly { question: string; answer: string }[];
}

/** Identity helpers that give authors full type checking. */
export const defineManifest = (manifest: ToolManifest): ToolManifest => manifest;
export const defineContent = (content: ToolContent): ToolContent => content;
