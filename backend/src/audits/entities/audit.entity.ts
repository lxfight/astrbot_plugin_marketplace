import { Plugin } from '../../plugins/entities/plugin.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum AuditStatus {
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILURE = 'failure',
}

@Entity('audits')
export class Audit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plugin_id' })
  pluginId: string;

  @ManyToOne(() => Plugin)
  @JoinColumn({ name: 'plugin_id' })
  plugin: Plugin;

  @Column()
  version: string;

  @Column({
    type: 'enum',
    enum: AuditStatus,
  })
  status: AuditStatus;

  @Column({ name: 'is_safe', nullable: true })
  isSafe?: boolean;

  @Column({ name: 'report_summary', type: 'text', nullable: true })
  reportSummary?: string;

  @Column({ name: 'raw_report', type: 'jsonb', nullable: true })
  rawReport?: any;

  @Column({ name: 'is_public', default: true })
  isPublic: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}