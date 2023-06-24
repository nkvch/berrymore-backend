import { Body, Controller, Delete, Get, Post, Put, Query, UseGuards } from "@nestjs/common";
import { JwtGuard } from "src/auth/guards";
import { AddShiftDto } from "./dto/add-shift.dto";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { UserData } from "src/auth/interfaces/UserData";
import { ShiftsService } from "./shifts.service";
import { GetShiftsDto } from "./dto/get-shifts.dto";
import { ChangeBoundsDto } from "./dto/change-bounds.dto";
import { IdParam } from "src/common/decorators/id-param.decorator";
import { CutOutPeriod } from "./dto/cut-out-period.dto";

@Controller('shifts')
export class ShiftsController {
  constructor(
    private readonly shiftsService: ShiftsService,
  ) { }

  @Post()
  @UseGuards(JwtGuard)
  async create(@Body() addShiftDto: AddShiftDto, @GetUser() user: UserData) {
    return this.shiftsService.addShift(addShiftDto, user);
  }

  @Get()
  @UseGuards(JwtGuard)
  async findAll(@Query() getShiftsDto: GetShiftsDto, @GetUser() user: UserData) {
    return this.shiftsService.getShifts(getShiftsDto, user);
  }

  @Put(':id')
  @UseGuards(JwtGuard)
  async changeBounds(@IdParam() shiftId: number, @Body() changeBoundsDto: ChangeBoundsDto, @GetUser() user: UserData) {
    return this.shiftsService.changeBounds(shiftId, changeBoundsDto, user);
  }

  @Put('cut-out-period')
  @UseGuards(JwtGuard)
  async cutOutPeriod(@Body() cutOutPeriodDto: CutOutPeriod, @GetUser() user: UserData) {
    return this.shiftsService.cutOutPeriod(cutOutPeriodDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  async deleteShift(@IdParam() shiftId: number, @GetUser() user: UserData) {
    return this.shiftsService.deleteShift(shiftId, user);
  }
}
