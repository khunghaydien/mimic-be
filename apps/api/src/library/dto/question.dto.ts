import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";
import { Trim, TrimOptional } from "../../auth/dto/transforms";

export class QuestionDto {
  @Trim()
  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @TrimOptional()
  @IsString()
  hint?: string;
}

export class SavedQuestionDto extends QuestionDto {
  @IsOptional()
  @IsUUID()
  id?: string;
}

export class GenerateQuestionsDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;
}
