import { Body, Controller, Post, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "./decorators/current-user.decorator";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import type { JwtPayload } from "./interfaces/jwt-payload.interface";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { LogoutDto } from "./dto/log-out.dto";

@Controller("auth")
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    @Post("login")
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post("refresh")
    refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refresh(dto);
    }

    @Post("logout")
    logout(@Body() dto: LogoutDto) {
        return this.authService.logout(dto);
    }

    @Get("me")
    @UseGuards(JwtAuthGuard)
    me(@CurrentUser() user: JwtPayload) {
       return this.authService.me(user.sub);
   }
}