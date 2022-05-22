import {MigrationInterface, QueryRunner} from "typeorm";

export class usersTable1649593704735 implements MigrationInterface {
    name = 'usersTable1649593704735'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_sex_enum" AS ENUM('MALE', 'FEMALE', 'OTHERS')`);
        await queryRunner.query(`CREATE TYPE "public"."users_user_role_enum" AS ENUM('ADMIN', 'USER')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "phone" character varying NOT NULL, "imgUrl" character varying, "imagekit_fileId" character varying, "birthdate" TIMESTAMP NOT NULL, "headline" character varying, "bio" character varying, "country" character varying, "state" character varying, "website" character varying, "sex" "public"."users_sex_enum", "username" character varying NOT NULL, "user_role" "public"."users_user_role_enum" NOT NULL DEFAULT 'USER', "isLoggedIn" boolean DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_user_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_sex_enum"`);
    }

}
