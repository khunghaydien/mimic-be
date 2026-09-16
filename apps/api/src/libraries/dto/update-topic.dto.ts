import { IsString, MaxLength, MinLength } from "class-validator";
import { Trim } from "../../auth/dto/transforms";

export class UpdateTopicDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;
}
