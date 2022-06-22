import {MigrationInterface, QueryRunner} from "typeorm";

export class addedSocialId1655869368036 implements MigrationInterface {
    name = 'addedSocialId1655869368036'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "social_id" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "social_id"`);
    }

}
