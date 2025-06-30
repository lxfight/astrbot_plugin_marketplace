import { User } from '../../users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum PluginStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DELISTED = 'delisted',
  FAILED = 'failed',
}

@Entity('plugins')
export class Plugin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'publisher_id' })
  publisherId: string;

  @ManyToOne(() => User, (user) => user.plugins)
  @JoinColumn({ name: 'publisher_id' })
  publisher: User;

  @Column()
  name: string;

  @Column()
  author: string;

  @Column({ name: 'repo_url', unique: true })
  repoUrl: string;

  @Column('text')
  description: string;

  @Column({ name: 'latest_version', nullable: true })
  latestVersion?: string;

  @Column({
    type: 'enum',
    enum: PluginStatus,
    default: PluginStatus.PENDING,
  })
  status: PluginStatus;

  @Column({ name: 'webhook_id', type: 'integer', nullable: true })
  webhookId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}