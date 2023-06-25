import { ForbiddenException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserData } from 'src/auth/interfaces/UserData';
import { PaginateOptions, PrismaService } from '../prisma/prisma.service';
import { GetHistoryDto } from './dto/get-history.dto';
import { HistoryDto } from './dto/history.dto';
import { Prisma, history } from '@prisma/client';
import { MarkAsPaidDto } from './dto/mark-as-paid.dto';

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) { }

  async create(historyDto: HistoryDto, user: UserData) {
    const { productId, employeeId } = historyDto;

    const isProductAllowed = await this.prisma.hasAccess('products', productId, user);
    const isEmployeesAllowed = await this.prisma.hasAccess('employees', employeeId, user, { foremanLimited: true });

    if (!isProductAllowed || !isEmployeesAllowed)
      throw new ForbiddenException('Доступ запрещен')

    return this.prisma.createPrivately('history', {
      data: historyDto as any,
    }, user);
  }

  async findAll(getHistoryDto: GetHistoryDto, paginationParams: PaginateOptions, user: UserData) {
    const { productId, employeeId, fromDateTime, toDateTime, sort } = getHistoryDto;

    const where: Prisma.historyWhereInput = {};

    if (productId) {
      where.productId = productId;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (fromDateTime) {
      where.dateTime = {
        gte: fromDateTime,
      };
    }

    if (toDateTime) {
      where.dateTime = {
        ...(where.dateTime as Prisma.DateTimeFilter || {}),
        lte: toDateTime,
      };
    }

    return this.prisma.paginatePrivatelyWithInclude('history', paginationParams, {
      where,
      orderBy: {
        dateTime: sort,
      },
      include: {
        products: true,
        employees: true,
      },
    }, [{
      fieldName: 'products',
    }, {
      fieldName: 'employees',
      foremanLimited: true,
    }], user);
  }

  async delete(id: number, user: UserData) {
    const history = await this.prisma.history.findUnique({
      where: {
        id,
      },
    });

    if (history === null) {
      throw new HttpException('Запись не найдена', HttpStatus.NOT_FOUND);
    }

    const isProductAllowed = await this.prisma.hasAccess('products', history.productId, user);
    const isEmployeesAllowed = await this.prisma.hasAccess('employees', history.employeeId, user, { foremanLimited: true });

    if (!isProductAllowed || !isEmployeesAllowed)
      throw new ForbiddenException('Доступ запрещен')

    return this.prisma.history.delete({
      where: {
        id,
      },
    });
  }

  async markAsPaid(MarkAsPaidDto: MarkAsPaidDto, user: UserData) {
    const { employeeId, productId, fromDateTime, toDateTime } = MarkAsPaidDto;

    const isProductAllowed = !productId || await this.prisma.hasAccess('products', productId, user);
    const isEmployeesAllowed = await this.prisma.hasAccess('employees', employeeId, user, { foremanLimited: true });

    if (!isProductAllowed || !isEmployeesAllowed)
      throw new ForbiddenException('Доступ запрещен')

    const where: Prisma.historyWhereInput = {
      employeeId,
    };

    if (fromDateTime) {
      where.dateTime = {
        ...(where.dateTime as Prisma.DateTimeFilter || {}),
        gte: fromDateTime,
      };
    }

    if (toDateTime) {
      where.dateTime = {
        ...(where.dateTime as Prisma.DateTimeFilter || {}),
        lte: toDateTime,
      };
    }

    if (productId) {
      where.productId = productId;
    }

    return this.prisma.updateManyPrivately('history', {
      where,
      data: {
        isPaid: true,
      },
    }, user);
  }
}
