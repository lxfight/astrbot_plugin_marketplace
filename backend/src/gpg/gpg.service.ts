import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GPGKey, GPGKeyStatus } from './entities/gpg-key.entity';
import { PluginSignature, SignatureStatus, SignatureType } from './entities/plugin-signature.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import * as openpgp from 'openpgp';

@Injectable()
export class GPGService {
  constructor(
    @InjectRepository(GPGKey)
    private gpgKeyRepository: Repository<GPGKey>,
    @InjectRepository(PluginSignature)
    private signatureRepository: Repository<PluginSignature>,
    private httpService: HttpService,
  ) {}

  /**
   * 解析并导入GPG公钥 (简化版本)
   */
  async importPublicKey(userId: string, publicKeyArmored: string): Promise<GPGKey> {
    try {
      // 基本验证GPG公钥格式
      if (!publicKeyArmored.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----') ||
          !publicKeyArmored.includes('-----END PGP PUBLIC KEY BLOCK-----')) {
        throw new BadRequestException('Invalid GPG public key format');
      }

      // 简化的密钥信息提取 (实际项目中应使用OpenPGP库)
      const keyInfo = this.extractBasicKeyInfo(publicKeyArmored);

      // 检查是否已存在
      const existingKey = await this.gpgKeyRepository.findOne({
        where: { fingerprint: keyInfo.fingerprint }
      });

      if (existingKey) {
        throw new BadRequestException('GPG key already exists');
      }

      // 生成验证令牌
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // 保存密钥
      const gpgKey = this.gpgKeyRepository.create({
        userId,
        keyId: keyInfo.keyId,
        fingerprint: keyInfo.fingerprint,
        publicKey: publicKeyArmored,
        keyType: keyInfo.keyType,
        keySize: keyInfo.keySize,
        userIds: keyInfo.userIds,
        creationTime: keyInfo.creationTime,
        expirationTime: keyInfo.expirationTime,
        status: GPGKeyStatus.PENDING,
        verificationToken,
      });

      return await this.gpgKeyRepository.save(gpgKey);
    } catch (error) {
      throw new BadRequestException(`Invalid GPG key: ${error.message}`);
    }
  }

  /**
   * 验证GPG密钥所有权 (简化版本)
   */
  async verifyKeyOwnership(keyId: string, signedMessage: string): Promise<boolean> {
    const gpgKey = await this.gpgKeyRepository.findOne({
      where: { keyId, status: GPGKeyStatus.PENDING }
    });

    if (!gpgKey) {
      throw new NotFoundException('GPG key not found or already verified');
    }

    try {
      // 简化验证：检查签名消息是否包含验证令牌
      // 实际项目中应使用OpenPGP库进行真正的签名验证
      if (signedMessage.includes(gpgKey.verificationToken || '')) {
        // 更新密钥状态
        gpgKey.status = GPGKeyStatus.VERIFIED;
        gpgKey.verifiedAt = new Date();
        gpgKey.verificationToken = null;
        await this.gpgKeyRepository.save(gpgKey);
        return true;
      }

      return false;
    } catch (error) {
      throw new BadRequestException(`Verification failed: ${error.message}`);
    }
  }

