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
import { Plugin } from '../../plugins/entities/plugin.entity';
import { GPGKey } from './gpg-key.entity';

export enum SignatureStatus {
  VALID = 'valid',
  INVALID = 'invalid',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  UNKNOWN_KEY = 'unknown_key',
}

export enum SignatureType {
  COMMIT = 'commit',        // Git commit 签名
  TAG = 'tag',             // Git tag 签名
  RELEASE = 'release',     // GitHub release 签名
  METADATA = 'metadata',   // metadata.yaml 文件签名
}

@Entity('plugin_signatures')
@Index(['pluginId', 'version', 'signatureType'], { unique: true })
export class PluginSignature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plugin_id' })
  pluginId: string;

  @ManyToOne(() => Plugin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plugin_id' })
  plugin: Plugin;

  @Column({ name: 'gpg_key_id', nullable: true })
  gpgKeyId: string;

  @ManyToOne(() => GPGKey, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'gpg_key_id' })
  gpgKey: GPGKey;

  @Column({ length: 50 })
  version: string; // 插件版本

  @Column({
    name: 'signature_type',
    type: 'enum',
    enum: SignatureType,
  })
  signatureType: SignatureType;

  @Column({ name: 'signature_data', type: 'text' })
  signatureData: string; // 签名数据

  @Column({ name: 'signed_content_hash', length: 64 })
  signedContentHash: string; // 被签名内容的SHA256哈希

  @Column({ name: 'signer_key_id', length: 16 })
  signerKeyId: string; // 签名者密钥ID

  @Column({ name: 'signer_fingerprint', length: 40 })
  signerFingerprint: string; // 签名者指纹

  @Column({
    type: 'enum',
    enum: SignatureStatus,
    default: SignatureStatus.UNKNOWN_KEY,
  })
  status: SignatureStatus;

  @Column({ name: 'verification_details', type: 'json', nullable: true })
  verificationDetails: {
    algorithm?: string;
    hashAlgorithm?: string;
    creationTime?: string;
    expirationTime?: string;
    trustLevel?: string;
    errorMessage?: string;
  };

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ name: 'git_commit_hash', length: 40, nullable: true })
  gitCommitHash: string; // 对应的Git提交哈希

  @Column({ name: 'git_tag_name', length: 100, nullable: true })
  gitTagName: string; // 对应的Git标签名

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
