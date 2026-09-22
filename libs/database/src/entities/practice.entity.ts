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
import { User } from "./user.entity";

@Entity("practices")
@Index(["userId"])
@Index(["libraryId"])
export class Practice {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id" })
  user!: User;

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
