import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PaginateOptions } from 'src/prisma/prisma.service';

export const PaginationParams = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): PaginateOptions => {
    const request = ctx.switchToHttp().getRequest();
    const page = parseInt(request.query.page, 10) || 1;
    const perPage = parseInt(request.query.perPage, 10) || 10;

    return {
      page,
      perPage,
    };
  },
);
