import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('dev-login') // POST http://localhost:4000/auth/dev-login
  login(@Body() body: { email: string }) {
    return this.authService.loginDev(body.email);
  }
}
