import { cropToSpec } from '@niftyfix/engine-image/pipeline';
import { resolveOutputName } from '@niftyfix/runtime';
import { defineProcessor, FILE_FORMATS } from '@niftyfix/tool-sdk';
import manifest from './manifest';
import { PassportPhotoOptions } from './options';

export default defineProcessor({
  options: PassportPhotoOptions,
  run: (input, options, context) =>
    cropToSpec(
      input,
      {
        ...options,
        fileName: resolveOutputName(
          input.name,
          options.fileName,
          'passport-photo',
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
