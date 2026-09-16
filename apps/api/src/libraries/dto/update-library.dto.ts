import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Trim, TrimOptional } from "../../auth/dto/transforms";

export class UpdateLibraryQuestionDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @Trim()
  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @TrimOptional()
  @IsString()
  hint?: string;
}

export class UpdateLibraryDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => UpdateLibraryQuestionDto)
  questions!: UpdateLibraryQuestionDto[];
}
