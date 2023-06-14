import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { flags } from '@prisma/client';
import { FlagDto } from './dto/flag-dto';
import { UserData } from 'src/auth/interfaces/UserData';

@Injectable()
export class FlagsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(): Promise<flags[]> {
    return this.prisma.flags.findMany();
  }

  async create(flagDto: FlagDto, ownerId: UserData['ownerId']): Promise<flags> {
    return this.prisma.flags.create({
      data: {
        ...flagDto,
        ownerId,
      }
    });
  }

  async update(flagId: flags['id'], flagDto: FlagDto, ownerId: UserData['ownerId']): Promise<flags> {
    const flag = await this.prisma.flags.findFirst({
      where: {
        id: flagId,
        ownerId,
      }
    });

    if (!flag) {
      throw new HttpException(
        'Флаг не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.flags.update({
      where: {
        id: flagId,
      },
      data: {
        ...flagDto,
      }
    });
  }

  async delete(flagId: flags['id'], ownerId: UserData['ownerId']): Promise<flags> {
    const flag = await this.prisma.flags.findFirst({
      where: {
        id: flagId,
        ownerId,
      }
    });

    if (!flag) {
      throw new HttpException(
        'Флаг не найден',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.flags.delete({
      where: {
        id: flagId,
      }
    });
  }
}
