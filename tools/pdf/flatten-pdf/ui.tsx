import { SingleFileTool, type ToolUiProps } from '@niftyfix/ui';

export default function FlattenPdf(props: ToolUiProps) {
  return (
    <SingleFileTool
      {...props}
      accept=".pdf,application/pdf"
      chooseTitle="Choose a filled PDF form"
      settingsTitle="Flatten"
      actionLabel="Flatten PDF"
      busyLabel="Flattening…"
      successMessage="Your form is flattened. The answers are now part of the pages."
      disclaimer="The file was opened again to confirm it is valid and has the same number of pages."
      options={{ fileName: '' }}
    >
      <p class="text-sm text-stone-700 dark:text-stone-300">
        Every form field becomes permanent page content. Keep your original file if you might need
        to change the answers later.
      </p>
    </SingleFileTool>
  );
}
