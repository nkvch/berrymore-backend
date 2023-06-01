import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import * as bcrypt from 'bcryptjs';
import { prepareEmail } from './mails/prepareEmail';
import { users } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
    private readonly mailService: MailerService,
  ) {}

  signin() {
    return {
      message: 'This is a mock message',
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

    await this.redis.set(token, JSON.stringify(userData), 'EX', 60 * 20);

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
    const user = await this.redis.get(token);

    if (!user) {
      throw new Error('Ссылка для подтверждения недействительна или устарела');
    }

    const userData = JSON.parse(user) as Omit<users, 'id'>;

    const createdUser = await this.prisma.users.create({
      data: userData,
    });

    await this.redis.del(token);

    return createdUser;
  }
}
