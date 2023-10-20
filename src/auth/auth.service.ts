import { MailerService } from '@nestjs-modules/mailer';
import {
  HttpException,
  HttpStatus,
  Injectable,
  UseGuards,
} from '@nestjs/common';
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
import { TempStorage } from 'src/tempstorage/tempstorage.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly tempStorage: TempStorage,
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

    this.tempStorage.set(token, JSON.stringify(userData), 60 * 20 * 1000);

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
    const user = this.tempStorage.get(token);

    if (!user) {
      throw new HttpException(
        'Ссылка для подтверждения недействительна или устарела',
        HttpStatus.BAD_REQUEST,
      );
    }

    const userData = JSON.parse(user) as Omit<users, 'id'>;

    const createdUser = await this.prisma.users.create({
      data: userData,
    });

    this.tempStorage.del(token);

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
