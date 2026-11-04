import { useEffect, useState } from 'preact/hooks';
import type { FormFieldInfo } from '@niftyfix/engine-pdf/preview';
import {
  CheckboxInput,
  SelectInput,
  SingleFileTool,
  TextInput,
  usePdfPreview,
  type ToolUiProps,
} from '@niftyfix/ui';

type Values = Record<string, string | boolean>;

/** Loads the form's fields once the file is chosen. */
function FormLoader({
  file,
  onFields,
}: {
  file: File;
  onFields(fields: FormFieldInfo[], xfa: boolean): void;
}) {
  const { preview, error } = usePdfPreview(file);
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (!preview) return;
    void preview.fields().then((fields) => {
      setCount(fields.length);
      onFields(fields, preview.isXfa);
    });
  }, [preview]);
  if (error) return <p class="text-sm text-red-800 dark:text-red-300">{error.message}</p>;
  if (count === null) {
    return <p class="text-sm text-stone-600 dark:text-stone-400">Reading the form…</p>;
  }
  return (
    <p class="text-sm text-stone-600 dark:text-stone-400" data-testid="field-count">
      {count} fillable field{count === 1 ? '' : 's'} found.
    </p>
  );
}

/** Field names are often technical ("applicant.name[0]"); show the readable last part. */
const labelOf = (name: string): string => {
  const last = name.split('.').pop() ?? name;
  return (
    last
      .replace(/\[\d+\]$/, '')
      .replace(/[_-]+/g, ' ')
      .trim() || name
  );
};

export default function FillPdfForm(props: ToolUiProps) {
  const [fields, setFields] = useState<FormFieldInfo[] | null>(null);
  const [xfa, setXfa] = useState(false);
  const [values, setValues] = useState<Values>({});
  const [flatten, setFlatten] = useState(false);
  const editable = (fields ?? []).filter((field) => !field.readOnly);
  // Only editable fields are sent: read-only ones cannot change and would only produce warnings.
  const editableValues = Object.fromEntries(
    editable.map((field) => [field.name, values[field.name] ?? field.value]),
  );
  const options =
    fields && editable.length > 0 && !xfa
      ? { values: editableValues, flatten, fileName: '' }
      : null;

  return (
    <SingleFileTool
      {...props}
      accept=".pdf,application/pdf"
      chooseTitle="Choose a fillable PDF form"
      settingsTitle="Answers"
      actionLabel="Save filled form"
      busyLabel="Saving…"
      successMessage="Your form is filled in."
      disclaimer="The saved file was read back to confirm every answer (or, if locked, that no editable fields remain)."
      options={options}
      preview={(file) => (
        <FormLoader
          file={file}
          onFields={(loaded, isXfa) => {
            setFields(loaded);
            setXfa(isXfa);
            setValues(Object.fromEntries(loaded.map((field) => [field.name, field.value])));
          }}
        />
      )}
    >
      {xfa ? (
        <p class="text-sm text-amber-800 dark:text-amber-300" data-testid="xfa-notice">
          This is an XFA form (an Adobe-only format). Browsers cannot fill it; open it in Adobe
          Acrobat Reader instead.
        </p>
      ) : fields && fields.length === 0 ? (
        <p class="text-sm text-amber-800 dark:text-amber-300" data-testid="no-fields">
          This PDF has no fillable fields. It may be a scanned or flat form.
        </p>
      ) : (
        <div
          class="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1"
          data-testid="form-fields"
        >
          {(fields ?? []).map((field) => {
            const label = `${labelOf(field.name)}${field.readOnly ? ' (read-only)' : ''}`;
            const value = values[field.name];
            const set = (next: string | boolean): void =>
              setValues((current) => ({ ...current, [field.name]: next }));
            if (field.kind === 'checkbox') {
              return (
                <CheckboxInput
                  key={field.name}
                  label={label}
                  checked={value === true}
                  onChange={(checked) => !field.readOnly && set(checked)}
                  testId={`field-${field.name}`}
                />
              );
            }
            if (field.kind === 'radio' || field.kind === 'choice') {
              return (
                <SelectInput<string>
                  key={field.name}
                  label={label}
                  value={typeof value === 'string' ? value : ''}
                  options={[
                    { value: '', label: '— Not selected —' },
                    ...field.options.map((option) => ({ value: option, label: option })),
                  ]}
                  onChange={(next) => !field.readOnly && set(next)}
                  testId={`field-${field.name}`}
                />
              );
            }
            return (
              <TextInput
                key={field.name}
                label={label}
                value={typeof value === 'string' ? value : ''}
                {...(field.maxLength ? { hint: `Up to ${field.maxLength} characters.` } : {})}
                onChange={(next) => !field.readOnly && set(next)}
                testId={`field-${field.name}`}
              />
            );
          })}
        </div>
      )}
      {editable.length > 0 && !xfa ? (
        <CheckboxInput
          label="Lock answers (flatten)"
          checked={flatten}
          hint="Answers become part of the page and can no longer be edited."
          onChange={setFlatten}
          testId="flatten"
        />
      ) : null}
    </SingleFileTool>
  );
}
