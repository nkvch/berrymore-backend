import { Prisma, PrismaClient } from '@prisma/client';

export type SelectType<T extends Prisma.ModelName> = NonNullable<Parameters<PrismaClient[T]['findMany']>[0]>['select'];

export function searchMany<T extends Prisma.ModelName, C extends keyof SelectType<T>>(
  model: T,
  search: string,
  columns: Array<C>,
) {
  const or = columns.map((column) => ({
    [column]: {
      contains: search,
    },
  }));

  return {
    OR: or,
  };
}
