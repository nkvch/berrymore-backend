import { Body, Controller, Delete, Get, Post, Put, UseGuards } from '@nestjs/common';
import { FlagsService } from './flags.service';
import { JwtGuard, RestrictRolesGuard } from 'src/auth/guards';
import { FlagDto } from './dto/flag-dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { UserData } from 'src/auth/interfaces/UserData';
import { IdParam } from 'src/common/decorators/id-param.decorator';

@Controller('flags')
export class FlagsController {
  constructor(private readonly flagsService: FlagsService) { }

  @Get()
  async findAll() {
    return this.flagsService.findAll();
  }

  @UseGuards(JwtGuard, new RestrictRolesGuard('foreman'))
  @Post()
  async create(@Body() flagDto: FlagDto, @GetUser('ownerId') ownerId: UserData['ownerId']) {
    return this.flagsService.create(flagDto, ownerId);
  }

  @UseGuards(JwtGuard, new RestrictRolesGuard('foreman'))
  @Put(':id')
  async update(@IdParam() id: number, @Body() flagDto: FlagDto, @GetUser('ownerId') ownerId: UserData['ownerId']) {
    return this.flagsService.update(id, flagDto, ownerId);
  }

  @UseGuards(JwtGuard, new RestrictRolesGuard('foreman'))
  @Delete(':id')
  async delete(@IdParam() id: number, @GetUser('ownerId') ownerId: UserData['ownerId']) {
    return this.flagsService.delete(id, ownerId);
  }
}
