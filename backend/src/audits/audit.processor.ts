import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Inject } from '@nestjs/common';
import { LLM_SERVICE, LLMService } from '../llm/llm.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Plugin, PluginStatus } from '../plugins/entities/plugin.entity';
import { Repository } from 'typeorm';
import { Audit, AuditStatus } from './entities/audit.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { UsersService } from 'src/users/users.service';

const execAsync = promisify(exec);

@Processor('audit-queue')
export class AuditProcessor {
  constructor(
    @Inject(LLM_SERVICE) private readonly llmService: LLMService,
    @InjectRepository(Plugin)
    private readonly pluginsRepository: Repository<Plugin>,
    @InjectRepository(Audit)
    private readonly auditsRepository: Repository<Audit>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  @Process('initial-audit')
  async handleInitialAudit(job: Job<{ pluginId: string; repoUrl: string }>) {
    const { pluginId, repoUrl } = job.data;
    console.log(`Starting initial audit for plugin ${pluginId} from ${repoUrl}`);

    const tempDir = path.join(__dirname, '..', '..', 'temp', pluginId);
    let plugin: Plugin | null = null;
    let processingAudit: Audit | null = null;

    try {
      plugin = await this.pluginsRepository.findOneBy({ id: pluginId });
      if (!plugin) {
        throw new Error(`Plugin with ID ${pluginId} not found.`);
      }

      // 创建处理中的审核记录
      processingAudit = await this.auditsRepository.save({
        pluginId,
        version: plugin.latestVersion,
        status: AuditStatus.PROCESSING,
        isSafe: false,
        reportSummary: 'Audit in progress...',
        isPublic: false,
        rawReport: {
          processing_info: {
            start_time: new Date().toISOString(),
            status: 'PROCESSING',
          },
        },
      });

      console.log(`Created processing audit record ${processingAudit.id} for plugin ${pluginId}`);

      await fs.mkdir(tempDir, { recursive: true });
      await execAsync(`git clone ${repoUrl} ${tempDir}`);
      console.log(`Cloned repo to ${tempDir}`);

      // 智能代码聚合策略
      const codeAnalysis = await this.analyzeCodeStructure(tempDir);
      console.log(`Code analysis: ${codeAnalysis.totalFiles} files, ${codeAnalysis.totalLines} lines, ${codeAnalysis.estimatedTokens} estimated tokens`);

      let sourceCodeForAudit: string;

      if (codeAnalysis.estimatedTokens > 50000) {
        // 大型项目：使用智能摘要策略
        console.log('Large project detected, using intelligent summarization strategy');
        sourceCodeForAudit = await this.createIntelligentSummary(tempDir, codeAnalysis);
      } else {
        // 小型项目：使用完整代码
        console.log('Small project detected, using full code analysis');
        sourceCodeForAudit = codeAnalysis.allCode;
      }

      console.log(`Prepared code for audit: ${sourceCodeForAudit.length} characters`);

      const auditResult = await this.llmService.auditCode({
        plugin_name: plugin.name,
        source_code: sourceCodeForAudit,
      });

      const newPluginStatus = auditResult.is_safe
        ? PluginStatus.APPROVED
        : PluginStatus.DELISTED;

      await this.pluginsRepository.update(pluginId, {
        status: newPluginStatus,
      });

      // 更新处理中的审核记录
      if (processingAudit) {
        await this.auditsRepository.update(processingAudit.id, {
          status: auditResult.is_safe ? AuditStatus.SUCCESS : AuditStatus.FAILURE,
          isSafe: auditResult.is_safe,
          reportSummary: auditResult.reason,
          isPublic: auditResult.is_safe, // 只有安全的报告才公开
          rawReport: {
            ...auditResult.raw_report,
            audit_metadata: {
              audit_date: new Date().toISOString(),
              processing_start: processingAudit.rawReport?.processing_info?.start_time,
              processing_end: new Date().toISOString(),
              plugin_info: {
                name: plugin.name,
                author: plugin.author,
                version: plugin.latestVersion,
                repo_url: plugin.repoUrl,
              },
              code_stats: {
                total_files: codeAnalysis.totalFiles,
                code_files: codeAnalysis.codeFiles,
                total_lines: codeAnalysis.totalLines,
                estimated_tokens: codeAnalysis.estimatedTokens,
                analysis_strategy: codeAnalysis.estimatedTokens > 50000 ? 'intelligent_summary' : 'full_code',
              },
            },
          },
        });
      } else {
        // 如果没有处理中的记录，创建新的
        await this.auditsRepository.save({
          pluginId,
          version: plugin.latestVersion,
          status: auditResult.is_safe ? AuditStatus.SUCCESS : AuditStatus.FAILURE,
          isSafe: auditResult.is_safe,
          reportSummary: auditResult.reason,
          isPublic: auditResult.is_safe,
          rawReport: {
            ...auditResult.raw_report,
            audit_metadata: {
              audit_date: new Date().toISOString(),
              plugin_info: {
                name: plugin.name,
                author: plugin.author,
                version: plugin.latestVersion,
                repo_url: plugin.repoUrl,
              },
              code_stats: {
                total_files: codeAnalysis.totalFiles,
                code_files: codeAnalysis.codeFiles,
                total_lines: codeAnalysis.totalLines,
                estimated_tokens: codeAnalysis.estimatedTokens,
                analysis_strategy: codeAnalysis.estimatedTokens > 50000 ? 'intelligent_summary' : 'full_code',
              },
            },
          },
        });
      }

      console.log(
        `Audit for plugin ${pluginId} completed. Result: ${newPluginStatus}`,
      );

      if (newPluginStatus === PluginStatus.APPROVED) {
        await this.installWebhook(plugin);
      } else {
        // On failure, create a GitHub issue
        await this.createGithubIssue(plugin, auditResult.reason);
      }
    } catch (error) {
      console.error(`Failed to audit plugin ${pluginId}`, error);
      if (plugin) {
        await this.pluginsRepository.update(pluginId, {
          status: PluginStatus.FAILED,
        });

        // 更新处理中的审核记录为失败
        if (processingAudit) {
          await this.auditsRepository.update(processingAudit.id, {
            status: AuditStatus.FAILURE,
            isSafe: false,
            reportSummary: `Audit failed with error: ${error.message}`,
            isPublic: false,
            rawReport: {
              ...processingAudit.rawReport,
              error: error.message,
              processing_end: new Date().toISOString(),
              failure_info: {
                error_type: 'PROCESSING_ERROR',
                error_message: error.message,
                timestamp: new Date().toISOString(),
              },
            },
          });
        }

        await this.createGithubIssue(
          plugin,
          `Audit failed with error: ${error.message}`,
        );
      }
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log(`Cleaned up temp directory ${tempDir}`);
    }
  }

  private async installWebhook(plugin: Plugin): Promise<void> {
    const user = await this.usersService.findOneById(plugin.publisherId);
    if (!user) {
      throw new Error(`User not found for plugin ${plugin.id}`);
    }

    // 检查用户是否有有效的访问令牌
    if (!user.accessToken) {
      console.error(`Cannot install webhook: User ${user.id} has no valid GitHub access token`);
      return;
    }

    const repoFullName = plugin.repoUrl.replace('https://github.com/', '');
    const url = `https://api.github.com/repos/${repoFullName}/hooks`;

    const webhookUrl = `${this.configService.get(
      'APP_URL',
    )}/api/plugins/webhook`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          url,
          {
            name: 'web',
            active: true,
            events: ['push'],
            config: {
              url: webhookUrl,
              content_type: 'json',
              secret: this.configService.get('GITHUB_WEBHOOK_SECRET'),
            },
          },
          {
            headers: { Authorization: `Bearer ${user.accessToken}` },
          },
        ),
      );

