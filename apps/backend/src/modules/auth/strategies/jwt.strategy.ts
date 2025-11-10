// src/modules/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../../../prisma/prisma.service';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is not set');
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.auth_token,
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret, // Now guaranteed to be string
    } as StrategyOptionsWithRequest);
  }

async validate(payload: { sub: string; email: string; role: string }) {
  // Fetch full user (without passwordHash)
  const user = await this.prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, role: true, avatarUrl: true },
  });
  if (!user) throw new UnauthorizedException();
  return user;
}
}