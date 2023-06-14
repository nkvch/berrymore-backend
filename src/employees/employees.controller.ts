import { Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { EmployeesService } from "./employees.service";
import { JwtGuard, RestrictRolesGuard } from "src/auth/guards";
import { FileInterceptor } from "@nestjs/platform-express";
import { AddEmployeeDto } from "./dto/add-employee.dto";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { UserData } from "src/auth/interfaces/UserData";

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) { }

  @Post()
  @UseGuards(JwtGuard, new RestrictRolesGuard('foreman'))
  @UseInterceptors(FileInterceptor('photo'))
  addEmployee(@Body() addEmployeeDto: AddEmployeeDto, @GetUser('ownerId') ownerId: UserData['ownerId'], @UploadedFile() photo: Express.Multer.File) {
    return this.employeesService.create(addEmployeeDto, ownerId, photo);
  }
}