  /**
   * 验证Git提交签名
   */
  async verifyCommitSignature(
    repoUrl: string,
    commitHash: string,
    pluginId: string,
    version: string
  ): Promise<PluginSignature> {
    try {
      // 从GitHub API获取提交信息
      const apiUrl = this.getGitHubApiUrl(repoUrl);
      const commitUrl = `${apiUrl}/commits/${commitHash}`;
      
      const response = await firstValueFrom(
        this.httpService.get(commitUrl, {
          headers: { Accept: 'application/vnd.github.v3+json' }
        })
      );
      
      const commit = response.data;
      
      // 检查是否有GPG签名
      if (!commit.commit.verification) {
        return this.createUnverifiedSignature(pluginId, version, SignatureType.COMMIT, commitHash);
      }
      
      const verification = commit.commit.verification;
      const signature = this.signatureRepository.create({
        pluginId,
        version,
        signatureType: SignatureType.COMMIT,
        signatureData: verification.signature || '',
        signedContentHash: this.hashContent(commit.commit.message + commit.commit.tree.sha),
        signerKeyId: this.extractKeyId(verification.signature),
        signerFingerprint: '',
        status: this.mapGitHubVerificationStatus(verification.verified),
        verificationDetails: {
          algorithm: 'GPG',
          trustLevel: verification.reason,
          creationTime: commit.commit.author.date,
        },
        verifiedAt: new Date(),
        gitCommitHash: commitHash,
      });
      
      return await this.signatureRepository.save(signature);
    } catch (error) {
      console.error('Failed to verify commit signature:', error);
      return this.createUnverifiedSignature(pluginId, version, SignatureType.COMMIT, commitHash);
    }
  }

  /**
   * 获取用户的GPG密钥列表
   */
  async getUserKeys(userId: string): Promise<GPGKey[]> {
    return await this.gpgKeyRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * 获取插件的签名信息
   */
  async getPluginSignatures(pluginId: string): Promise<PluginSignature[]> {
    return await this.signatureRepository.find({
      where: { pluginId },
      relations: ['gpgKey'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * 撤销GPG密钥
   */
  async revokeKey(userId: string, keyId: string): Promise<void> {
    const gpgKey = await this.gpgKeyRepository.findOne({
      where: { keyId, userId }
    });
    
    if (!gpgKey) {
      throw new NotFoundException('GPG key not found');
    }
    
    gpgKey.status = GPGKeyStatus.REVOKED;
    await this.gpgKeyRepository.save(gpgKey);
    
    // 更新相关签名状态
    await this.signatureRepository.update(
      { gpgKeyId: gpgKey.id },
      { status: SignatureStatus.REVOKED }
    );
  }

  // 私有辅助方法 - 简化的密钥信息提取
  private extractBasicKeyInfo(publicKeyArmored: string): {
    keyId: string;
    fingerprint: string;
    keyType: string;
    keySize: number;
    userIds: string[];
    creationTime: Date;
    expirationTime: Date | null;
  } {
    // 简化实现：生成模拟的密钥信息
    // 实际项目中应使用OpenPGP库解析真实的密钥信息
    const hash = crypto.createHash('sha256').update(publicKeyArmored).digest('hex');

    return {
      keyId: hash.slice(-16).toUpperCase(), // 模拟8字节密钥ID
      fingerprint: hash.slice(0, 40).toUpperCase(), // 模拟20字节指纹
      keyType: 'RSA', // 默认类型
      keySize: 2048, // 默认大小
      userIds: ['user@example.com'], // 模拟用户ID
      creationTime: new Date(),
      expirationTime: null,
    };
  }

  private getGitHubApiUrl(repoUrl: string): string {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new BadRequestException('Invalid GitHub repository URL');
    }
    return `https://api.github.com/repos/${match[1]}/${match[2]}`;
  }

  private hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private extractKeyId(signature: string): string {
    // 简化的密钥ID提取，实际实现需要解析GPG签名
    return signature ? signature.slice(-16) : '';
  }

  private mapGitHubVerificationStatus(verified: boolean): SignatureStatus {
    return verified ? SignatureStatus.VALID : SignatureStatus.INVALID;
  }

  private createUnverifiedSignature(
    pluginId: string,
    version: string,
    type: SignatureType,
    reference?: string
  ): PluginSignature {
    return this.signatureRepository.create({
      pluginId,
      version,
      signatureType: type,
      signatureData: '',
      signedContentHash: '',
      signerKeyId: '',
      signerFingerprint: '',
      status: SignatureStatus.UNKNOWN_KEY,
      verificationDetails: { errorMessage: 'No signature found' },
      gitCommitHash: type === SignatureType.COMMIT ? reference : undefined,
      gitTagName: type === SignatureType.TAG ? reference : undefined,
    });
  }
}
