import { IsUUID } from "class-validator";

export class CreatePracticeDto {
  @IsUUID()
  libraryId!: string;
}
