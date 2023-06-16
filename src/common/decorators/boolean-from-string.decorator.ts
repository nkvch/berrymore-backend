import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function BooleanFromString(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'booleanFromString',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          if (value === 'true' || value === 'false') {
            (args.object as any)[args.property] = value === 'true';
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a boolean`;
        },
      },
    });
  };
}
