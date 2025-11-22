import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../prisma/prisma.service"; 
import { ConfigService } from '@nestjs/config';
import { Request } from "express";
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService,config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req?.cookies?.token; 
        },
      ]),
      secretOrKey: config.get<string>('jwt.secret'),
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, username: true },
    });

    if (!user) {
      throw new UnauthorizedException("Пользователь не найден");
    }

    return user;
  }
}
