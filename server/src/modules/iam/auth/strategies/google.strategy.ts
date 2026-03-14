import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { PrismaService } from '../../../../services/prisma/prisma.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private prisma: PrismaService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    const email: string | undefined = profile.emails?.[0]?.value;
    const name: string =
      profile.displayName ?? profile.name?.givenName ?? 'User';
    const image: string | null = profile.photos?.[0]?.value ?? null;

    if (!email) {
      return done(new Error('No email returned from Google'), undefined);
    }

    try {
      let user = await this.prisma.user.findUnique({ where: { email } });

      if (!user) {
        // First-time Google sign-in — create as STUDENT
        // Promote to ADMIN manually via Prisma Studio or SQL
        user = await this.prisma.user.create({
          data: { email, name, image, role: 'STUDENT' },
        });
      } else {
        // Existing user — sync avatar from Google on every login
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            name: user.name ?? name, // keep DB name if set, else use Google's
            image: image ?? user.image, // update avatar from Google
          },
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err as Error, undefined);
    }
  }
}
