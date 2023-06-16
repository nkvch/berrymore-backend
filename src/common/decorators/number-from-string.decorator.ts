import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { isNumberString } from 'class-validator';

export function NumberFromString(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'numberFromString',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!isNumberString(value)) {
            return false;
          }

          const numberValue = Number(value);

          if (isNaN(numberValue)) {
            return false;
          }

          (args.object as any)[propertyName] = numberValue;

          return true;
        },
      },
    });
  };
}
