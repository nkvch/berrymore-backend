import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy';
import { TempStorageModule } from 'src/tempstorage/tempstorage.module';
import { TempStorage } from 'src/tempstorage/tempstorage.service';

@Module({
  imports: [JwtModule.register({}), TempStorageModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TempStorage],
})
export class AuthModule {}
