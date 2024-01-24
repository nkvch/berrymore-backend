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

/**
 * Encryption config was commented out for better times.
 * Logic works, but due to complexity in maintenance it was decided to not use it.
 */ 
export const encryptionConfig: EncryptionConfig = {
  // users: {
  //   shouldEncrypt: async (
  //     action: Prisma.PrismaAction,
  //     args: Record<string, Record<string, any>>,
  //     prisma: PrismaService,
  //   ) => {
  //     const data = args.data;
  //     const where = args.where;

  //     if (action === 'create' && !data.roleId) {
  //       throw new HttpException(
  //         'Не указана роль пользователя',
  //         HttpStatus.BAD_REQUEST,
  //       );
  //     }

  //     if (action === 'update' && !where.id) {
  //       throw new HttpException(
  //         'Не указан id пользователя',
  //         HttpStatus.BAD_REQUEST,
  //       );
  //     }

  //     let isForeman;

  //     switch (action) {
  //       case 'create':
  //         isForeman = !!(await prisma.roles.findFirst({
  //           where: {
  //             roleName: 'foreman',
  //             id: data.roleId as number,
  //           },
  //         }));
  //         break;
  //       case 'update':
  //         isForeman = !!(await prisma.users.findFirst({
  //           where: {
  //             id: where.id,
  //             roles: {
  //               roleName: 'foreman',
  //             },
  //           },
  //         }));
  //         break;
  //       default:
  //         isForeman = false;
  //     }

  //     return isForeman;
  //   },
  //   fields: ['firstName', 'lastName'],
  //   shouldDecrypt: (data: Record<string, string | number>) => {
  //     if (!data) return false;

  //     return !!data.iv && !!data.salt;
  //   },
  // },
  // foreman: {
  //   shouldEncrypt: () => Promise.resolve(true),
  //   fields: ['firstName', 'lastName'],
  //   shouldDecrypt: (data: Record<string, string | number>) => {
  //     if (!data) return false;

  //     return !!data.iv && !!data.salt;
  //   },
  // },
  // flags: {
  //   shouldEncrypt: () => Promise.resolve(true),
  //   fields: ['name', 'color'],
  //   shouldDecrypt: (data: Record<string, string | number>) => {
  //     if (!data) return false;

  //     return !!data.iv && !!data.salt;
  //   },
  // },
  employees: {
    shouldEncrypt: () => Promise.resolve(true),
    // fields: ['photoPath', 'address', 'phone', 'additionalInfo'],
    fields: [],
    shouldDecrypt: (data: Record<string, string | number>) => {
      if (!data) return false;

      return !!data.iv && !!data.salt;
    },
  },
  // products: {
  //   shouldEncrypt: () => Promise.resolve(true),
  //   fields: ['productName', 'productUnit', 'productPrice', 'photoPath'],
  //   shouldDecrypt: (data: Record<string, string | number>) => {
  //     if (!data) return false;

  //     return !!data.iv && !!data.salt;
  //   },
  // },
  // history: {
  //   shouldEncrypt: () => Promise.resolve(true),
  //   fields: ['amount'],
  //   shouldDecrypt: (data: Record<string, string | number>) => {
  //     if (!data) return false;

  //     return !!data.iv && !!data.salt;
  //   },
  // },
};
