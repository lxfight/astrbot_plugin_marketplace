import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plugin, PluginStatus } from './entities/plugin.entity';
import { UsersService } from '../users/users.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as yaml from 'js-yaml';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

import { GitHubRepo, PluginMetadata, RawPluginMetadata, GitHubWebhookPayload } from '../common/types/github.types';

@Injectable()
export class PluginsService {
  constructor(
    @InjectRepository(Plugin)
    private readonly pluginsRepository: Repository<Plugin>,
    private readonly usersService: UsersService,
    private readonly httpService: HttpService,
    @InjectQueue('audit-queue') private readonly auditQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  async getGithubRepos(userId: string): Promise<GitHubRepo[]> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 检查用户是否有有效的访问令牌
    if (!user.accessToken) {
      throw new UnauthorizedException('GitHub access token not available. Please log in again.');
    }

    const url = 'https://api.github.com/user/repos?type=owner&per_page=100';

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        }),
      );
      return response.data;
    } catch (error) {
      // 如果是401错误，说明令牌已失效
      if (error.response?.status === 401) {
        throw new UnauthorizedException('GitHub access token has expired. Please log in again.');
      }
      throw new BadRequestException('Failed to fetch GitHub repositories');
    }
  }

  async submit(publisherId: string, repoUrl: string): Promise<Plugin> {
    // 1. Check if plugin already exists
    const existingPlugin = await this.pluginsRepository.findOne({
      where: { repoUrl },
    });

    if (existingPlugin) {
    // 允许失败状态的插件重新提交
    if (existingPlugin.status === PluginStatus.FAILED) {
      // 检查是否是同一个用户
      if (existingPlugin.publisherId !== publisherId) {
        throw new BadRequestException(
          `This plugin was previously submitted by another user and failed review. ` +
          `Repository: ${repoUrl}`
        );
      }

      // 允许重新提交，更新现有记录
      console.log(`Allowing resubmission of failed plugin: ${repoUrl}`);
      return this.resubmitFailedPlugin(existingPlugin, publisherId, repoUrl);
    } else {
        // 其他状态不允许重复提交
        throw new BadRequestException(
          `Plugin already exists with status: ${existingPlugin.status}. ` +
          `Repository: ${repoUrl}. ` +
          `Submitted on: ${existingPlugin.createdAt.toISOString()}`
        );
      }
    }

    // 2. Fetch metadata.yaml from the repo
    const metadata = await this.fetchMetadata(repoUrl);

    // 3. Create and save the new plugin
    const newPlugin = this.pluginsRepository.create({
      publisherId,
      repoUrl,
      name: metadata.name,
      author: metadata.author,
      description: metadata.description,
      latestVersion: metadata.version,
      status: PluginStatus.PENDING,
    });

    const savedPlugin = await this.pluginsRepository.save(newPlugin);

    // 4. Enqueue an InitialAudit job
    await this.auditQueue.add('initial-audit', {
      pluginId: savedPlugin.id,
      repoUrl: savedPlugin.repoUrl,
    });

    return savedPlugin;
  }

  private async fetchMetadata(repoUrl: string): Promise<PluginMetadata> {
    // e.g., https://github.com/lxfight/astrbot_plugin_deepresearch
    const apiUrl = repoUrl.replace(
      'https://github.com/',
      'https://api.github.com/repos/',
    );

    // 尝试多个可能的元数据文件位置
    const possiblePaths = [
      'metadata.yaml',
      'metadata.yml',
      '.astrbot/metadata.yaml',
      '.astrbot/metadata.yml',
      'config/metadata.yaml',
      'config/metadata.yml'
    ];

    for (const path of possiblePaths) {
      try {
        const metadataUrl = `${apiUrl}/contents/${path}`;
        const response = await firstValueFrom(
          this.httpService.get(metadataUrl, {
            headers: { Accept: 'application/vnd.github.v3.raw' },
          }),
        );

        const rawMetadata = yaml.load(response.data) as RawPluginMetadata;

        // 标准化元数据字段，支持多种命名约定
        const metadata: PluginMetadata = this.normalizeMetadata(rawMetadata);

        // Validate required fields
        if (!metadata.name || !metadata.author || !metadata.version || !metadata.description) {
          console.log(`Found metadata file at ${path} but missing required fields. Found: name=${metadata.name}, author=${metadata.author}, version=${metadata.version}, description=${metadata.description}`);
          continue;
        }

        console.log(`Successfully found valid metadata at: ${path}`);
        return metadata;
      } catch (error) {
        // 继续尝试下一个路径
        continue;
      }
    }

    // 如果所有路径都失败了
    throw new NotFoundException(
      `metadata.yaml not found in any expected location in repo ${repoUrl}. ` +
      `Tried paths: ${possiblePaths.join(', ')}. ` +
      `Please ensure your plugin has a valid metadata file with required fields: name, author, version, description.`,
    );
  }

  /**
   * 标准化元数据字段，支持多种命名约定
   */
  private normalizeMetadata(raw: RawPluginMetadata): PluginMetadata {
    // 标准化名称字段
    const name = raw.name || raw.plugin_name;

    // 标准化描述字段 (支持官方的 desc 简写)
    const description = raw.description || raw.desc || raw.summary;

    // 标准化版本字段
    const version = raw.version || raw.ver || raw.plugin_version;

    // 标准化作者字段
    let author = raw.author || raw.creator || raw.maintainer;
    if (Array.isArray(raw.authors)) {
      author = raw.authors[0]; // 取第一个作者
    } else if (typeof raw.authors === 'string') {
      author = raw.authors;
    }

    // 标准化仓库字段 (支持官方的 repo 简写)
    const repo = raw.repo || raw.repository || raw.url || raw.git_url || raw.github;

    // 标准化依赖字段
    let dependencies: string[] | undefined;
    if (raw.dependencies) {
      dependencies = Array.isArray(raw.dependencies) ? raw.dependencies : [raw.dependencies];
    } else if (raw.deps) {
      dependencies = Array.isArray(raw.deps) ? raw.deps : [raw.deps];
    } else if (raw.requirements) {
      dependencies = Array.isArray(raw.requirements) ? raw.requirements : [raw.requirements];
    }

    // 标准化标签字段
    let tags: string[] | undefined;
    if (raw.tags) {
      tags = Array.isArray(raw.tags) ? raw.tags : [raw.tags];
    } else if (raw.keywords) {
      tags = Array.isArray(raw.keywords) ? raw.keywords : [raw.keywords];
    } else if (raw.categories) {
      tags = Array.isArray(raw.categories) ? raw.categories : [raw.categories];
    }

    // 标准化许可证字段
    const license = raw.license || raw.licence;

    return {
      name: name || '',
      description: description || '',
      version: version || '',
      author: author || '',
      repo: repo || '',
      dependencies,
      tags,
      license,
    };
  }

  async handlePushEvent(signature: string, rawBody: Buffer, payload: GitHubWebhookPayload) {
    this.verifySignature(signature, rawBody);

    const repoUrl = payload.repository?.html_url;
    if (!repoUrl) {
      throw new BadRequestException('Repository URL not found in payload.');
    }

    const plugin = await this.pluginsRepository.findOne({ where: { repoUrl } });
    if (!plugin) {
      // We received a webhook for a repo we don't track. Ignore it.
      console.log(`Received webhook for untracked repo: ${repoUrl}`);
      return;
    }

    // Check if metadata.yaml was modified in the push
    const wasMetadataModified = payload.commits?.some((commit) =>
      commit.modified?.includes('metadata.yaml'),
    );

    if (!wasMetadataModified) {
      console.log(`Push to ${repoUrl} did not modify metadata.yaml. Skipping.`);
      return;
    }

    const newMetadata = await this.fetchMetadata(repoUrl);
    const newVersion = newMetadata.version;

    if (newVersion && newVersion !== plugin.latestVersion) {
      console.log(
        `New version ${newVersion} detected for ${repoUrl}. Enqueuing version audit.`,
      );
      await this.pluginsRepository.update(plugin.id, {
        latestVersion: newVersion,
        status: PluginStatus.PENDING,
      });
      // Note: We might want a different queue or job type for version audits
      await this.auditQueue.add('initial-audit', {
        pluginId: plugin.id,
        repoUrl: plugin.repoUrl,
      });
    }
  }

  private verifySignature(signature: string, rawBody: Buffer) {
    const secret = this.configService.get('GITHUB_WEBHOOK_SECRET');
    const hmac = crypto.createHmac('sha256', secret);
    const digest = `sha256=${hmac.update(rawBody).digest('hex')}`;

    if (!signature || !crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))) {
      throw new ForbiddenException('Invalid webhook signature.');
    }
  }

  async findAllPublic(): Promise<Plugin[]> {
    return this.pluginsRepository.find({
      where: { status: PluginStatus.APPROVED },
      relations: ['publisher'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Plugin | null> {
    return this.pluginsRepository.findOne({
      where: { id },
      relations: ['publisher'],
    });
  }

  async findByUserId(publisherId: string): Promise<Plugin[]> {
    return this.pluginsRepository.find({
      where: { publisherId },
      relations: ['publisher'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 重新提交失败的插件
   */
  async resubmitFailedPlugin(existingPlugin: Plugin, _publisherId: string, repoUrl: string): Promise<Plugin> {
    try {
      // 重新获取metadata.yaml
      const metadata = await this.fetchMetadata(repoUrl);

      // 更新插件信息
      existingPlugin.name = metadata.name;
      existingPlugin.description = metadata.description || 'No description provided';
      existingPlugin.latestVersion = metadata.version;
      existingPlugin.author = metadata.author;
      existingPlugin.status = PluginStatus.PENDING; // 重置为待审核状态
      existingPlugin.updatedAt = new Date();

      // 保存更新
      const updatedPlugin = await this.pluginsRepository.save(existingPlugin);

      // 重新触发审核 - 添加到审核队列
      try {
        await this.auditQueue.add('audit-plugin', {
          pluginId: updatedPlugin.id,
          repoUrl: repoUrl,
          isResubmission: true
        });
        console.log(`Audit queued for resubmitted plugin: ${updatedPlugin.name} (${updatedPlugin.id})`);
      } catch (auditError) {
        console.warn('Failed to queue audit for resubmitted plugin:', auditError.message);
        // 审核失败不应该阻止插件重新提交，可以稍后手动触发
      }

      console.log(`Plugin resubmitted successfully: ${updatedPlugin.name} (${updatedPlugin.id})`);
      return updatedPlugin;

    } catch (error) {
      console.error('Error during plugin resubmission:', error);
      throw new BadRequestException(
        `Failed to resubmit plugin: ${error.message || 'Unknown error'}`
      );
    }
  }

  /**
   * 生成AstrBot仓库的Issue内容
   */
  generateIssueContent(plugin: Plugin): { title: string; body: string } {
    const title = `[Plugin] ${plugin.name}`;

    const body = `欢迎发布插件到插件市场！

## 插件基本信息

请将插件信息填写到下方的 Json 代码块中。\`tags\`（插件标签）和 \`social_link\`（社交链接）选填。

\`\`\`json
{
  "name": "${plugin.name}",
  "desc": "${plugin.description}",
  "repo": "${plugin.repoUrl}",
  "tags": [],
  "social_link": ""
}
\`\`\`

## 检查

- [x] 我的插件经过完整的测试
- [x] 我的插件不包含恶意代码
- [x] 我已阅读并同意遵守该项目的 [行为准则](https://docs.github.com/zh/site-policy/github-terms/github-community-code-of-conduct)。

---

*此Issue由AstrBot插件市场自动生成*
*插件版本: ${plugin.latestVersion}*
*提交时间: ${plugin.createdAt.toISOString()}*`;

    return { title, body };
  }

  /**
   * 自动创建AstrBot仓库的Issue
   */
  async createAstrBotIssue(plugin: Plugin): Promise<{ issueUrl: string; issueNumber: number }> {
    const { title, body } = this.generateIssueContent(plugin);

    const url = 'https://api.github.com/repos/AstrBotDevs/AstrBot/issues';

    try {
      // 使用GitHub App token或者管理员的token
      // 这里需要配置一个有权限创建Issue的token
      const githubToken = this.configService.get<string>('GITHUB_ASTRBOT_TOKEN');

      if (!githubToken) {
        throw new Error('GITHUB_ASTRBOT_TOKEN not configured');
      }

      const response = await firstValueFrom(
        this.httpService.post(url, {
          title,
          body,
          labels: ['plugin-publish']
        }, {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AstrBot-Plugin-Marketplace'
          },
        }),
      );

      return {
        issueUrl: response.data.html_url,
        issueNumber: response.data.number
      };
    } catch (error) {
      console.error('Failed to create AstrBot issue:', error.response?.data || error.message);
      throw new BadRequestException('Failed to create AstrBot repository issue');
    }
  }

  /**
   * 生成手动提交Issue的URL
   */
  generateManualIssueUrl(plugin: Plugin): string {
    const { title, body } = this.generateIssueContent(plugin);

    const params = new URLSearchParams({
      template: 'plugin-publish.yml',
      title: title,
      body: body,
      labels: 'plugin-publish'
    });

    return `https://github.com/AstrBotDevs/AstrBot/issues/new?${params.toString()}`;
  }
}
