import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';

type EncryptionConfig = Record<
  string,
  {
    shouldEncrypt: (
      action: Prisma.PrismaAction,
      args: Record<string, Record<string, any>>,
      prisma: PrismaService,
    ) => Promise<boolean>;
    fields: string[];
    shouldDecrypt: (data: Record<string, string | number>) => boolean;
  }
>;

export const encryptionConfig: EncryptionConfig = {
  users: {
    shouldEncrypt: async (
      action: Prisma.PrismaAction,
      args: Record<string, Record<string, any>>,
      prisma: PrismaService,
    ) => {
      const data = args.data;
      const where = args.where;

      if (action === 'create' && !data.roleId) {
        throw new HttpException(
          'Не указана роль пользователя',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (action === 'update' && !where.id) {
        throw new HttpException(
          'Не указан id пользователя',
          HttpStatus.BAD_REQUEST,
        )
      }

      let isForeman;

      switch (action) {
        case 'create':
          isForeman = !!(await prisma.roles.findFirst({
            where: {
              roleName: 'foreman',
              id: data.roleId as number,
            },
          }));
          break
        case 'update':
          isForeman = !!(await prisma.users.findFirst({
            where: {
              id: where.id,
              roles: {
                roleName: 'foreman'
              }
            }
          }));
          break
        default:
          isForeman = false;
      }


      return isForeman;
    },
    fields: ['firstName', 'lastName'],
    shouldDecrypt: (data: Record<string, string | number>) => {
      if (!data) return false;

      return !!data.iv && !!data.salt;
    },
  },
  flags: {
    shouldEncrypt: () => Promise.resolve(true),
    fields: ['name', 'color'],
    shouldDecrypt: () => true,
  },
  employees: {
    shouldEncrypt: () => Promise.resolve(true),
    fields: ['firstName', 'lastName', 'photoPath', 'contract', 'address', 'phone', 'additionalInfo'],
    shouldDecrypt: () => true,
  },
};
