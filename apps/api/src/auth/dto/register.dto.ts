import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { NormalizeEmail, Trim, TrimOptional } from "./transforms";

export class RegisterDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @NormalizeEmail()
  @IsEmail()
  @MaxLength(255)
  email!: string;

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
