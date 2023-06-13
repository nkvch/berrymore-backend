import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { JwtGuard, RestrictRolesGuard } from 'src/auth/guards';
import { UserData } from 'src/auth/interfaces/UserData';
import { AddForemanDto } from './dto/add-foreman.dto';
import { UserService } from './user.service';
import { users } from '@prisma/client';
import { IdParam } from 'src/common/decorators/id-param.decorator';
import { PaginationParams } from 'src/common/decorators/pagination-query-params.decorator';
import { PaginateOptions } from 'src/prisma/prisma.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) { }

  @UseGuards(JwtGuard, new RestrictRolesGuard('foreman'))
  @Post('foremen')
  addForeman(@Body() foremanDto: AddForemanDto, @GetUser('ownerId') ownerId: UserData['ownerId']) {
    return this.userService.addForeman(foremanDto, ownerId);
  }

  @UseGuards(JwtGuard, new RestrictRolesGuard('foreman'))
  @Get('foremen/:id')
  getForeman(@GetUser('ownerId') ownerId: UserData['ownerId'], @IdParam() foremanId: users['id']) {
    return this.userService.getForeman(foremanId, ownerId);
  }

  @UseGuards(JwtGuard, new RestrictRolesGuard('foreman'))
  @Get('foremen')
  getForemen(@GetUser('ownerId') ownerId: UserData['ownerId'], @PaginationParams() pagiantionParam: PaginateOptions) {
    return this.userService.getForemen(ownerId, pagiantionParam);
  }
}
