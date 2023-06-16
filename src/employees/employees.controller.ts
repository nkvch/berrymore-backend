import { BadRequestException, Body, Controller, Get, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { EmployeesService } from "./employees.service";
import { JwtGuard, RestrictRolesGuard } from "src/auth/guards";
import { FileInterceptor } from "@nestjs/platform-express";
import { EmployeeDto } from "./dto/employee.dto";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { UserData } from "src/auth/interfaces/UserData";
import { GetEmployeesDto } from "./dto/get-employees.dto";
import { PaginationParams } from "src/common/decorators/pagination-query-params.decorator";
import { PaginateOptions } from "src/prisma/prisma.service";
import { validate } from "class-validator";
import { IdParam } from "src/common/decorators/id-param.decorator";
import { BulkUpdateEmployeesDto } from "./dto/bulk-upd-employees.dto";

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) { }

  @Post()
  @UseGuards(JwtGuard, new RestrictRolesGuard('foreman'))
  @UseInterceptors(FileInterceptor('photo'))
  addEmployee(@Body() addEmployeeDto: EmployeeDto, @GetUser() user: UserData, @UploadedFile() photo: Express.Multer.File) {
    return this.employeesService.create(addEmployeeDto, user, photo);
  }

  @Get()
  @UseGuards(JwtGuard)
  async getEmployees(@Query() getEmployeesDto: GetEmployeesDto, @PaginationParams() pgnOpts: PaginateOptions, @GetUser() user: UserData) {
    return this.employeesService.getEmployees(getEmployeesDto, pgnOpts, user);
  }

  @Get('byBerryId')
  @UseGuards(JwtGuard)
  async getEmployeeByBerryId(@Query('berryId') berryId: string, @GetUser() user: UserData) {
    return this.employeesService.getEmployeeByBerryId(berryId, user);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  async getEmployee(@IdParam() id: number, @GetUser() user: UserData) {
    return this.employeesService.getEmployeeById(id, user);
  }

  @Put('bulk')
  @UseGuards(JwtGuard)
  async bulkUpdateEmployees(@Body() bulkUpdateEmployeesDto: BulkUpdateEmployeesDto, @GetUser() user: UserData) {
    return this.employeesService.bulkUpdateEmployeesFlags(bulkUpdateEmployeesDto, user);
  }

  @Put(':id')
  @UseGuards(JwtGuard, new RestrictRolesGuard('foreman'))
  @UseInterceptors(FileInterceptor('photo'))
  async updateEmployee(@IdParam() id: number, @Body() updateEmployeeDto: EmployeeDto, @GetUser() user: UserData, @UploadedFile() photo: Express.Multer.File) {
    return this.employeesService.updateEmployee(id, updateEmployeeDto, user, photo);
  }
}
