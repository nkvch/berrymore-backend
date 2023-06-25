import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function DateFromString(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'dateFromString',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          const date = new Date(value);

          (args.object as any)[propertyName] = date;

          return !isNaN(date.getTime());
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid date string`;
        },
      },
    });
  };
}
