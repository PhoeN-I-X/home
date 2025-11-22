import { Injectable, UnauthorizedException, Res } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { Response } from "express";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(username: string, password: string, @Res({ passthrough: true }) res: Response) {
      if (!username || typeof username !== "string") {
        throw new UnauthorizedException("Введите имя пользователя");
      }

      if (username.length < 8) {
        throw new UnauthorizedException("Длина имени пользователя должна быть не менее 8 символов");
      }
      if (username.length > 32 ) {
        throw new UnauthorizedException("Длина имени пользователя должна быть не более 32 символов");
      }

      if (!/^[a-zA-Z0-9]+$/.test(username)) {
        throw new UnauthorizedException(
          "Юзернейм может содержать только буквы и цифры"
        );
      }

      if (!password || typeof password !== "string") {
        throw new UnauthorizedException("Введите пароль");
      }

      if (password.length < 8 ) {
        throw new UnauthorizedException("Длина пароля должна быть не менее 8 символов");
      }
      if (password.length > 32 ) {
        throw new UnauthorizedException("Длина пароля должна быть не более 32 символов");
      }
    const existing = await this.prisma.user.findUnique({ where: { username } });
    if (existing) throw new UnauthorizedException("Пользователь с таким именем уже существует");

    const hash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({ data: { username, password: hash } });

    const token = this.jwt.sign({ id: user.id, username: user.username });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });

    return { message: "Успешная регистрация" };
  }

  async login(username: string, password: string, @Res({ passthrough: true }) res: Response) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException("Неверный юзернейм или пароль");
    }

    const token = this.jwt.sign({ id: user.id, username: user.username });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });

    return { message: "Успешный вход" };
  }
}
