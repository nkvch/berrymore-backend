// import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { MailerService } from '@nestjs-modules/mailer';
import {
  HttpException,
  HttpStatus,
  Injectable,
  UseGuards,
} from '@nestjs/common';
// import { Redis } from 'ioredis';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import * as bcrypt from 'bcryptjs';
import { prepareEmail } from './mails/prepareEmail';
import { users } from '@prisma/client';
import * as crypto from 'crypto';
import { SigninDto } from './dto/signin.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EncryptService } from 'src/encrypt/encrypt.service';
import { UserData } from './interfaces/UserData';
import { JwtTokenUserData } from './interfaces/JwtTokenUserData';

@Injectable()
class LikeRedis {
  storage = new Map<string, string>();

  set(key: string, value: string, time?: number) {
    this.storage.set(key, value);

    if (time) {
      setTimeout(() => {
        this.storage.delete(key);
      }, time);
    }
  }

  get(key: string) {
    return this.storage.get(key);
  }

  del(key: string) {
    this.storage.delete(key);
  }
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    // @InjectRedis() private readonly redis: Redis,
    private readonly redis: LikeRedis,
    private readonly mailService: MailerService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly encryptService: EncryptService,
  ) {}

  async signin(signinDto: SigninDto) {
    const user = await this.prisma.users.findUnique({
      where: {
        username: signinDto.username,
      },
      include: {
        roles: true,
      },
    });

    if (!user) {
      throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
    }

    const isMatch = await bcrypt.compare(signinDto.password, user.password);

    if (!isMatch) {
      throw new HttpException('Неверный пароль', HttpStatus.BAD_REQUEST);
    }

    const token = await this.signToken({ id: user.id });

    this.encryptService.generateEncryptKey(user, signinDto.password);

    const { username, email, firstName, lastName, roles } = user;

    return {
      token,
      roleName: roles.roleName,
      username,
      email,
      firstName,
      lastName,
    };
  }

  async signup(signupDto: SignupDto) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(signupDto.password, salt);

    const ownerRole = await this.prisma.roles.findFirst({
      where: {
        roleName: 'owner',
      },
    });

    const userData = { ...signupDto, password: hash, roleId: ownerRole?.id };

    const token = crypto.randomBytes(4).toString('hex');

    this.redis.set(token, JSON.stringify(userData), 60 * 20);

    const email = prepareEmail(token);

    await this.mailService.sendMail({
      to: signupDto.email,
      subject: 'Подтвердите адрес email',
      html: email,
    });

    return {
      message: 'Письмо с подтверждением отправлено на вашу почту',
    };
  }

  async verify(token: string) {
    const user = this.redis.get(token);

    if (!user) {
      throw new HttpException(
        'Ссылка для подтверждения недействительна или устарела',
        HttpStatus.BAD_REQUEST,
      );
    }

    const userData = JSON.parse(user) as Omit<users, 'id'>;

    console.log(userData);

    const createdUser = await this.prisma.users.create({
      data: userData,
    });

    this.redis.del(token);

    return createdUser;
  }

  signToken(payload: JwtTokenUserData) {
    return this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: '1d',
    });
  }

  async refreshToken(user: UserData) {
    const token = await this.signToken({ id: user.id });

    return { token };
  }

  async getMe(user: UserData) {
    const userData = await this.prisma.users.findUnique({
      where: {
        id: user.id,
      },
      include: {
        roles: true,
      },
    });

    if (!userData) {
      throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
    }

    const {
      username,
      email,
      firstName,
      lastName,
      roles: { roleName },
    } = userData;

    return {
      username,
      email,
      firstName,
      lastName,
      roleName,
    };
  }
}
