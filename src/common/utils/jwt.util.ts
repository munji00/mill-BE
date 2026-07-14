import { JwtService } from "@nestjs/jwt";

import type { JwtPayload } from "../../modules/auth/interfaces/jwt-payload.interface";

export class JwtUtil {
  static async generateAccessToken(
    jwtService: JwtService,
    payload: JwtPayload,
  ) {
    return jwtService.signAsync(payload);
  }
}