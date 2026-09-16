import { IsString, MaxLength, MinLength } from "class-validator";
import { Trim } from "../../auth/dto/transforms";

export class GenerateQuestionsDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;
}
