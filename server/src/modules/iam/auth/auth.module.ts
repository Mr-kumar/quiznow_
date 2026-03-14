import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { PrismaModule } from '../../../services/prisma/prisma.module';

@Module({
  imports: [
    PassportModule,
    // C-3 + M-8 fix: Use registerAsync to defer env reading and throw if JWT_SECRET is missing
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new Error(
            'JWT_SECRET environment variable is not set. Server cannot start without it.',
          );
        }
        return {
          secret,
          signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any,
        };
      },
    }),
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
