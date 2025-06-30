import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsPublicToAudits1735469827000 implements MigrationInterface {
  name = 'AddIsPublicToAudits1735469827000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加 is_public 字段，默认值为 true
    await queryRunner.query(`
      ALTER TABLE "audits" 
      ADD COLUMN "is_public" boolean NOT NULL DEFAULT true
    `);

    // 更新现有记录：将不安全的报告设为私有
    await queryRunner.query(`
      UPDATE "audits" 
      SET "is_public" = false 
      WHERE "is_safe" = false 
         OR "status" = 'failure'
         OR ("raw_report"->>'risk_level' IN ('high', 'critical'))
         OR (
           "raw_report"->'findings' IS NOT NULL 
           AND jsonb_array_length("raw_report"->'findings') > 0
         )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除 is_public 字段
    await queryRunner.query(`
      ALTER TABLE "audits" 
      DROP COLUMN "is_public"
    `);
  }
}
