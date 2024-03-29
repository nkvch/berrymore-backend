import { Body, Controller, Delete, Get, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { JwtGuard, RestrictRolesGuard } from "src/auth/guards";
import { UserData } from "src/auth/interfaces/UserData";
import { IdParam } from "src/common/decorators/id-param.decorator";
import { PaginationParams } from "src/common/decorators/pagination-query-params.decorator";
import { PaginateOptions } from "src/prisma/prisma.service";
import { BulkUpdateEmployeesDto } from "./dto/bulk-upd-employees.dto";
import { EmployeeDto } from "./dto/employee.dto";
import { GetEmployeesDto } from "./dto/get-employees.dto";
import { EmployeesService } from "./employees.service";

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) { }

  @Post()
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('photo'))
  addEmployee(@Body() addEmployeeDto: EmployeeDto, @GetUser() user: UserData, @UploadedFile() photo: Express.Multer.File) {
    return this.employeesService.create(addEmployeeDto, user, photo);
  }

  @Get()
  @UseGuards(JwtGuard)
  async getEmployees(@Query() getEmployeesDto: GetEmployeesDto, @PaginationParams() pgnOpts: PaginateOptions, @GetUser() user: UserData) {
    return this.employeesService.getEmployees(getEmployeesDto, pgnOpts, user);
  }

  @Get('by-berry-id')
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
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async updateEmployee(@IdParam() id: number, @Body() updateEmployeeDto: EmployeeDto, @GetUser() user: UserData, @UploadedFile() photo: Express.Multer.File) {
    return this.employeesService.updateEmployee(id, updateEmployeeDto, user, photo);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  async deleteEmployee(@IdParam() id: number, @GetUser() user: UserData) {
    return this.employeesService.deleteEmployee(id, user);
  }

  @Get('has-any-data/:id')
  @UseGuards(JwtGuard)
  async hasAnyData(@IdParam() id: number, @GetUser() user: UserData) {
    return this.employeesService.hasEmployeeShiftsOrHistory(id, user);
  }

  @Delete('all-data/:id')
  @UseGuards(JwtGuard, new RestrictRolesGuard('foreman'))
  async deleteAllData(@IdParam() id: number, @GetUser() user: UserData) {
    return this.employeesService.deleteAllEmployeeShiftsAndHistory(id, user);
  }

  @Put('archive/:id')
  @UseGuards(JwtGuard)
  async archiveEmployee(@IdParam() id: number, @GetUser() user: UserData) {
    return this.employeesService.archiveEmployee(id, user);
  }
}
