import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGradeField1790134036744 implements MigrationInterface {
    name = 'AddGradeField1790134036744'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "answers" ADD "grade" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "answers" DROP COLUMN "grade"`);
    }

}
