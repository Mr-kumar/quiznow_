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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CacheService } from '../../../cache/cache.service';
import * as crypto from 'crypto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private cacheService: CacheService,
  ) {}

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
    const frontendUrl =
      process.env.FRONTEND_URL?.split(',')[0] ?? 'http://localhost:3000';

    try {
      if (!req.user) {
        // User denied permissions or Passport encountered an error
        this.logger.warn(
          'Google callback: req.user is empty — user denied or token error',
        );
        return res.redirect(`${frontendUrl}/login?error=google_denied`);
      }

      const { access_token } = await this.authService.loginWithGoogle(req.user);

      // S-1 fix: Use a short-lived one-time code pattern for security.
      // Do NOT expose the full JWT in the redirect URL.
      const oauthCode = crypto.randomBytes(32).toString('hex');

      // Store the token in cache for 30 seconds
      await this.cacheService.set(`oauth:${oauthCode}`, access_token, 30);

      this.logger.log(`Google login: ${req.user.email} role=${req.user.role}`);

      // Redirect browser to Next.js with a one-time code
      return res.redirect(`${frontendUrl}/auth/callback?code=${oauthCode}`);
    } catch (err) {
      this.logger.error('Google callback threw an error', err);
      return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }

  @Post('exchange')
  @ApiOperation({ summary: 'Exchange one-time code for access token' })
  async exchangeCode(@Body() body: { code: string }) {
    if (!body.code) {
      throw new BadRequestException('Authorization code is required');
    }

    const token = await this.cacheService.get<string>(`oauth:${body.code}`);
    if (!token) {
      throw new BadRequestException('Invalid or expired authorization code');
    }

    // Delete the code immediately after use (one-time only)
    await this.cacheService.del(`oauth:${body.code}`);

    // Decode exp from the token so frontend can set cookie maxAge correctly
    const rawPayload = token.split('.')[1];
    const payload = JSON.parse(
      Buffer.from(rawPayload, 'base64').toString('utf8'),
    );
    const expiresIn = payload.exp - Math.floor(Date.now() / 1000);

    return {
      access_token: token,
      expiresIn,
    };
  }
}
