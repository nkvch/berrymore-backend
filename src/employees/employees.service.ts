import { Injectable } from "@nestjs/common";
import { employees } from "@prisma/client";
import { UserData } from "src/auth/interfaces/UserData";
import { PrismaService } from "src/prisma/prisma.service";
import { S3Service } from "src/s3/s3.service";
import { v4 as uuidv4 } from 'uuid';
import { AddEmployeeDto } from "./dto/add-employee.dto";
import { hash } from "src/common/utils/hash";

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService, private readonly s3: S3Service) { }

  async create(addEmployeeDto: AddEmployeeDto, ownerId: UserData['ownerId'], photo: Express.Multer.File): Promise<employees> {
    let photoPath: string | null = null;

    if (photo) {
      photoPath = await this.s3.saveToS3(photo);
    }

    const berryId = uuidv4();
    const contractHash = hash(addEmployeeDto.contract);
    const lastNameHash = hash(addEmployeeDto.lastName);

    const { flags, ...empData } = addEmployeeDto;

    return this.prisma.employees.create({
      data: {
        ...empData,
        photoPath,
        ownerId,
        berryId,
        contractHash,
        lastNameHash,
        flags: {
          connect: flags.map(flag => ({ id: flag })),
        }
      } as any,
    });
  }
}