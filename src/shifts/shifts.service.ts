import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { AddShiftDto } from "./dto/add-shift.dto";
import { UserData } from "src/auth/interfaces/UserData";
import { PrismaService } from "src/prisma/prisma.service";
import { GetShiftsDto } from "./dto/get-shifts.dto";
import { Prisma } from "@prisma/client";
import { ChangeBoundsDto } from "./dto/change-bounds.dto";
import { CutOutPeriod } from "./dto/cut-out-period.dto";
import { addDays, eachDayOfInterval, endOfDay, isSameDay, startOfDay } from "date-fns";

@Injectable()
export class ShiftsService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async addShift(addShiftDto: AddShiftDto, user: UserData) {
    const { employeeIds, startTime, endTime } = addShiftDto;

    if (startTime >= endTime) {
      throw new HttpException('Время начала должно быть раньше времени окончания', HttpStatus.BAD_REQUEST);
    }

    for (const employeeId of employeeIds) {
      const existingShifts = await this.prisma.findManyPrivately('shifts', {
        where: {
          employeeId,
          OR: [
            {
              startTime: {
                gte: startTime,
                lte: endTime,
              },
            },
            {
              endTime: {
                gte: startTime,
                lte: endTime,
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
        startTime,
        endTime,
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
        startTime: {
          gte: from,
          lte: new Date(),
        }
      }, {
        endTime: {
          gte: from,
          lte: new Date(),
        }
      }, {
        startTime: {
          lt: from
        },
        endTime: {
          gt: from
        }
      }]);
    } else if (!from && to) {
      // get all shifts that intersect with the interval now - to
      (where.OR as Array<Prisma.shiftsWhereInput>).push(...[{
        startTime: {
          gte: new Date(),
          lte: to,
        }
      }, {
        endTime: {
          gte: new Date(),
          lte: to,
        }
      }, {
        startTime: {
          lt: to
        },
        endTime: {
          gt: to
        }
      }]);
    } else if (from && to) {
      // get all shifts that intersect with the interval from - to
      (where.OR as Array<Prisma.shiftsWhereInput>).push(...[{
        startTime: {
          gte: from,
          lte: to,
        }
      }, {
        endTime: {
          gte: from,
          lte: to,
        }
      }, {
        startTime: {
          lt: from
        },
        endTime: {
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
        startTime: true,
        endTime: true,
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

  async changeBounds(shiftId: number, { newStartTime, newEndTime }: ChangeBoundsDto, user: UserData) {
    return this.prisma.updatePrivately('shifts', {
      where: {
        id: shiftId,
      },
      data: {
        startTime: newStartTime,
        endTime: newEndTime,
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
      startTime: {
        gte: startDate,
        lte: endDate,
      }
    }, {
      endTime: {
        gte: startDate,
        lte: endDate,
      }
    }, {
      startTime: {
        lt: startDate
      },
      endTime: {
        gt: endDate
      }
    }]);

    const modelData = await this.prisma.findManyPrivatelyWithInclude('shifts', {
      where,
      select: {
        id: true,
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
      const wasFirstDay = isSameDay(shift.startTime, startDate);
      const wasLastDay = isSameDay(shift.endTime, endDate);

      if (wasFirstDay && wasLastDay) {
        continue;
      }

      if (wasFirstDay) {
        await this.prisma.createPrivately('shifts', {
          data: {
            employeeId: shift.employeeId,
            startTime: addDays(shift.startTime, periodLength),
            endTime: shift.endTime,
          }
        }, user);
      } else if (wasLastDay) {
        await this.prisma.createPrivately('shifts', {
          data: {
            employeeId: shift.employeeId,
            startTime: shift.startTime,
            endTime: addDays(shift.endTime, -periodLength),
          }
        }, user);
      }

      if (!wasFirstDay && !wasLastDay) {
        await this.prisma.createPrivately('shifts', {
          data: {
            employeeId: shift.employeeId,
            startTime: shift.startTime,
            endTime: addDays(endOfDay(startDate), -1),
          }
        }, user);

        await this.prisma.createPrivately('shifts', {
          data: {
            employeeId: shift.employeeId,
            startTime: addDays(startOfDay(endDate), 1),
            endTime: shift.endTime,
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
