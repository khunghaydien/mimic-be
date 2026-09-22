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
import { Library } from "./library.entity";

@Entity("questions")
@Index(["libraryId"])
export class Question {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "text", nullable: true })
  hint!: string | null;

  @Column({ name: "audio_url", type: "varchar", length: 2048, nullable: true })
  audioUrl!: string | null;

  @Column({ name: "library_id", type: "uuid" })
  libraryId!: string;

  @ManyToOne(() => Library, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "library_id" })
  library!: Library;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
