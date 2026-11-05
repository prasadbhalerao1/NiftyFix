import { useState } from 'preact/hooks';
import { OCR_LANGUAGE_IDS, OCR_LANGUAGES, type OcrLanguage } from '@niftyfix/engine-ocr/assets';
import { CheckboxInput, SingleFileTool, TextResult, type ToolUiProps } from '@niftyfix/ui';
import type { ImageToTextOptions } from './options';

/** Language pages ("Hindi image to text") open with that language added to English. */
function startingLanguages(preset: string | undefined): OcrLanguage[] {
  const extra = OCR_LANGUAGE_IDS.find((id) => id === preset && id !== 'eng');
  return extra ? ['eng', extra] : ['eng', 'hin'];
}

export default function ImageToText(props: ToolUiProps) {
  const [languages, setLanguages] = useState<OcrLanguage[]>(() => startingLanguages(props.preset));
  const toggle = (id: OcrLanguage, on: boolean): void =>
    setLanguages((current) =>
      on
        ? OCR_LANGUAGE_IDS.filter((l) => l === id || current.includes(l))
        : current.filter((l) => l !== id),
    );
  const options: ImageToTextOptions | null =
    languages.length > 0 ? { languages, fileName: '' } : null;

  return (
    <SingleFileTool
      {...props}
      accept="image/jpeg,image/png,image/webp,image/avif,image/bmp,image/gif"
      chooseTitle="Choose an image"
      settingsTitle="Languages in the image"
      actionLabel="Read text"
      busyLabel="Reading…"
      successMessage="The text is ready to copy."
      disclaimer="Text recognition can misread characters, especially in blurry photos and handwriting. Check names and numbers against the image."
      options={options}
      resultPreview={(result) => <TextResult blob={result.blob} label="Text found" />}
    >
      <fieldset class="flex flex-col gap-3">
        <legend class="sr-only">Languages</legend>
        {OCR_LANGUAGE_IDS.map((id) => (
          <CheckboxInput
            key={id}
            label={OCR_LANGUAGES[id]}
            checked={languages.includes(id)}
            onChange={(on) => toggle(id, on)}
            testId={`lang-${id}`}
          />
        ))}
      </fieldset>
      {languages.length === 0 ? (
        <p class="text-sm text-red-700 dark:text-red-400" role="alert">
          Choose at least one language.
        </p>
      ) : (
        <p class="text-sm text-stone-600 dark:text-stone-400">
          Tick every language in the image. Each one is downloaded once (1 to 3 MB), then kept on
          your device.
        </p>
      )}
    </SingleFileTool>
  );
}
