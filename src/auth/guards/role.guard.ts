import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { LoggedInRequest } from '../decorators/get-user.decorator';

@Injectable()
export class AllowRolesGuard implements CanActivate {
  private roles: string[];

  constructor(...roles: string[]) {
    this.roles = roles;
  }

  canActivate(context: ExecutionContext): boolean {
    const request: LoggedInRequest = context.switchToHttp().getRequest();
    const user = request.user;

    return user && this.roles.includes(user.roleName);
  }
}

@Injectable()
export class RestrictRolesGuard implements CanActivate {
  private roles: string[];

  constructor(...roles: string[]) {
    this.roles = roles;
  }

  canActivate(context: ExecutionContext): boolean {
    const request: LoggedInRequest = context.switchToHttp().getRequest();
    const user = request.user;

    return user && !this.roles.includes(user.roleName);
  }
}