      await this.pluginsRepository.update(plugin.id, {
        webhookId: response.data.id,
      });
      console.log(
        `Successfully installed webhook for repo ${repoFullName}. Webhook ID: ${response.data.id}`,
      );
    } catch (error) {
      console.error(
        `Failed to install webhook for repo ${repoFullName}`,
        error.response?.data || error.message,
      );
    }
  }

  private async createGithubIssue(plugin: Plugin, reason: string): Promise<void> {
    const user = await this.usersService.findOneById(plugin.publisherId);
    if (!user) {
      console.error(`Cannot create issue: User not found for plugin ${plugin.id}`);
      return;
    }

    // 检查用户是否有有效的访问令牌
    if (!user.accessToken) {
      console.error(`Cannot create issue: User ${user.id} has no valid GitHub access token`);
      return;
    }

    const repoFullName = plugin.repoUrl.replace('https://github.com/', '');
    const url = `https://api.github.com/repos/${repoFullName}/issues`;

    const issueBody = `
      ## AstrBot Plugin Security Alert

      Hello @${user.username},

      Your plugin **${plugin.name}** (version ${plugin.latestVersion}) has been automatically delisted from the AstrBot Trusted Marketplace due to a potential security issue found during our automated audit.

      **Reason:**
      \`\`\`
      ${reason}
      \`\`\`

      Please review the findings and push an updated version. The new version will be automatically re-audited.

      Thank you,
      The AstrBot Team
    `;

    try {
      await firstValueFrom(
        this.httpService.post(
          url,
          {
            title: `[Security Alert] Your plugin ${plugin.name} has been delisted`,
            body: issueBody,
          },
          {
            headers: { Authorization: `Bearer ${user.accessToken}` },
          },
        ),
      );
      console.log(`Successfully created security alert issue for ${repoFullName}.`);
    } catch (error) {
      console.error(
        `Failed to create issue for repo ${repoFullName}`,
        error.response?.data || error.message,
      );
    }
  }

  /**
   * 分析代码结构和复杂度
   */
  private async analyzeCodeStructure(tempDir: string) {
    const files = await fs.readdir(tempDir, { recursive: true });
    let allCode = '';
    let totalLines = 0;
    let codeFiles = 0;

    const codeExtensions = ['.js', '.ts', '.py', '.jsx', '.tsx', '.vue', '.php', '.rb', '.go', '.rs', '.java', '.cpp', '.c', '.cs'];
    const excludePatterns = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '__pycache__',
      '.pytest_cache',
      'coverage',
      '.nyc_output',
      'vendor',
      'target'
    ];

    for (const file of files) {
      const filePath = path.join(tempDir, file.toString());
      const relativePath = file.toString();

      // 跳过排除的目录
      if (excludePatterns.some(pattern => relativePath.includes(pattern))) {
        continue;
      }

      // 检查是否是代码文件
      if (codeExtensions.some(ext => relativePath.endsWith(ext))) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          allCode += `\n// File: ${relativePath}\n${content}\n`;
          totalLines += content.split('\n').length;
          codeFiles++;
        } catch (error) {
          console.warn(`Failed to read file ${relativePath}:`, error.message);
        }
      }
    }

    // 估算token数量 (粗略估算: 1 token ≈ 4 characters)
    const estimatedTokens = Math.ceil(allCode.length / 4);

    return {
      totalFiles: files.length,
      codeFiles,
      totalLines,
      allCode,
      estimatedTokens,
    };
  }

  /**
   * 为大型项目创建智能摘要
   */
  private async createIntelligentSummary(tempDir: string, codeAnalysis: any): Promise<string> {
    const files = await fs.readdir(tempDir, { recursive: true });

    // 优先级文件模式
    const highPriorityPatterns = [
      /main\.(js|ts|py)$/,
      /index\.(js|ts)$/,
      /app\.(js|ts|py)$/,
      /server\.(js|ts|py)$/,
      /plugin\.(js|ts|py)$/,
      /bot\.(js|ts|py)$/,
      /config\.(js|ts|py|json|yaml|yml)$/,
      /setup\.(js|ts|py)$/,
      /install\.(js|ts|py)$/,
    ];

    const securitySensitivePatterns = [
      /auth/i,
      /login/i,
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /crypto/i,
      /security/i,
      /admin/i,
      /exec/i,
      /eval/i,
      /shell/i,
      /command/i,
      /process/i,
      /network/i,
      /http/i,
      /request/i,
      /api/i,
    ];

    let summary = `# Intelligent Code Summary for ${codeAnalysis.codeFiles} files\n\n`;

    // 1. 包含所有高优先级文件
    const highPriorityFiles: string[] = [];
    const securitySensitiveFiles: string[] = [];
    const regularFiles: string[] = [];

    for (const file of files) {
      const relativePath = file.toString();
      const isCode = ['.js', '.ts', '.py', '.jsx', '.tsx'].some(ext => relativePath.endsWith(ext));

      if (!isCode) continue;

      if (highPriorityPatterns.some(pattern => pattern.test(relativePath))) {
        highPriorityFiles.push(relativePath);
      } else if (securitySensitivePatterns.some(pattern => pattern.test(relativePath))) {
        securitySensitiveFiles.push(relativePath);
      } else {
        regularFiles.push(relativePath);
      }
    }

    // 2. 添加高优先级文件的完整内容
    summary += `## High Priority Files (${highPriorityFiles.length})\n`;
    for (const filePath of highPriorityFiles.slice(0, 5)) { // 限制前5个
      try {
        const fullPath = path.join(tempDir, filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        summary += `\n### ${filePath}\n\`\`\`\n${content}\n\`\`\`\n`;
      } catch (error) {
        summary += `\n### ${filePath}\n[Error reading file: ${error.message}]\n`;
      }
    }

    // 3. 添加安全敏感文件的摘要
    summary += `\n## Security Sensitive Files (${securitySensitiveFiles.length})\n`;
    for (const filePath of securitySensitiveFiles.slice(0, 10)) { // 限制前10个
      try {
        const fullPath = path.join(tempDir, filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const lines = content.split('\n');
        const importantLines = lines.filter(line =>
          securitySensitivePatterns.some(pattern => pattern.test(line))
        ).slice(0, 20); // 每个文件最多20行

        summary += `\n### ${filePath}\nKey security-related lines:\n`;
        importantLines.forEach((line, index) => {
          summary += `${index + 1}: ${line.trim()}\n`;
        });
      } catch (error) {
        summary += `\n### ${filePath}\n[Error reading file: ${error.message}]\n`;
      }
    }

    // 4. 添加项目结构概览
    summary += `\n## Project Structure Overview\n`;
    summary += `- Total files: ${codeAnalysis.totalFiles}\n`;
    summary += `- Code files: ${codeAnalysis.codeFiles}\n`;
    summary += `- Total lines: ${codeAnalysis.totalLines}\n`;
    summary += `- File types: ${[...new Set(files.map(f => path.extname(f.toString())).filter(ext => ext))].join(', ')}\n`;

    // 5. 添加依赖信息
    try {
      const packageJsonPath = path.join(tempDir, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      summary += `\n## Dependencies\n`;
      if (packageJson.dependencies) {
        summary += `Production: ${Object.keys(packageJson.dependencies).join(', ')}\n`;
      }
      if (packageJson.devDependencies) {
        summary += `Development: ${Object.keys(packageJson.devDependencies).join(', ')}\n`;
      }
    } catch (error) {
      // 忽略package.json读取错误
    }

    return summary;
  }
}