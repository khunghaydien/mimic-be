import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Topic } from "./topic.entity";

@Entity("questions")
export class Question {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ name: "topic_id", type: "uuid" })
  topicId!: string;

  @ManyToOne(() => Topic, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "topic_id" })
  topic!: Topic;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
