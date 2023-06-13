import { HttpException, HttpStatus, Injectable, Query } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserData } from 'src/auth/interfaces/UserData';
import { EncryptService } from 'src/encrypt/encrypt.service';
import { PaginateOptions, PrismaService } from 'src/prisma/prisma.service';
import { AddForemanDto } from './dto/add-foreman.dto';
import { users } from '@prisma/client';


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

    const encryptedOwnerHash = this.encryptService.encryptOwnerHashWithForemanHash(ownerId, hash);

    const newForeman = await this.prisma.users.create({
      data: {
        ...foreman,
        roleId,
        password: hash,
        ownerHash: encryptedOwnerHash,
        ownerId,
      }
    })

    return newForeman;
  }

  async getForeman(foremanId: users['id'], ownerId: UserData['ownerId']) {
    const foreman = await this.prisma.users.findFirst({
      where: {
        id: foremanId,
        ownerId,
      },
    });

    if (!foreman) throw new HttpException('Бригадир не найден', HttpStatus.NOT_FOUND);

    return foreman;
  }

  async getForemen(ownerId: UserData['ownerId'], paginationParams: PaginateOptions) {
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
        }
      },
      orderBy: {
        lastName: 'asc',
      },
    });

    return data;
  }
}
