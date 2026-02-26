
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/services/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async loginDev(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('User not found');

    // Sign the Token
    return {
      access_token: await this.jwt.signAsync(
        { sub: user.id, email: user.email, role: user.role },
        { secret: process.env.JWT_SECRET },
      ),
    };
  }
}
