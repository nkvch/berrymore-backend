import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { UserData } from '../interfaces/UserData';

export interface LoggedInRequest extends Express.Request {
  user: UserData
}

export const GetUser = createParamDecorator(
  (
    data: undefined | keyof UserData,
    ctx: ExecutionContext,
  ) => {
    const request: LoggedInRequest = ctx
      .switchToHttp()
      .getRequest();


    if (data) {
      return request.user[data];
    }

    return request.user;
  },
);
