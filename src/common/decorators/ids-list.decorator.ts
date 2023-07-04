import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IdsList(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IdsList',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          const flagIds = value === '' ? [] : value.split(',').map((id) => parseInt(id.trim(), 10));

          if (flagIds.some(isNaN)) {
            return false;
          }

          (args.object as Record<string, number[]>)[propertyName] = flagIds;
          return true;
        },
      },
    });
  };
}
