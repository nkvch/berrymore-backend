import { HttpException, HttpStatus, Injectable, Query } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserData } from 'src/auth/interfaces/UserData';
import { EncryptService } from 'src/encrypt/encrypt.service';
import { PaginateOptions, PrismaService } from 'src/prisma/prisma.service';
import { AddForemanDto } from './dto/add-foreman.dto';
import { users } from '@prisma/client';
import { UpdateForemanDto } from './dto/update-foreman.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptService: EncryptService,
  ) { }

  async addForeman(foreman: AddForemanDto, ownerId: UserData['ownerId']) {
    const role = await this.prisma.roles.findFirst({
      where: {
        roleName: 'foreman',
      },
    });

    const roleId = role?.id as number;

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(foreman.password, salt);

    const encryptedOwnerHash =
      this.encryptService.encryptOwnerHashWithForemanHash(ownerId, hash);

    try {
      const newForeman = await this.prisma.users.create({
        data: {
          ...foreman,
          roleId,
          password: hash,
          ownerHash: encryptedOwnerHash,
          ownerId,
        },
      });

      return newForeman;
    } catch (error) {
      throw new HttpException(
        'Пользователь с таким именем уже существует',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getForeman(foremanId: users['id'], ownerId: UserData['ownerId']) {
    const foreman = await this.prisma.users.findFirst({
      where: {
        id: foremanId,
        ownerId,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
      }
    });

    if (!foreman)
      throw new HttpException('Бригадир не найден', HttpStatus.NOT_FOUND);

    return foreman;
  }

  async getForemen(
    ownerId: UserData['ownerId'],
    paginationParams: PaginateOptions,
  ) {
    const data = await this.prisma.paginate('users', paginationParams, {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      where: {
        ownerId,
        roles: {
          roleName: 'foreman',
        },
      },
      orderBy: {
        lastName: 'asc',
      },
    });

    return data;
  }

  async updateForeman(
    foremanId: users['id'],
    foreman: UpdateForemanDto,
    ownerId: UserData['ownerId'],
  ) {
    const exists = !!(await this.prisma.users.findFirst({
      where: {
        id: foremanId,
        ownerId,
      },
    }));

    if (!exists)
      throw new HttpException('Бригадир не найден', HttpStatus.NOT_FOUND);

    const updatedForeman = await this.prisma.users.update({
      where: {
        id: foremanId,
      },
      data: {
        ...foreman,
      },
    });

    return updatedForeman;
  }

  async deleteForeman(foremanId: users['id'], ownerId: UserData['ownerId']) {
    const exists = !!(await this.prisma.users.findFirst({
      where: {
        id: foremanId,
        ownerId,
      },
    }));

    if (!exists)
      throw new HttpException('Бригадир не найден', HttpStatus.NOT_FOUND);

    const deletedForeman = await this.prisma.users.delete({
      where: {
        id: foremanId,
      },
    });

    return deletedForeman;
  }
}
