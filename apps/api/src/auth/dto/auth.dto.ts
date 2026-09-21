import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { NormalizeEmail, Trim, TrimOptional } from "./transforms";

class AuthEmailDto {
  @NormalizeEmail()
  @IsEmail()
  @MaxLength(255)
  email!: string;
}

export class LoginDto extends AuthEmailDto {
  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password!: string;
}

export class RegisterDto extends AuthEmailDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsOptional()
  @TrimOptional()
  @IsString()
  @MaxLength(2048)
  avatarUrl?: string;
}

export class RefreshTokenDto {
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}
