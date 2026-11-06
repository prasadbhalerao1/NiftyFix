import { SelectInput } from './fields';

export interface ExamPickerChoice {
  id: string;
  label: string;
  requirements: readonly string[];
  sourceHost: string;
}

export const OWN_SIZES = 'own';

/**
 * Choose an exam to fill in its official sizes, or keep your own. The sizes
 * stay editable either way; the chosen exam's other rules are listed below.
 */
export function ExamPicker({
  choices,
  value,
  onChange,
}: {
  choices: readonly ExamPickerChoice[];
  value: string;
  onChange(id: string): void;
}) {
  const chosen = choices.find((choice) => choice.id === value);
  return (
    <div class="flex flex-col gap-2">
      <SelectInput<string>
        label="Exam or form"
        value={value}
        options={[
          { value: OWN_SIZES, label: 'My own sizes' },
          ...choices.map((choice) => ({ value: choice.id, label: choice.label })),
        ]}
        onChange={onChange}
        hint="Fills in the sizes from the official notice. You can still change them."
        testId="exam-picker"
      />
      {chosen ? (
        <div class="nf-enter rounded-[var(--radius-control)] bg-stone-100 p-3 text-sm dark:bg-stone-900">
          <ul class="list-disc space-y-1 pl-5 text-stone-700 dark:text-stone-300">
            {chosen.requirements.map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ul>
          <p class="mt-2 text-xs text-stone-600 dark:text-stone-400">
            From the official notice on {chosen.sourceHost}. Check your own notice for changes.
          </p>
        </div>
      ) : null}
    </div>
  );
}
