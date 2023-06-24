import { HttpException, HttpStatus, Injectable, Query } from "@nestjs/common";
import { Prisma, employees } from "@prisma/client";
import { UserData } from "src/auth/interfaces/UserData";
import { PaginateOptions, PrismaService } from "src/prisma/prisma.service";
import { S3Service } from "src/s3/s3.service";
import { v4 as uuidv4 } from 'uuid';
import { EmployeeDto } from "./dto/employee.dto";
import { hash } from "src/common/utils/hash";
import { GetEmployeesDto } from "./dto/get-employees.dto";
import { SelectType, searchMany } from "src/common/utils/searchMany";
import { BulkUpdateEmployeesDto } from "./dto/bulk-upd-employees.dto";

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService, private readonly s3: S3Service) { }

  async create(addEmployeeDto: EmployeeDto, user: UserData, photo: Express.Multer.File): Promise<employees> {
    let photoPath: string | null = null;

    if (photo) {
      photoPath = await this.s3.saveToS3(photo);
    }

    const berryId = uuidv4();
    const contractHash = hash(addEmployeeDto.contract);
    const lastNameHash = hash(addEmployeeDto.lastName);
    const phoneHash = hash(addEmployeeDto.phone);

    const { flags, ...empData } = addEmployeeDto;

    try {
      return this.prisma.createPrivately('employees', {
        data: {
          ...empData,
          photoPath,
          berryId,
          contractHash,
          lastNameHash,
          phoneHash,
          flags: {
            connect: flags.map(flag => ({ id: flag })),
          }
        } as any,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          berryId: true,
          contract: true,
          phone: true,
          address: true,
          additionalInfo: true,
        }
      }, user);
    } catch (err) {
      if (photoPath) {
        await this.s3.deleteFromS3(photoPath);
      }
      console.error(err);
      throw new HttpException('Ошибка при создании сотрудника', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getEmployees(getEmployeesDto: GetEmployeesDto, pagOpts: PaginateOptions, user: UserData) {
    const { search, foremanId, flagsPresent, flagsAbsent } = getEmployeesDto;

    const where: Prisma.employeesWhereInput = {
      AND: [],
    };

    if (foremanId) {
      where.foremanId = foremanId;
    }

    if (search) {
      const searchHash = hash(search) as string;
      const orClause = searchMany('employees', searchHash, ['lastNameHash', 'contractHash', 'phoneHash'] as Array<keyof SelectType<'employees'>>);

      where.AND = [orClause];
    }

    if (flagsPresent) {
      const flagsAndClause = flagsPresent.map(flag => ({ flags: { some: { id: flag } } }));
      where.AND = [...where.AND as any, ...flagsAndClause];
    }

    if (flagsAbsent) {
      const flagsAndClause = flagsAbsent.map(flag => ({ flags: { none: { id: flag } } }));
      where.AND = [...where.AND as any, ...flagsAndClause];
    }

    return this.prisma.paginatePrivately('employees', pagOpts, {
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        berryId: true,
        contract: true,
        phone: true,
        address: true,
        additionalInfo: true,
        photoPath: true,
        flags: true,
        foreman: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    }, user, { foremanLimited: true });
  }

  async getEmployeeById(id: number, user: UserData) {
    const where = {
      id,
    };

    return this.prisma.findUniquePrivately('employees', {
      where,
      include: {
        flags: true,
      }
    }, user, { foremanLimited: true });
  }

  async getEmployeeByBerryId(berryId: string, user: UserData) {
    const where: Prisma.employeesWhereInput = {
      berryId,
    };

    return this.prisma.findFirstPrivately('employees', {
      where,
      include: {
        flags: true,
      }
    }, user, { foremanLimited: true });
  }

  async updateEmployee(id: number, employeeDto: EmployeeDto, user: UserData, photo: Express.Multer.File) {
    const { flags, ...empData } = employeeDto;

    const existingEmployee = await this.prisma.findUniquePrivately('employees', {
      where: { id },
      include: {
        flags: true,
      }
    }, user, { foremanLimited: true });

    let photoPath: string | null = null;

    if (existingEmployee.photoPath && photo) {
      photoPath = await this.s3.updateInS3(existingEmployee.photoPath, photo);
    } else if (!existingEmployee.photoPath && photo) {
      photoPath = await this.s3.saveToS3(photo);
    } else if (existingEmployee.photoPath && !photo) {
      await this.s3.deleteFromS3(existingEmployee.photoPath);
    }

    const contractHash = hash(employeeDto.contract);
    const lastNameHash = hash(employeeDto.lastName);

    try {
      return this.prisma.updatePrivately('employees', {
        where: {
          id,
        },
        data: {
          ...empData,
          photoPath,
          contractHash,
          lastNameHash,
          flags: {
            set: flags.map(flag => ({ id: flag })),
          }
        } as any,
      }, user, { foremanLimited: true });
    } catch (err) {
      console.error(err);
      throw new HttpException('Ошибка при обновлении сотрудника', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteEmployee(id: number, user: UserData) {
    const deletedEmployee = await this.prisma.deletePrivately('employees', {
      where: {
        id,
      },
      select: {
        firstName: true,
        lastName: true,
        photoPath: true,
      },
    }, user, { foremanLimited: true });

    if (deletedEmployee.photoPath) {
      await this.s3.deleteFromS3(deletedEmployee.photoPath);
    }

    return deletedEmployee;
  }

  async bulkUpdateEmployeesFlags(employeeDto: BulkUpdateEmployeesDto, user: UserData) {
    const { ids, setFlags, removeFlags } = employeeDto;

    const result = await this.prisma.updateManyPrivatelySeparately('employees', ids, {
      data: {
        flags: {
          connect: setFlags.map(flag => ({ id: flag })),
          disconnect: removeFlags.map(flag => ({ id: flag })),
        },
      },
      select: {
        id: true,
      }
    }, user, { foremanLimited: true });

    return result;
  }
}
