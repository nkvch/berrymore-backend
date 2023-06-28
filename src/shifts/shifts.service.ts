import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { addDays, eachDayOfInterval, isSameDay } from "date-fns";
import { UserData } from "src/auth/interfaces/UserData";
import { PrismaService } from "src/prisma/prisma.service";
import { AddShiftDto } from "./dto/add-shift.dto";
import { ChangeBoundsDto } from "./dto/change-bounds.dto";
import { CutOutPeriod } from "./dto/cut-out-period.dto";
import { GetShiftsDto } from "./dto/get-shifts.dto";

@Injectable()
export class ShiftsService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async addShift(addShiftDto: AddShiftDto, user: UserData) {
    const { employeeIds, startDate, endDate } = addShiftDto;

    if (startDate > endDate) {
      throw new HttpException('Время начала должно быть раньше времени окончания', HttpStatus.BAD_REQUEST);
    }

    for (const employeeId of employeeIds) {
      const existingShifts = await this.prisma.findManyPrivately('shifts', {
        where: {
          employeeId,
          OR: [
            {
              startDate: {
                gte: startDate,
                lte: endDate,
              },
            },
            {
              endDate: {
                gte: startDate,
                lte: endDate,
              },
            },
          ]
        },
      }, user);

      if (existingShifts.length) {
        throw new HttpException('Смена пересекается с другой сменой', HttpStatus.BAD_REQUEST);
      }
    }

    return this.prisma.createManyPrivately('shifts', {
      data: employeeIds.map(employeeId => ({
        employeeId,
        startDate,
        endDate,
      })),
    }, user);
  }

  async getShifts(getShiftsDto: GetShiftsDto, user: UserData) {
    const { employeeId, from, to } = getShiftsDto;

    let where: Prisma.shiftsWhereInput = {
      OR: [],
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (from && !to) {
      // get all shifts that intersect with the interval from - now
      (where.OR as Array<Prisma.shiftsWhereInput>).push(...[{
        startDate: {
          gte: from,
          lte: new Date(),
        }
      }, {
        endDate: {
          gte: from,
          lte: new Date(),
        }
      }, {
        startDate: {
          lt: from
        },
        endDate: {
          gt: from
        }
      }]);
    } else if (!from && to) {
      // get all shifts that intersect with the interval now - to
      (where.OR as Array<Prisma.shiftsWhereInput>).push(...[{
        startDate: {
          gte: new Date(),
          lte: to,
        }
      }, {
        endDate: {
          gte: new Date(),
          lte: to,
        }
      }, {
        startDate: {
          lt: to
        },
        endDate: {
          gt: to
        }
      }]);
    } else if (from && to) {
      // get all shifts that intersect with the interval from - to
      (where.OR as Array<Prisma.shiftsWhereInput>).push(...[{
        startDate: {
          gte: from,
          lte: to,
        }
      }, {
        endDate: {
          gte: from,
          lte: to,
        }
      }, {
        startDate: {
          lt: from
        },
        endDate: {
          gt: to
        }
      }]);
    }

    if (!(where.OR as Array<Prisma.shiftsWhereInput>).length) {
      delete where.OR;
    }

    return this.prisma.findManyPrivatelyWithInclude('shifts', {
      where,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            foreman: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            photoPath: true,
          },
        },
      }
    }, [{
      fieldName: 'employees',
      foremanLimited: true,
    }], user);
  }

  async changeBounds(shiftId: number, { newstartDate, newendDate }: ChangeBoundsDto, user: UserData) {
    return this.prisma.updatePrivately('shifts', {
      where: {
        id: shiftId,
      },
      data: {
        startDate: newstartDate,
        endDate: newendDate,
      },
    }, user);
  }

  async cutOutPeriod({ startDate, endDate, employeeIds }: CutOutPeriod, user: UserData) {
    const where: Prisma.shiftsWhereInput = {
      OR: []
    };

    if (employeeIds) {
      where.employeeId = {
        in: employeeIds,
      }
    }

    (where.OR as Array<Prisma.shiftsWhereInput>).push(...[{
      startDate: {
        gte: startDate,
        lte: endDate,
      }
    }, {
      endDate: {
        gte: startDate,
        lte: endDate,
      }
    }, {
      startDate: {
        lt: startDate
      },
      endDate: {
        gt: endDate
      }
    }]);

    const modelData = await this.prisma.findManyPrivatelyWithInclude('shifts', {
      where,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        employeeId: true,
        employees: true
      }
    }, [{
      fieldName: 'employees',
      foremanLimited: true,
    }], user);

    const ids = modelData.map((md: { id: number }) => md.id);

    await this.prisma.deleteManyPrivately('shifts', {
      where: {
        id: {
          in: ids,
        }
      }
    }, user);

    const periodLength = eachDayOfInterval({
      start: startDate,
      end: endDate,
    }).length;

    // recreate shifts
    for (const shift of modelData) {
      const wasFirstDay = isSameDay(shift.startDate, startDate);
      const wasLastDay = isSameDay(shift.endDate, endDate);

      if (wasFirstDay && wasLastDay) {
        continue;
      }

      if (wasFirstDay) {
        await this.prisma.createPrivately('shifts', {
          data: {
            employeeId: shift.employeeId,
            startDate: addDays(shift.startDate, periodLength),
            endDate: shift.endDate,
          }
        }, user);
      } else if (wasLastDay) {
        await this.prisma.createPrivately('shifts', {
          data: {
            employeeId: shift.employeeId,
            startDate: shift.startDate,
            endDate: addDays(shift.endDate, -periodLength),
          }
        }, user);
      }

      if (!wasFirstDay && !wasLastDay) {
        await this.prisma.createPrivately('shifts', {
          data: {
            employeeId: shift.employeeId,
            startDate: shift.startDate,
            endDate: addDays(startDate, -1),
          }
        }, user);

        await this.prisma.createPrivately('shifts', {
          data: {
            employeeId: shift.employeeId,
            startDate: addDays(endDate, 1),
            endDate: shift.endDate,
          }
        }, user);
      }
    }

    return modelData;
  }

  async deleteShift(shiftId: number, user: UserData) {
    return this.prisma.deletePrivately('shifts', {
      where: {
        id: shiftId,
      }
    }, user);
  }
}
