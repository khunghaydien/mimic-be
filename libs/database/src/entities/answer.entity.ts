import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Practice } from "./practice.entity";
import { Question } from "./question.entity";

@Entity("answers")
@Index(["practiceId"])
export class Answer {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "practice_id", type: "uuid" })
  practiceId!: string;

  @ManyToOne(() => Practice, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "practice_id" })
  practice!: Practice;

  @Column({ name: "question_id", type: "uuid" })
  questionId!: string;

  @ManyToOne(() => Question, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "question_id" })
  question!: Question;

  @Column({ type: "text" })
  caption!: string;

  @Column({ type: "jsonb", nullable: true })
  grade!: Record<string, unknown> | null;

  @Column({ name: "audio_url", type: "varchar", length: 2048 })
  audioUrl!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
