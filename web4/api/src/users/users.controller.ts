import { Body, Controller, Get, Query, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get("")
  getProfile(@Req() req, @Query('search') search?: string,) {
    console.log(req.user)
    if (!req.user) {
      throw new UnauthorizedException("Пользователь не аутентифицирован");
    }
    return this.users.getProfile(search);
  }
}
