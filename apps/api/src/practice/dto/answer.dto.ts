import { IsUUID } from "class-validator";

export class CreateAnswerDto {
  @IsUUID()
  practiceId!: string;

  @IsUUID()
  questionId!: string;
}
