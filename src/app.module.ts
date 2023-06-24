import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { EmployeesModule } from './employees/employees.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import { EncryptModule } from './encrypt/encrypt.module';
import { FlagsModule } from './flags/flags.module';
import { S3Module } from './s3/s3.module';
import { ProductsModule } from './products/products.module';
import { HistoryModule } from './history/history.module';
import { StatsModule } from './stats/stats.module';
import { ShiftsModule } from './shifts/shifts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env' : undefined, // docker loads env by itself
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    EmployeesModule,
    PrismaModule,
    RedisModule.forRoot({
      config: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        retryStrategy: (times) => {
          // reconnect after
          return Math.min(times * 50, 2000);
        },
      },
      readyLog: true,
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      },
      defaults: {
        from: 'Berrymore',
      },
    }),
    EncryptModule,
    FlagsModule,
    S3Module,
    ProductsModule,
    HistoryModule,
    StatsModule,
    ShiftsModule,
  ],
})
export class AppModule { }
