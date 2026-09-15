import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";
import { NormalizeEmail } from "./transforms";

export class LoginDto {
  @NormalizeEmail()
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password!: string;
}
