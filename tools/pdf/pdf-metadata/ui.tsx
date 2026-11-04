import { useEffect, useState } from 'preact/hooks';
import { Button, SingleFileTool, TextInput, usePdfPreview, type ToolUiProps } from '@niftyfix/ui';
import { FIELDS, type Field } from './options';

type Fields = Record<Field, string>;

const EMPTY: Fields = { title: '', author: '', subject: '', keywords: '', creator: '' };
const LABELS: Record<Field, string> = {
  title: 'Title',
  author: 'Author',
  subject: 'Subject',
  keywords: 'Keywords',
  creator: 'Application',
};

/** Reads the chosen file's current details once and hands them to the form. */
function CurrentDetails({
  file,
  onLoad,
}: {
  file: File;
  onLoad(fields: Fields, producer: string): void;
}) {
  const { preview, error } = usePdfPreview(file);
  useEffect(() => {
    if (!preview) return;
    const { title, author, subject, keywords, creator } = preview.info;
    onLoad({ title, author, subject, keywords, creator }, preview.info.producer);
  }, [preview]);
  if (error) return <p class="text-sm text-red-800 dark:text-red-300">{error.message}</p>;
  return preview ? (
    <p class="text-sm text-stone-600 dark:text-stone-400" data-testid="metadata-loaded">
      Current details loaded{preview.info.producer ? ` · made with ${preview.info.producer}` : ''}.
    </p>
  ) : (
    <p class="text-sm text-stone-600 dark:text-stone-400">Reading the current details…</p>
  );
}

export default function PdfMetadata(props: ToolUiProps) {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [remove, setRemove] = useState(false);
  const tooLong = FIELDS.some((field) => fields[field].length > 500);
  const options = tooLong
    ? null
    : remove
      ? { mode: 'remove', fileName: '' }
      : { mode: 'edit', fields, fileName: '' };

  return (
    <SingleFileTool
      {...props}
      accept=".pdf,application/pdf"
      chooseTitle="Choose a PDF"
      settingsTitle="Document details"
      actionLabel="Save PDF"
      busyLabel="Saving…"
      successMessage={remove ? 'All metadata is removed.' : 'The document details are updated.'}
      disclaimer="The saved file was read back and every field compared with what you asked for."
      options={options}
      preview={(file) => (
        <CurrentDetails
          file={file}
          onLoad={(loaded) => {
            setFields(loaded);
            setRemove(false);
          }}
        />
      )}
    >
      {remove ? (
        <p class="text-sm text-stone-700 dark:text-stone-300" data-testid="remove-notice">
          Every field and the hidden XMP copy will be removed.
        </p>
      ) : (
        FIELDS.map((field) => (
          <TextInput
            key={field}
            label={LABELS[field]}
            value={fields[field]}
            error={fields[field].length > 500 ? 'Up to 500 characters.' : undefined}
            {...(field === 'keywords' ? { hint: 'Separate with commas.' } : {})}
            onChange={(value) => setFields((current) => ({ ...current, [field]: value }))}
            testId={`meta-${field}`}
          />
        ))
      )}
      <Button
        variant="secondary"
        onClick={() => setRemove((current) => !current)}
        data-testid="remove-all"
      >
        {remove ? 'Edit details instead' : 'Remove all metadata'}
      </Button>
    </SingleFileTool>
  );
}
