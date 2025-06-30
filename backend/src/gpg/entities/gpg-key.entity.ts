import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum GPGKeyStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

@Entity('gpg_keys')
@Index(['keyId'], { unique: true })
@Index(['fingerprint'], { unique: true })
export class GPGKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'key_id', length: 16 })
  keyId: string; // 8字节密钥ID

  @Column({ length: 40 })
  fingerprint: string; // 20字节指纹

  @Column({ name: 'public_key', type: 'text' })
  publicKey: string; // ASCII armored 公钥

  @Column({ name: 'key_type', length: 20, default: 'RSA' })
  keyType: string; // RSA, DSA, ECDSA, EdDSA

  @Column({ name: 'key_size', type: 'int', nullable: true })
  keySize: number; // 密钥长度

  @Column({ name: 'user_ids', type: 'json' })
  userIds: string[]; // 用户ID列表

  @Column({ name: 'creation_time', type: 'timestamp' })
  creationTime: Date;

  @Column({ name: 'expiration_time', type: 'timestamp', nullable: true })
  expirationTime: Date | null;

  @Column({
    type: 'enum',
    enum: GPGKeyStatus,
    default: GPGKeyStatus.PENDING,
  })
  status: GPGKeyStatus;

  @Column({ name: 'verification_token', type: 'varchar', length: 64, nullable: true })
  verificationToken: string | null; // 用于验证密钥所有权

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date | null;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
