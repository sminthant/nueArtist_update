import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'requiredWithoutAll', async: false })
export class RequiredWithoutAllConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [relatedProperties] = args.constraints as [string[]];
    const object = args.object as Record<string, unknown>;

    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return true;
    }

    return relatedProperties.some((property) => {
      const relatedValue = object[property];

      return relatedValue !== null && relatedValue !== undefined && String(relatedValue).trim() !== '';
    });
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Add at least one platform link (Spotify, SoundCloud, or YouTube).';
  }
}

export function RequiredWithoutAll(
  properties: string[],
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      target: object.constructor,
      propertyName: String(propertyName),
      options: validationOptions,
      constraints: [properties],
      validator: RequiredWithoutAllConstraint,
    });
  };
}
