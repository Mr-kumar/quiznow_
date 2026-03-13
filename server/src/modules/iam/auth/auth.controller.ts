import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('dev-login')
  login(@Body() body: { email: string }) {
    // C-2 fix: Block dev-login in production
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Dev login is not available in production');
    }
    return this.authService.loginDev(body.email);
  }
}
