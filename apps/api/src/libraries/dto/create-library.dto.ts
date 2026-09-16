import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Trim, TrimOptional } from "../../auth/dto/transforms";

export class CreateLibraryQuestionDto {
  @Trim()
  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @TrimOptional()
  @IsString()
  hint?: string;
}

export class CreateLibraryDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateLibraryQuestionDto)
  questions?: CreateLibraryQuestionDto[];
}
