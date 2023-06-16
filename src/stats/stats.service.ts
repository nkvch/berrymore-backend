import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserData } from 'src/auth/interfaces/UserData';
import { GetLatestStatsDto } from './dto/get-latest-stats.dto';
import { Prisma, employees, history, products } from '@prisma/client';

export interface Stats {
  top10Employees: {
    id: number;
    firstName: string;
    lastName: string;
    amount: number;
  }[];
  totalAmount: number;
}

type HistoryWithNumberAmount = Omit<history, 'amount'> & {
  amount: number;
};

type HistoryWithProductsAndEmployees = HistoryWithNumberAmount & {
  products: products;
  employees: employees;
};

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) { }

  async getLatestStats(getLatestStatsDto: GetLatestStatsDto, user: UserData) {
    const { productId, foremanId } = getLatestStatsDto;
    const twoWeeksAgoDateTime = new Date(new Date().getTime() - 14 * 24 * 60 * 60 * 1000);

    const where: Prisma.historyWhereInput = {
      dateTime: {
        gte: twoWeeksAgoDateTime,
      },
    };

    if (productId) {
      where.productId = productId;
    }

    if (foremanId) {
      where.employees = {
        foremanId,
      }
    }

    const latestHistory: HistoryWithProductsAndEmployees[] = await this.prisma.findManyPrivately('history', {
      where,
      select: {
        employees: true,
        products: true,
        amount: true,
      },
      orderBy: {
        dateTime: 'desc',
      },
    }, user);

    const top10Employees = latestHistory
      .reduce((acc: Stats['top10Employees'], history) => {
        const employee = history.employees;
        const employeeIndex = acc.findIndex(accEmployee => accEmployee.id === employee.id);

        history.amount = Number(history.amount);

        if (employeeIndex === -1) {
          acc.push({
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            amount: history.amount,
          });
        } else {
          acc[employeeIndex].amount += history.amount;
        }

        return acc;
      }, [] as Stats['top10Employees']).sort((a, b) => b.amount - a.amount).slice(0, 10);

    const totalAmount = latestHistory.reduce((acc, history) => {
      acc += Number(history.amount);
      return acc;
    }, 0);

    return {
      top10Employees,
      totalAmount,
    };
  }
}
