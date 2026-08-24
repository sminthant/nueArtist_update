import {
  BadRequestException,
  Injectable,
  ValidationError,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';

@Injectable()
export class ValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      exceptionFactory: (errors: ValidationError[]) => {
        const formattedErrors: Record<string, string[]> = {};

        const flattenErrors = (validationErrors: ValidationError[], prefix = ''): void => {
          for (const error of validationErrors) {
            const property = prefix ? `${prefix}.${error.property}` : error.property;

            if (error.constraints) {
              formattedErrors[property] = Object.values(error.constraints);
            }

            if (error.children && error.children.length > 0) {
              flattenErrors(error.children, property);
            }
          }
        };

        flattenErrors(errors);

        throw new BadRequestException({
          message: 'The given data was invalid.',
          errors: formattedErrors,
        });
      },
    });
  }
}
