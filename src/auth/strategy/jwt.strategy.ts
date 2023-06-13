import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UserData } from '../interfaces/UserData';
import { users } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: { id: number }) {
    const user = await this.prisma.users.findUnique({
      where: {
        id: payload.id,
      },
      include: {
        roles: true,
      },
    });

    if (!user) {
      return null;
    }

    const userData: UserData = {
      id: user.id,
      roleName: user.roles.roleName,
      ownerId: user.roles.roleName === 'foreman' ? user.ownerId as users['id'] : user.id,
    }

    return userData;
  }
}
