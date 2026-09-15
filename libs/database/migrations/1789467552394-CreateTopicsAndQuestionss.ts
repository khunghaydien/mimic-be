import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTopicsAndQuestionss1789467552394 implements MigrationInterface {
    name = 'CreateTopicsAndQuestionss1789467552394'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "topics" ADD "creator_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "topic_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "topics" ADD CONSTRAINT "FK_4f2581d11c46de072a66b2f1a97" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_e29a77ea64df3fb567c4c200a9e" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_e29a77ea64df3fb567c4c200a9e"`);
        await queryRunner.query(`ALTER TABLE "topics" DROP CONSTRAINT "FK_4f2581d11c46de072a66b2f1a97"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "topic_id"`);
        await queryRunner.query(`ALTER TABLE "topics" DROP COLUMN "creator_id"`);
    }

}
