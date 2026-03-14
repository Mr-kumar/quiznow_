import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../services/prisma/prisma.service';

interface JwtUserPayload {
  id: string;
  email: string;
  name: string | null;
  role: string;
  image?: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // Dev-only — blocked in production by the controller
  async loginDev(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('User not found');
    return { access_token: await this.signToken(user) };
  }

  // Called after GoogleStrategy.validate() attaches req.user
  async loginWithGoogle(user: JwtUserPayload) {
    return { access_token: await this.signToken(user) };
  }

  // Single JWT factory — both paths produce the exact same payload shape
  private async signToken(user: JwtUserPayload): Promise<string> {
    return this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name ?? user.email, // always a string
        image: user.image ?? null, // Google avatar URL or null
      },
      { secret: process.env.JWT_SECRET },
    );
  }
}
