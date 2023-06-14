import { HttpException, HttpStatus } from '@nestjs/common';

export function TryCatch(errorMessage: string, code: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        console.error(error);
        throw new HttpException(errorMessage, code);
      }
    };

    return descriptor;
  };
}
