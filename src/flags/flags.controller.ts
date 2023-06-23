import { Body, Controller, Delete, Get, Post, Put, UseGuards } from '@nestjs/common';
import { FlagsService } from './flags.service';
import { JwtGuard, RestrictRolesGuard } from 'src/auth/guards';
import { FlagDto } from './dto/flag-dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { UserData } from 'src/auth/interfaces/UserData';
import { IdParam } from 'src/common/decorators/id-param.decorator';
import { PaginationParams } from 'src/common/decorators/pagination-query-params.decorator';
import { PaginateOptions } from 'src/prisma/prisma.service';

@Controller('flags')
export class FlagsController {
  constructor(private readonly flagsService: FlagsService) { }

  @UseGuards(JwtGuard)
  @Get()
  async findAll(@PaginationParams() pagOpts: PaginateOptions, @GetUser() user: UserData) {
    return this.flagsService.findAll(pagOpts, user);
  }

  @UseGuards(JwtGuard, new RestrictRolesGuard('foreman'))
  @Post()
  async create(@Body() flagDto: FlagDto, @GetUser() user: UserData) {
    return this.flagsService.create(flagDto, user);
  }

  @UseGuards(JwtGuard, new RestrictRolesGuard('foreman'))
  @Put(':id')
  async update(@IdParam() id: number, @Body() flagDto: FlagDto, @GetUser() user: UserData) {
    return this.flagsService.update(id, flagDto, user);
  }

  @UseGuards(JwtGuard, new RestrictRolesGuard('foreman'))
  @Delete(':id')
  async delete(@IdParam() id: number, @GetUser() user: UserData) {
    return this.flagsService.delete(id, user);
  }
}
