import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTable1790058445270 implements MigrationInterface {
    name = 'CreateTable1790058445270'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "libraries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(100) NOT NULL, "creator_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_505fedfcad00a09b3734b4223de" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_18ea6f6bbb8a30c88602cbfb47" ON "libraries" ("creator_id") `);
        await queryRunner.query(`CREATE TABLE "questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "hint" text, "audio_url" character varying(2048), "library_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2c7e0622c90c2e204673916740" ON "questions" ("library_id") `);
        await queryRunner.query(`CREATE TABLE "practices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "library_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0934829c5859a843625e6ff1c34" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8dcfa01d11db73644ce06f1959" ON "practices" ("library_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_68e02950de964baaecaad06d20" ON "practices" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "answers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "practice_id" uuid NOT NULL, "question_id" uuid NOT NULL, "caption" text NOT NULL, "audio_url" character varying(2048) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9c32cec6c71e06da0254f2226c6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f998475e8256dfa3c065fd52ec" ON "answers" ("practice_id") `);
        await queryRunner.query(`ALTER TABLE "libraries" ADD CONSTRAINT "FK_18ea6f6bbb8a30c88602cbfb47b" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_2c7e0622c90c2e2046739167401" FOREIGN KEY ("library_id") REFERENCES "libraries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "practices" ADD CONSTRAINT "FK_68e02950de964baaecaad06d200" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "practices" ADD CONSTRAINT "FK_8dcfa01d11db73644ce06f1959c" FOREIGN KEY ("library_id") REFERENCES "libraries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "answers" ADD CONSTRAINT "FK_f998475e8256dfa3c065fd52ec0" FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "answers" ADD CONSTRAINT "FK_677120094cf6d3f12df0b9dc5d3" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "answers" DROP CONSTRAINT "FK_677120094cf6d3f12df0b9dc5d3"`);
        await queryRunner.query(`ALTER TABLE "answers" DROP CONSTRAINT "FK_f998475e8256dfa3c065fd52ec0"`);
        await queryRunner.query(`ALTER TABLE "practices" DROP CONSTRAINT "FK_8dcfa01d11db73644ce06f1959c"`);
        await queryRunner.query(`ALTER TABLE "practices" DROP CONSTRAINT "FK_68e02950de964baaecaad06d200"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_2c7e0622c90c2e2046739167401"`);
        await queryRunner.query(`ALTER TABLE "libraries" DROP CONSTRAINT "FK_18ea6f6bbb8a30c88602cbfb47b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f998475e8256dfa3c065fd52ec"`);
        await queryRunner.query(`DROP TABLE "answers"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_68e02950de964baaecaad06d20"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8dcfa01d11db73644ce06f1959"`);
        await queryRunner.query(`DROP TABLE "practices"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2c7e0622c90c2e204673916740"`);
        await queryRunner.query(`DROP TABLE "questions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_18ea6f6bbb8a30c88602cbfb47"`);
        await queryRunner.query(`DROP TABLE "libraries"`);
    }

}
