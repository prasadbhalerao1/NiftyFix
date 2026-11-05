import {
  PDFCheckBox,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
  StandardFonts,
  type PDFDocument,
} from '@cantoo/pdf-lib';
import { ToolError } from '@niftyfix/tool-sdk';

/** A value for one form field: text for text and choice fields, true/false for check boxes. */
export type FieldValue = string | boolean;

/**
 * Fill AcroForm fields by their full name. Unknown names and read-only fields
 * are skipped and reported, never guessed. Radio and choice values must be
 * one of the field's own options.
 */
export function fillForm(
  doc: PDFDocument,
  values: Readonly<Record<string, FieldValue>>,
): {
  filled: string[];
  skipped: string[];
  applied: Record<string, FieldValue>;
  shortened: string[];
} {
  const form = doc.getForm();
  const filled: string[] = [];
  const skipped: string[] = [];
  const applied: Record<string, FieldValue> = {};
  const shortened: string[] = [];
  for (const [name, value] of Object.entries(values)) {
    const field = form.getFieldMaybe(name);
    if (!field || field.isReadOnly()) {
      skipped.push(name);
      continue;
    }
    if (field instanceof PDFTextField && typeof value === 'string') {
      const max = field.getMaxLength();
      const text = max !== undefined ? value.slice(0, max) : value;
      if (text !== value) shortened.push(name);
      field.setText(text);
      applied[name] = text;
    } else if (field instanceof PDFCheckBox && typeof value === 'boolean') {
      if (value) field.check();
      else field.uncheck();
      applied[name] = value;
    } else if (field instanceof PDFRadioGroup && typeof value === 'string') {
      if (value === '') field.clear();
      else if (field.getOptions().includes(value)) field.select(value);
      else {
        skipped.push(name);
        continue;
      }
    } else if (
      (field instanceof PDFDropdown || field instanceof PDFOptionList) &&
      typeof value === 'string'
    ) {
      if (value === '') field.clear();
      else if (field.getOptions().includes(value)) field.select(value);
      else {
        skipped.push(name);
        continue;
      }
    } else {
      skipped.push(name);
      continue;
    }
    if (!(name in applied)) applied[name] = value;
    filled.push(name);
  }
  return { filled, skipped, applied, shortened };
}

/** Current values of the named fields, as `fillForm` would set them (for verification). */
export function readFormValues(
  doc: PDFDocument,
  names: readonly string[],
): Record<string, FieldValue | null> {
  const form = doc.getForm();
  const out: Record<string, FieldValue | null> = {};
  for (const name of names) {
    const field = form.getFieldMaybe(name);
    out[name] =
      field instanceof PDFTextField
        ? (field.getText() ?? '')
        : field instanceof PDFCheckBox
          ? field.isChecked()
          : field instanceof PDFRadioGroup
            ? (field.getSelected() ?? '')
            : field instanceof PDFDropdown || field instanceof PDFOptionList
              ? (field.getSelected()[0] ?? '')
              : null;
  }
  return out;
}

/**
 * Regenerate field appearances so filled values are visible in every viewer.
 * The standard font only covers Latin text; anything else is refused clearly
 * rather than saved as unreadable boxes.
 */
export async function refreshAppearances(doc: PDFDocument): Promise<void> {
  const form = doc.getForm();
  // The library does not reject unsupported characters (it saves unreadable boxes),
  // so check every text value against the font's own character set first.
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const supported = new Set(font.getCharacterSet());
  const unreadable = form
    .getFields()
    .filter((field): field is PDFTextField => field instanceof PDFTextField)
    .filter((field) =>
      [...(field.getText() ?? '')].some(
        (char) => char !== '\n' && !supported.has(char.codePointAt(0) ?? -1),
      ),
    )
    .map((field) => field.getName());
  if (unreadable.length > 0) {
    throw new ToolError(
      'INVALID_OPTIONS',
      `Some answers use characters the form’s font cannot show (for example Hindi or emoji): ${unreadable.join(', ')}.`,
      { hint: 'Use Latin letters and digits in those fields for now.' },
    );
  }
  form.updateFieldAppearances(font);
}
