import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeQuestionsTable1789539678190 implements MigrationInterface {
    name = 'ChangeQuestionsTable1789539678190'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" ADD "hint" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "hint"`);
    }

}
