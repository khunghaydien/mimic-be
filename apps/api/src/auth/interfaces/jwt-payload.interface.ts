export type JwtTokenType = "access" | "refresh";

export interface JwtPayload {
  sub: string;
  email: string;
  type: JwtTokenType;
}
