import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { User } from "@app/database";
import { LoginDto, RefreshTokenDto, RegisterDto } from "./dto/auth.dto";
import { CurrentUser, Public } from "./guard/auth.guard";
import { AuthService } from "./service/auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post("refresh")
  @HttpCode(200)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get("me")
  me(@CurrentUser() user: User) {
    return user;
  }
}
