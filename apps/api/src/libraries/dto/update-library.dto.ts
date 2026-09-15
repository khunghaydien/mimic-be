import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Trim } from "../../auth/dto/transforms";
import { CreateLibraryQuestionDto } from "./create-library.dto";

export class UpdateLibraryDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateLibraryQuestionDto)
  questions!: CreateLibraryQuestionDto[];
}
