import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Trim, TrimOptional } from "../../auth/dto/transforms";
import { QuestionDto, SavedQuestionDto } from "./question.dto";

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
  @Type(() => QuestionDto)
  questions?: QuestionDto[];
}

export class UpdateLibraryDto extends UpdateLibraryTitleDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => SavedQuestionDto)
  questions!: SavedQuestionDto[];
}

export class ListLibraryQueryDto {
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
