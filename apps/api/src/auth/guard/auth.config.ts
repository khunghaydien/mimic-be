import * as dotenv from "dotenv";
import type { StringValue } from "ms";

dotenv.config();

export type JwtPayload = {
  sub: string;
  email: string;
  type: "access" | "refresh";
};

export function getAccessTokenExpiresIn(): StringValue {
  return (process.env.JWT_EXPIRES_IN ?? "15m") as StringValue;
}

export function getRefreshTokenExpiresIn(): StringValue {
  return (process.env.JWT_REFRESH_EXPIRES_IN ?? "7d") as StringValue;
}

export function getAccessTokenSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

export function getRefreshTokenSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not set");
  }
  return secret;
}
