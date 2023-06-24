import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserData } from 'src/auth/interfaces/UserData';
import { GetLatestStatsDto } from './dto/get-latest-stats.dto';
import { Prisma, employees, history, products } from '@prisma/client';
import { CalcEmployeeDto } from './dto/calc-employee.dto';

export interface Stats {
  top10Employees: {
    id: number;
    firstName: string;
    lastName: string;
    amount: number;
  }[];
  totalAmount: number;
}

export interface CalcEmployeeData {
  totalAmount: number;
  totalPay: number;
  products: {
    id: number;
    name: string;
    amount: number;
    pay: number;
  }[];
}

type HistoryWithNumberAmount = Omit<history, 'amount'> & {
  amount: number;
};

type HistoryWithProductsAndEmployees = HistoryWithNumberAmount & {
  products: products;
  employees: employees;
};

type HistoryWithProductsPriceAndName = history & {
  products: {
    id: number;
    productPrice: number;
    productName: string;
  }
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

  async calcEmployee(employeeId: number, calcEmployeeDto: CalcEmployeeDto, user: UserData) {
    const { productId, fromDateTime, toDateTime, calcAll } = calcEmployeeDto;

    const where: Prisma.historyWhereInput = {
      employeeId,
      isPaid: false,
    };

    if (calcAll) {
      delete where.isPaid;
    }

    if (productId) {
      where.productId = productId;
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

    const history: HistoryWithProductsPriceAndName[] = await this.prisma.findManyPrivately('history', {
      where,
      include: {
        products: {
          select: {
            id: true,
            productPrice: true,
            productName: true,
          }
        }
      },
    }, user);

    const calcEmployeeData: CalcEmployeeData = {
      totalAmount: 0,
      totalPay: 0,
      products: [],
    };

    history.forEach(history => {
      const product = history.products;
      const productIndex = calcEmployeeData.products.findIndex(calcProduct => calcProduct.id === product.id);

      if (productIndex === -1) {
        calcEmployeeData.products.push({
          id: product.id,
          name: product.productName,
          amount: Number(history.amount),
          pay: Number(history.amount) * Number(product.productPrice),
        });
      } else {
        calcEmployeeData.products[productIndex].amount += Number(history.amount);
        calcEmployeeData.products[productIndex].pay += Number(history.amount) * Number(product.productPrice);
      }

      calcEmployeeData.totalAmount += Number(history.amount);
      calcEmployeeData.totalPay += Number(history.amount) * Number(product.productPrice);
    });

    return calcEmployeeData;
  }
}
