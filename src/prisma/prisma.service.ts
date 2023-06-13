import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, users } from '@prisma/client';
import { EncryptService } from 'src/encrypt/encrypt.service';
import { encryptionConfig } from './encryptionConfig';

export interface PaginateOptions {
  page: number;
  perPage: number;
};

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(
    private readonly encryptService: EncryptService,
  ) {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    this.$use(async (params, next) => {
      const model = params.model as Prisma.ModelName;
      const action = params.action;
      const args = params.args;

      const cfg = encryptionConfig[model];

      if (cfg) {
        if (action === 'create') {
          if (await cfg.shouldCrypt(args.data, this)) {
            const filteredData = Object.fromEntries(
              Object.entries(args.data).filter(([key]) => cfg.fields.includes(key))
            );

            const encryptedData = this.encrpyt(args.data.ownerId, filteredData);

            args.data = {
              ...args.data,
              ...encryptedData,
            }
          }
        } else if (action === 'findFirst' || action === 'findUnique' || action === 'findMany') {
          if (!params.args.include) {
            params.args = {
              ...args,
              select: {
                ...(args.select),
                iv: true,
                salt: true,
              }
            }
          }
        }
      }

      let result = await next(params);

      if (result === null) return result;

      if (cfg) {
        if (action === 'findUnique' || action === 'findFirst') {
          if (await cfg.shouldCrypt(result, this)) {
            const fields = [...cfg.fields, 'iv', 'salt'];

            const filteredData = Object.fromEntries(
              Object.entries(result).filter(([key]) => fields.includes(key))
            ) as Record<string, string>;

            const decryptedData = this.encryptService.decryptData(filteredData, result.ownerId);

            result = {
              ...result,
              ...decryptedData,
            }

            delete result.iv;
            delete result.salt;
          }
        } else if (action === 'findMany') {
          result = await Promise.all(result.map(async (item: any) => {
            if (await cfg.shouldCrypt(item, this)) {
              const fields = [...cfg.fields, 'iv', 'salt'];

              const filteredData = Object.fromEntries(
                Object.entries(item).filter(([key]) => fields.includes(key))
              ) as Record<string, string>;

              const decryptedData = this.encryptService.decryptData(filteredData, item.ownerId);

              item = {
                ...item,
                ...decryptedData,
              }

              delete item.iv;
              delete item.salt;
            }

            return item;
          }));
        }
      }

      return result;
    });
  }

  encrpyt(ownerId: users['id'], data: any) {
    const encryptedData = this.encryptService.encryptData(data, ownerId);

    return encryptedData;
  }

  paginate = async function <T extends Prisma.ModelName>(
    model: T,
    paginateParams: PaginateOptions,
    findManyParams: Parameters<PrismaClient[T]['findMany']>['0'],
  ) {
    const { page, perPage } = paginateParams;

    const count = await this[model].count({
      where: findManyParams?.where,
    });

    const totalPages = Math.ceil(count / perPage);

    const items = await this[model].findMany({
      ...findManyParams,
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      items,
      totalPages,
      totalItems: count,
      currentPage: page,
    }
  }
}
