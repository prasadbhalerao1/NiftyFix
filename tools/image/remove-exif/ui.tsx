import { useEffect, useState } from 'preact/hooks';
import {
  HEADER_PROBE_BYTES,
  readImageHeader,
  readMetadata,
  type MetadataReport,
} from '@niftyfix/engine-image';
import { SingleFileTool, type ToolUiProps } from '@niftyfix/ui';
import type { RemoveExifOptions } from './options';

/** What the chosen photo carries, read on this device before anything is removed. */
function MetadataList({ file }: { file: File }) {
  const [report, setReport] = useState<MetadataReport | null>(null);
  useEffect(() => {
    let current = true;
    void file.arrayBuffer().then((buffer) => {
      const bytes = new Uint8Array(buffer);
      const format = readImageHeader(bytes.subarray(0, HEADER_PROBE_BYTES))?.format;
      if (!current) return;
      setReport(
        format === 'jpeg' || format === 'png' || format === 'webp'
          ? readMetadata(bytes, format)
          : null,
      );
    });
    return () => {
      current = false;
    };
  }, [file]);

  if (report === null) return null;
  if (report.kinds.length === 0) {
    return (
      <p class="text-sm text-stone-600 dark:text-stone-400" data-testid="metadata">
        No metadata found in this image. There is nothing to remove.
      </p>
    );
  }
  return (
    <div data-testid="metadata">
      <p class="text-sm font-medium">
        Found: {report.kinds.join(', ')}
        {report.hasLocation ? (
          <span class="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
            includes location
          </span>
        ) : null}
      </p>
      {report.items.length > 0 ? (
        <dl class="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
          {report.items.map((item) => (
            <>
              <dt class="text-stone-600 dark:text-stone-400">{item.label}</dt>
              <dd class="truncate" title={item.value}>
                {item.value}
              </dd>
            </>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

export default function RemoveExif(props: ToolUiProps) {
  const options: RemoveExifOptions = { fileName: '' };
  return (
    <SingleFileTool
      {...props}
      accept="image/jpeg,image/png,image/webp"
      chooseTitle="Choose a photo"
      settingsTitle="Remove metadata"
      actionLabel="Remove metadata"
      busyLabel="Removing…"
      successMessage="Your photo is clean."
      disclaimer="The new file was read again to confirm no location, camera or other details remain, and that it still opens at the same size."
      options={options}
      preview={(file) => <MetadataList file={file} />}
    >
      <p class="text-sm text-stone-600 dark:text-stone-400">
        Removes location (GPS), camera, date and other hidden details. The picture itself is copied
        exactly, with no loss of quality.
      </p>
    </SingleFileTool>
  );
}
