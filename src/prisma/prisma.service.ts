import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient, users } from '@prisma/client';
import { EncryptService } from 'src/encrypt/encrypt.service';
import { encryptionConfig } from './encryptionConfig';
import { mappersConfig } from './mappersConfig';
import { UserData } from 'src/auth/interfaces/UserData';
import * as util from 'util';

export interface PaginateOptions {
  page: number;
  perPage: number;
}

export interface QueryOptions {
  foremanLimited?: boolean;
}

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(private readonly encryptService: EncryptService) {
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

      if (action === 'create' || action === 'update') {
        if (cfg) {
          if (await cfg.shouldEncrypt(action, args, this)) {
            let allData;
            let ownerId;

            switch (action) {
              case 'create':
                ownerId = args.data.ownerId;
                allData = args.data;
                break;
              case 'update':
                allData = await (this[model] as any).findUnique({
                  where: args.where,
                  select: Object.fromEntries(
                    cfg.fields.map((key) => [key, true]),
                  ),
                });
                allData = {
                  ...allData,
                  ...args.data,
                };
                ownerId = allData?.ownerId;
                break;
            }

            const dataToEncrypt = Object.fromEntries(
              Object.entries(allData).filter(([key]) =>
                cfg.fields.includes(key),
              ),
            );

            const encryptedData = this.encrpyt(ownerId, dataToEncrypt);

            args.data = {
              ...args.data,
              ...encryptedData,
            };
          }
        }
      } else if (
        action === 'findFirst' ||
        action === 'findUnique' ||
        action === 'findMany'
      ) {
        const modifiedArgs = this.includeEncryptionAttributesWhereNeeded(
          model,
          args,
        );

        params.args = modifiedArgs;
      }

      let result = await next(params);

      if (result === null) return result;

      result = await this.decryptEntity(result, model);

      result = this.mapEntity(result, model);

      return result;
    });

    this.roles.count().then((count) => {
      const hasAny = count > 0;

      if (!hasAny) {
        console.log('creating roles');
        this.roles
          .createMany({
            data: [
              {
                roleName: 'admin',
              },
              {
                roleName: 'owner',
              },
              {
                roleName: 'foreman',
              },
            ],
          })
          .catch((err) => {
            console.log(err);
          })
          .then(() => {
            console.log('roles created');
          });
      }
    });
  }

  includeEncryptionAttributesWhereNeeded = function (
    model: Prisma.ModelName,
    args: any,
  ) {
    const cfg = encryptionConfig[model];

    if (cfg) {
      if (args) {
        if (args.select) {
          args.select = {
            ...args.select,
            iv: true,
            salt: true,
            ownerId: true,
          };
        }
      }
    }

    if (args) {
      if (args.select) {
        for (const key in args.select) {
          args.select[key] = this.includeEncryptionAttributesWhereNeeded(
            key as Prisma.ModelName,
            args.select[key],
          );
        }
      } else if (args.include) {
        for (const key in args.include) {
          args.include[key] = this.includeEncryptionAttributesWhereNeeded(
            key as Prisma.ModelName,
            args.include[key],
          );
        }
      }
    }

    return args;
  };

  decryptEntity = async function (entity: any, modelName: string) {
    const cfg = encryptionConfig[modelName];

    if (Array.isArray(entity)) {
      return Promise.all(
        entity.map((item) => this.decryptEntity(item, modelName)),
      );
    }

    if (cfg && cfg.shouldDecrypt(entity)) {
      const fields = [...cfg.fields, 'iv', 'salt'];

      const filteredData = Object.fromEntries(
        Object.entries(entity).filter(([key]) => fields.includes(key)),
      ) as Record<string, string>;

      const decryptedData = this.encryptService.decryptData(
        filteredData,
        entity.ownerId,
      );

      entity = {
        ...entity,
        ...decryptedData,
      };

      delete entity.iv;
      delete entity.salt;
      // delete entity.ownerId; в некоторых сильно nested query ошибка, если удалять ownerId
    }

    for (const key in entity) {
      const includedCfg = encryptionConfig[key];

      if (includedCfg) {
        entity[key] = await this.decryptEntity(entity[key], key);
      }
    }

    return entity;
  };

  mapEntity = function (entity: any, modelName: string) {
    const cfg = mappersConfig[modelName];

    if (Array.isArray(entity)) {
      return entity.map((item) => this.mapEntity(item, modelName));
    }

    if (cfg) {
      const fields = [...cfg.fields];

      const filteredData = Object.fromEntries(
        Object.entries(entity).filter(([key]) => fields.includes(key)),
      ) as Record<string, string>;

      for (const key in filteredData) {
        entity[key] = cfg.fieldsMappers[key](entity[key]);
      }
    }

    for (const key in entity) {
      const includedCfg = mappersConfig[key];

      if (includedCfg) {
        entity[key] = this.mapEntity(entity[key], key);
      }
    }

    return entity;
  };

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
    };
  };

  createPrivately = async function <T extends Prisma.ModelName>(
    model: T,
    args: Parameters<PrismaClient[T]['create']>['0'],
    user: UserData,
  ) {
    (args.data as any).ownerId = user.ownerId;

    return await this[model].create(args);
  };

  createManyPrivately = async function <T extends Prisma.ModelName>(
    model: T,
    args: Parameters<PrismaClient[T]['createMany']>['0'],
    user: UserData,
  ) {
    for (const item of args!.data as Array<any>) {
      (item as any).ownerId = user.ownerId;
    }

    return await this[model].createMany(args);
  };

  findManyPrivately = async function <T extends Prisma.ModelName>(
    model: T,
    args: NonNullable<Parameters<PrismaClient[T]['findMany']>['0']>,
    user: UserData,
    options?: QueryOptions,
  ) {
    args.where = {
      ...args.where,
      ownerId: user.ownerId,
    };

    if (options?.foremanLimited && user.roleName === 'foreman') {
      args.where = {
        ...args.where,
        foremanId: user.id,
      };
    }

    return await this[model].findMany(args);
  };

  findUniquePrivately = async function <T extends Prisma.ModelName>(
    model: T,
    args: NonNullable<Parameters<PrismaClient[T]['findUnique']>['0']>,
    user: UserData,
    options?: QueryOptions,
  ) {
    const findFirstArgs = {
      where: {
        ...args.where,
        ownerId: user.ownerId,
      },
    } as NonNullable<Parameters<PrismaClient[T]['findFirst']>['0']>;

    if (options?.foremanLimited && user.roleName === 'foreman') {
      findFirstArgs.where = {
        ...findFirstArgs.where,
        foremanId: user.id,
      };
    }

    const findFirstResult = await this[model].findFirst(findFirstArgs);

    if (!findFirstResult) {
      throw new NotFoundException('Не найдено');
    }

    return await this[model].findUnique(args);
  };

  updatePrivately = async function <T extends Prisma.ModelName>(
    model: T,
    args: Parameters<PrismaClient[T]['update']>['0'],
    user: UserData,
    options?: QueryOptions,
  ): Promise<T> {
    const findFirstArgs = {
      where: {
        ...args.where,
        ownerId: user.ownerId,
      },
    } as NonNullable<Parameters<PrismaClient[T]['findFirst']>['0']>;

    if (options?.foremanLimited && user.roleName === 'foreman') {
      findFirstArgs.where = {
        ...findFirstArgs.where,
        foremanId: user.id,
      };
    }

    const findFirstResult = await this[model].findFirst(findFirstArgs);

    if (!findFirstResult) {
      throw new NotFoundException('Не найдено');
    }

    return this[model].update(args);
  };

  deletePrivately = async function <T extends Prisma.ModelName>(
    model: T,
    args: Parameters<PrismaClient[T]['delete']>['0'],
    user: UserData,
    options?: QueryOptions,
  ) {
    const findFirstArgs = {
      where: {
        ...args.where,
        ownerId: user.ownerId,
      },
    } as NonNullable<Parameters<PrismaClient[T]['findFirst']>['0']>;

    const findFirstResult = await this[model].findFirst(findFirstArgs);

    if (!findFirstResult) {
      throw new NotFoundException('Не найдено');
    }

    return await this[model].delete(args);
  };

  deleteManyPrivately = async function <T extends Prisma.ModelName>(
    model: T,
    args: Parameters<PrismaClient[T]['deleteMany']>['0'],
    user: UserData,
    options?: QueryOptions,
  ) {
    if (!args) {
      args = {};
    }

    args.where = {
      ...args.where,
      ownerId: user.ownerId,
    };

    if (options?.foremanLimited && user.roleName === 'foreman') {
      args.where = {
        ...args.where,
        foremanId: user.id,
      };
    }

    return await this[model].deleteMany(args);
  };

  findFirstPrivately = async function <T extends Prisma.ModelName>(
    model: T,
    args: NonNullable<Parameters<PrismaClient[T]['findFirst']>['0']>,
    user: UserData,
    options?: QueryOptions,
  ) {
    const modifiedArgs = {
      ...args,
      where: {
        ...args.where,
        ownerId: user.ownerId,
      },
    };

    if (options?.foremanLimited && user.roleName === 'foreman') {
      modifiedArgs.where = {
        ...modifiedArgs.where,
        foremanId: user.id,
      };
    }

    return await this[model].findFirst(modifiedArgs);
  };

  paginatePrivately = async function <T extends Prisma.ModelName>(
    model: T,
    paginateParams: PaginateOptions,
    findManyParams: Parameters<PrismaClient[T]['findMany']>['0'],
    user: UserData,
    options?: QueryOptions,
  ) {
    const { page, perPage } = paginateParams;

    const modifiedArgs = {
      ...findManyParams,
      where: {
        ...findManyParams?.where,
        ownerId: user.ownerId,
      },
    };

    if (options?.foremanLimited && user.roleName === 'foreman') {
      modifiedArgs.where = {
        ...modifiedArgs.where,
        foremanId: user.id,
      };
    }

    const count = await this[model].count({
      where: modifiedArgs.where,
    });

    const totalPages = Math.ceil(count / perPage);

    const items = await this[model].findMany({
      ...modifiedArgs,
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      items,
      totalPages,
      totalItems: count,
      currentPage: page,
    };
  };

  paginatePrivatelyWithInclude = async function <T extends Prisma.ModelName>(
    model: T,
    paginateParams: PaginateOptions,
    findManyParams: Parameters<PrismaClient[T]['findMany']>['0'],
    privateIncludedFields: {
      fieldName: string;
      foremanLimited?: boolean;
    }[],
    user: UserData,
  ) {
    const where = {
      ...findManyParams?.where,
      ...privateIncludedFields
        .map(({ fieldName, foremanLimited }) => ({
          [fieldName]: {
            ...(findManyParams?.where as any)?.[fieldName],
            ownerId: user.ownerId,
            ...(foremanLimited && user.roleName === 'foreman'
              ? { foremanId: user.id }
              : {}),
          },
        }))
        .reduce((acc, curr) => ({ ...acc, ...curr }), {}),
    };

    const count = await this[model].count({
      where,
    });

    const { page, perPage } = paginateParams;

    const totalPages = Math.ceil(count / perPage);

    const items = await this[model].findMany({
      ...findManyParams,
      where,
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      items,
      totalPages,
      totalItems: count,
      currentPage: page,
    };
  };

  findManyPrivatelyWithInclude = async function <T extends Prisma.ModelName>(
    model: T,
    findManyParams: Parameters<PrismaClient[T]['findMany']>['0'],
    privateIncludedFields: {
      fieldName: string;
      foremanLimited?: boolean;
    }[],
    user: UserData,
  ) {
    const where = {
      ...findManyParams?.where,
      ...privateIncludedFields
        .map(({ fieldName, foremanLimited }) => ({
          [fieldName]: {
            ownerId: user.ownerId,
            ...(foremanLimited && user.roleName === 'foreman'
              ? { foremanId: user.id }
              : {}),
          },
        }))
        .reduce((acc, curr) => ({ ...acc, ...curr }), {}),
    };

    return await this[model].findMany({
      ...findManyParams,
      where,
    });
  };

  updateManyPrivately = async function <T extends Prisma.ModelName>(
    model: T,
    args: Parameters<PrismaClient[T]['updateMany']>['0'],
    user: UserData,
    options?: QueryOptions,
  ) {
    const modifiedArgs = {
      ...args,
      where: {
        ...args.where,
        ownerId: user.ownerId,
      },
    };

    if (options?.foremanLimited && user.roleName === 'foreman') {
      modifiedArgs.where = {
        ...modifiedArgs.where,
        foremanId: user.id,
      };
    }

    return await this[model].updateMany(modifiedArgs);
  };

  updateManyPrivatelySeparately = async function <T extends Prisma.ModelName>(
    model: T,
    ids: number[],
    args: Omit<Parameters<PrismaClient[T]['update']>['0'], 'where'>,
    user: UserData,
    options?: QueryOptions,
  ) {
    const modifiedArgs = {
      ...args,
      where: {
        id: {
          in: ids,
        },
        ownerId: user.ownerId,
      },
    } as NonNullable<Parameters<PrismaClient[T]['count']>['0']>;

    if (options?.foremanLimited && user.roleName === 'foreman') {
      modifiedArgs.where = {
        ...modifiedArgs.where,
        foremanId: user.id,
      };
    }

    const count = await this[model].count({
      where: modifiedArgs.where,
    });

    if (count !== ids.length) {
      throw new NotFoundException('Не найдено');
    }

    return await this.$transaction(
      ids.map((id) => {
        const res = this[model].update({
          ...args,
          where: {
            id,
          },
        });

        res.catch((err: any) => console.log(err));

        return res;
      }),
    );
  };

  countPrivately = async function <T extends Prisma.ModelName>(
    model: T,
    args: Parameters<PrismaClient[T]['count']>['0'],
    user: UserData,
    options?: QueryOptions,
  ) {
    const modifiedArgs = {
      ...args,
      where: {
        ...args?.where,
        ownerId: user.ownerId,
      },
    };

    if (options?.foremanLimited && user.roleName === 'foreman') {
      modifiedArgs.where = {
        ...modifiedArgs.where,
        foremanId: user.id,
      };
    }

    return await this[model].count(modifiedArgs);
  };

  hasAccess = async function <T extends Prisma.ModelName>(
    model: T,
    id: number | number[],
    user: UserData,
    options?: QueryOptions,
  ) {
    const modifiedArgs = {
      where: {
        id: {
          in: Array.isArray(id) ? id : [id],
        },
        ownerId: user.ownerId,
      },
    } as NonNullable<Parameters<PrismaClient[T]['count']>['0']>;

    if (options?.foremanLimited && user.roleName === 'foreman') {
      modifiedArgs.where = {
        ...modifiedArgs.where,
        foremanId: user.id,
      };
    }

    const count = await this[model].count({
      where: modifiedArgs.where,
    });

    return count === (Array.isArray(id) ? id.length : 1);
  };
}
