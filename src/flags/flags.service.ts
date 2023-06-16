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

  async create(flagDto: FlagDto, user: UserData): Promise<flags> {
    return this.prisma.createPrivately('flags', {
      data: flagDto,
    }, user);
  }

  async update(flagId: flags['id'], flagDto: FlagDto, user: UserData) {
    return this.prisma.updatePrivately('flags', {
      where: {
        id: flagId,
      },
      data: {
        ...flagDto,
      }
    }, user);
  }

  async delete(flagId: flags['id'], user: UserData): Promise<flags> {
    return this.prisma.deletePrivately('flags', {
      where: {
        id: flagId,
      }
    }, user);
  }
}
