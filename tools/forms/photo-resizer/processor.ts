import { cropToSpec } from '@niftyfix/engine-image/pipeline';
import { resolveOutputName } from '@niftyfix/runtime';
import { defineProcessor, FILE_FORMATS } from '@niftyfix/tool-sdk';
import manifest from './manifest';
import { PhotoResizerOptions } from './options';

export default defineProcessor({
  options: PhotoResizerOptions,
  run: (input, options, context) =>
    cropToSpec(
      input,
      {
        ...options,
        fileName: resolveOutputName(
          input.name,
          options.fileName,
          `${options.width}x${options.height}`,
          FILE_FORMATS[options.format].extensions[0],
        ),
      },
      context,
      {
        maxPixels: manifest.input.maxPixels?.desktop ?? Number.POSITIVE_INFINITY,
        subject: 'photo',
      },
    ),
});
