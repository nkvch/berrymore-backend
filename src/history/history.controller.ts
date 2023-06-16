import { Body, Controller, Delete, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { JwtGuard, RestrictRolesGuard } from 'src/auth/guards';
import { UserData } from 'src/auth/interfaces/UserData';
import { PaginationParams } from 'src/common/decorators/pagination-query-params.decorator';
import { PaginateOptions } from 'src/prisma/prisma.service';
import { GetHistoryDto } from './dto/get-history.dto';
import { HistoryDto } from './dto/history.dto';
import { HistoryService } from './history.service';
import { IdParam } from 'src/common/decorators/id-param.decorator';
import { MarkAsPaidDto } from './dto/mark-as-paid.dto';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) { }

  @Post()
  @UseGuards(JwtGuard)
  async create(@Body() flagDto: HistoryDto, @GetUser() user: UserData) {
    return this.historyService.create(flagDto, user);
  }

  @Get()
  @UseGuards(JwtGuard)
  async findAll(@Query() getHistoryDto: GetHistoryDto, @PaginationParams() paginationParams: PaginateOptions, @GetUser() user: UserData) {
    return this.historyService.findAll(getHistoryDto, paginationParams, user);
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  async delete(@IdParam() id: number, @GetUser() user: UserData) {
    return this.historyService.delete(id, user);
  }

  @UseGuards(JwtGuard, new RestrictRolesGuard('foreman'))
  @Put('mark-as-paid')
  async markAsPaid(@Body() markAsPaidDto: MarkAsPaidDto, @GetUser() user: UserData) {
    return this.historyService.markAsPaid(markAsPaidDto, user);
  }
}
