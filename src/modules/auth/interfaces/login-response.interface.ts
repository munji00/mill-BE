import type { User } from "@prisma/client";

export interface LoginResponse {
  accessToken: string;
  user: Omit<User, "password">;
}