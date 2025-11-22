import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { Response } from 'express';

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Res({ passthrough: true }) res: Response, @Body() body: { username: string; password: string }) {
    return this.auth.register(body.username, body.password, res);
  }

  @Post("login")
  login(@Res({ passthrough: true }) res: Response, @Body() body: { username: string; password: string }) {
    return this.auth.login(body.username, body.password, res);
  }
  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@Req() req) {
    if (!req.user) {
      throw new UnauthorizedException("Пользователь не аутентифицирован");
    }
    return req.user;
  }
  @Get('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.cookie('token', '', { expires: new Date() });
    return res.json({ message: 'Успешный выход из системы' });
  }
}
