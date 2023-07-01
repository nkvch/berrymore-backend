import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { JwtGuard, RestrictRolesGuard } from 'src/auth/guards';
import { UserData } from 'src/auth/interfaces/UserData';
import { StatsService } from './stats.service';
import { GetLatestStatsDto } from './dto/get-latest-stats.dto';
import { IdParam } from 'src/common/decorators/id-param.decorator';
import { CalcEmployeeDto } from './dto/calc-employee.dto';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) { }

  @Get()
  @UseGuards(JwtGuard, new RestrictRolesGuard('foreman'))
  async getLatestStats(@Query() getLatestStatsDto: GetLatestStatsDto, @GetUser() user: UserData) {
    return this.statsService.getStats(getLatestStatsDto, user);
  }

  @Get('calc/:id')
  @UseGuards(JwtGuard, new RestrictRolesGuard('foreman'))
  async calcEmployee(@IdParam() employeeId: number, @Query() calcEmployeeDto: CalcEmployeeDto, @GetUser() user: UserData) {
    return this.statsService.calcEmployee(employeeId, calcEmployeeDto, user);
  }
}
