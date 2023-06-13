import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const IdParam = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const id = parseInt(request.params.id, 10);
    return id;
  },
);
