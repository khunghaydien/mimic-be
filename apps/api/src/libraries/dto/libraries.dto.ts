import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Trim, TrimOptional } from "../../auth/dto/transforms";

export class LibraryQuestionDto {
  @Trim()
  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @TrimOptional()
  @IsString()
  hint?: string;
}

export class SavedLibraryQuestionDto extends LibraryQuestionDto {
  @IsOptional()
  @IsUUID()
  id?: string;
}

export class UpdateLibraryTitleDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;
}

export class CreateLibraryDto extends UpdateLibraryTitleDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => LibraryQuestionDto)
  questions?: LibraryQuestionDto[];
}

export class UpdateLibraryDto extends UpdateLibraryTitleDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => SavedLibraryQuestionDto)
  questions!: SavedLibraryQuestionDto[];
}

export class GenerateQuestionsDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;
}

export class ListLibrariesQueryDto {
  @IsOptional()
  @TrimOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === "true" || value === "1")
  @IsBoolean()
  mine?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
