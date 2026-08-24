import { BadRequestException } from '@nestjs/common';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export function validateImageFile(
  file: Express.Multer.File | undefined,
  options: { required?: boolean; field?: string } = {},
): void {
  const field = options.field ?? 'image';

  if (!file) {
    if (options.required) {
      const messages: Record<string, string> = {
        cover_image: 'Please select a cover image.',
        image: 'Please select an image.',
        poster_image: 'Please upload a poster image.',
      };

      throw new BadRequestException({
        message: 'The given data was invalid.',
        errors: {
          [field]: [messages[field] ?? 'Please select an image.'],
        },
      });
    }

    return;
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const messages: Record<string, string> = {
      cover_image: 'The cover must be an image (jpeg, png, gif, or webp).',
      image: 'The file must be an image (jpeg, png, gif, or webp).',
      poster_image: 'Poster must be an image (jpeg, png, gif, or webp).',
    };

    throw new BadRequestException({
      message: 'The given data was invalid.',
      errors: {
        [field]: [messages[field] ?? 'Image must be a valid image file.'],
      },
    });
  }

  if (file.size > MAX_FILE_SIZE) {
    const messages: Record<string, string> = {
      cover_image: 'The cover image may not be larger than 2 MB.',
      image: 'The image may not be larger than 2 MB.',
      poster_image: 'Poster image may not be larger than 2 MB.',
    };

    throw new BadRequestException({
      message: 'The given data was invalid.',
      errors: {
        [field]: [messages[field] ?? 'Image may not be larger than 2 MB.'],
      },
    });
  }
}
