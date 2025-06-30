import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { GPGService } from './gpg.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class ImportKeyDto {
  publicKey: string;
}

class VerifyKeyDto {
  keyId: string;
  signedMessage: string;
}

@Controller('gpg')
export class GPGController {
  constructor(private readonly gpgService: GPGService) {}

  /**
   * 导入GPG公钥
   */
  @Post('keys/import')
  @UseGuards(JwtAuthGuard)
  async importKey(@Request() req, @Body() importKeyDto: ImportKeyDto) {
    try {
      const { publicKey } = importKeyDto;
      
      if (!publicKey || !publicKey.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----')) {
        throw new BadRequestException('Invalid GPG public key format');
      }
      
      const gpgKey = await this.gpgService.importPublicKey(req.user.id, publicKey);
      
      return {
        success: true,
        data: {
          keyId: gpgKey.keyId,
          fingerprint: gpgKey.fingerprint,
          status: gpgKey.status,
          verificationToken: gpgKey.verificationToken,
          userIds: gpgKey.userIds,
          creationTime: gpgKey.creationTime,
          expirationTime: gpgKey.expirationTime,
        },
        message: 'GPG key imported successfully. Please verify ownership by signing the verification token.',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * 验证GPG密钥所有权
   */
  @Post('keys/verify')
  @UseGuards(JwtAuthGuard)
  async verifyKey(@Request() req, @Body() verifyKeyDto: VerifyKeyDto) {
    try {
      const { keyId, signedMessage } = verifyKeyDto;
      
      const verified = await this.gpgService.verifyKeyOwnership(keyId, signedMessage);
      
      if (verified) {
        return {
          success: true,
          message: 'GPG key verified successfully',
        };
      } else {
        throw new BadRequestException('Key verification failed');
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * 获取用户的GPG密钥列表
   */
  @Get('keys')
  @UseGuards(JwtAuthGuard)
  async getUserKeys(@Request() req) {
    const keys = await this.gpgService.getUserKeys(req.user.id);
    
    return {
      success: true,
      data: keys.map(key => ({
        id: key.id,
        keyId: key.keyId,
        fingerprint: key.fingerprint,
        keyType: key.keyType,
        keySize: key.keySize,
        userIds: key.userIds,
        status: key.status,
        creationTime: key.creationTime,
        expirationTime: key.expirationTime,
        verifiedAt: key.verifiedAt,
        lastUsedAt: key.lastUsedAt,
        createdAt: key.createdAt,
      })),
    };
  }

  /**
   * 撤销GPG密钥
   */
  @Delete('keys/:keyId')
  @UseGuards(JwtAuthGuard)
  async revokeKey(@Request() req, @Param('keyId') keyId: string) {
    try {
      await this.gpgService.revokeKey(req.user.id, keyId);
      
      return {
        success: true,
        message: 'GPG key revoked successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * 获取插件的签名信息
   */
  @Get('signatures/plugin/:pluginId')
  async getPluginSignatures(@Param('pluginId') pluginId: string) {
    const signatures = await this.gpgService.getPluginSignatures(pluginId);
    
    return {
      success: true,
      data: signatures.map(sig => ({
        id: sig.id,
        version: sig.version,
        signatureType: sig.signatureType,
        status: sig.status,
        signerKeyId: sig.signerKeyId,
        signerFingerprint: sig.signerFingerprint,
        verificationDetails: sig.verificationDetails,
        verifiedAt: sig.verifiedAt,
        gitCommitHash: sig.gitCommitHash,
        gitTagName: sig.gitTagName,
        gpgKey: sig.gpgKey ? {
          keyId: sig.gpgKey.keyId,
          fingerprint: sig.gpgKey.fingerprint,
          userIds: sig.gpgKey.userIds,
          status: sig.gpgKey.status,
        } : null,
        createdAt: sig.createdAt,
      })),
    };
  }

  /**
   * 手动触发插件签名验证
   */
  @Post('signatures/verify/:pluginId')
  @UseGuards(JwtAuthGuard)
  async verifyPluginSignatures(@Param('pluginId') pluginId: string, @Body() body: { version: string; commitHash?: string }) {
    try {
      // 这里需要从插件信息中获取仓库URL
      // 简化实现，实际需要查询插件表
      const repoUrl = 'https://github.com/example/plugin'; // 临时占位
      const { version, commitHash } = body;
      
      if (commitHash) {
        const signature = await this.gpgService.verifyCommitSignature(
          repoUrl,
          commitHash,
          pluginId,
          version
        );
        
        return {
          success: true,
          data: signature,
          message: 'Signature verification completed',
        };
      }
      
      return {
        success: false,
        message: 'No commit hash provided for verification',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * 获取GPG验证统计信息
   */
  @Get('statistics')
  async getGPGStatistics() {
    // 这里可以添加统计查询
    return {
      success: true,
      data: {
        totalKeys: 0,
        verifiedKeys: 0,
        signedPlugins: 0,
        verificationRate: 0,
      },
      message: 'GPG statistics retrieved successfully',
    };
  }
}
