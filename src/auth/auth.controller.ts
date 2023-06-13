import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GetUser } from './decorators/get-user.decorator';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtGuard } from './guards';
import { UserData } from './interfaces/UserData';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('signup')
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('signin')
  signin(@Body() signinDto: SigninDto) {
    return this.authService.signin(signinDto);
  }

  @Post('verify')
  verify(@Body('token') token: string) {
    return this.authService.verify(token);
  }

  @UseGuards(JwtGuard)
  @Get('refresh')
  refresh(@GetUser() user: UserData) {
    return this.authService.refreshToken(user);
  }
}
