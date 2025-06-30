import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { AuditProcessor } from './audit.processor';
import { AuditsService } from './audits.service';
import { AuditsController } from './audits.controller';
import { TimeoutMonitorService } from './timeout-monitor.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audit } from './entities/audit.entity';
import { Plugin } from '../plugins/entities/plugin.entity';
import { LlmModule } from '../llm/llm.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audit-queue',
    }),
    TypeOrmModule.forFeature([Audit, Plugin]),
    ScheduleModule.forRoot(),
    LlmModule,
    HttpModule,
    ConfigModule,
    UsersModule,
  ],
  controllers: [AuditsController],
  providers: [AuditProcessor, AuditsService, TimeoutMonitorService],
  exports: [AuditsService, TimeoutMonitorService],
})
export class AuditsModule {}
