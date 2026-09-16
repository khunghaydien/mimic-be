import { IsOptional, IsString, MinLength } from "class-validator";
import { Trim, TrimOptional } from "../../auth/dto/transforms";

export class UpdateQuestionDto {
  @Trim()
  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @TrimOptional()
  @IsString()
  hint?: string;
}
