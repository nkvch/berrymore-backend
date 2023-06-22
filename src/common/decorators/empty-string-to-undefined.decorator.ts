import { registerDecorator } from 'class-validator';

export function EmptyStringToUndefined(validationOptions?: any) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'emptyStringToUndefined',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (value === '') {
            (object as any)[propertyName] = undefined;
          }

          return true;
        },
      },
    });
  };
}
