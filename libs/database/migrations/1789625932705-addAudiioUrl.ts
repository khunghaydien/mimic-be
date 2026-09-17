import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAudiioUrl1789625932705 implements MigrationInterface {
    name = 'AddAudiioUrl1789625932705'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" ADD "audio_url" character varying(2048)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "audio_url"`);
    }

}
