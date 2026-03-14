import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Request,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  // ── Dev login (email only) ────────────────────────────────────────────────
  @Post('dev-login')
  @ApiOperation({ summary: 'Dev-only login — blocked in production' })
  login(@Body() body: { email: string }) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Dev login is not available in production');
    }
    return this.authService.loginDev(body.email);
  }

  // ── Google OAuth: Step 1 — trigger redirect to Google ────────────────────
  // No JwtAuthGuard here — must be public.
  // Passport reads GOOGLE_CLIENT_ID/SECRET and redirects the browser.
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth redirect' })
  googleLogin() {
    // Body never executes — Passport intercepts and redirects.
  }

  // ── Google OAuth: Step 2 — Google redirects back here ────────────────────
  // GoogleAuthGuard calls GoogleStrategy.validate() which upserts the user
  // in Prisma and attaches the result to req.user.
  //
  // Uses @Res() + res.redirect() instead of @Redirect() to avoid conflicts
  // with Passport's response handling.
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback — internal' })
  async googleCallback(@Request() req: any, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0] ?? 'http://localhost:3000';

    try {
      if (!req.user) {
        // User denied permissions or Passport encountered an error
        this.logger.warn('Google callback: req.user is empty — user denied or token error');
        return res.redirect(`${frontendUrl}/login?error=google_denied`);
      }

      const { access_token } = await this.authService.loginWithGoogle(req.user);

      // Decode exp from the token so frontend can set cookie maxAge correctly
      const rawPayload = access_token.split('.')[1];
      const payload = JSON.parse(
        Buffer.from(rawPayload, 'base64').toString('utf8'),
      );
      const expiresIn = payload.exp - Math.floor(Date.now() / 1000);

      this.logger.log(`Google login: ${req.user.email} role=${req.user.role}`);

      // Redirect browser to Next.js — the callback page stores the token
      return res.redirect(
        `${frontendUrl}/auth/callback?token=${access_token}&expiresIn=${expiresIn}`,
      );
    } catch (err) {
      this.logger.error('Google callback threw an error', err);
      return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }
}
