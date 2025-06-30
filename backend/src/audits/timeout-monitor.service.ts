import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Plugin, PluginStatus } from '../plugins/entities/plugin.entity';
import { Audit, AuditStatus } from './entities/audit.entity';
import { ConfigService } from '@nestjs/config';

interface TimeoutConfig {
  pendingTimeoutMinutes: number;
  processingTimeoutMinutes: number;
  checkIntervalMinutes: number;
}

@Injectable()
export class TimeoutMonitorService {
  private readonly timeoutConfig: TimeoutConfig;

  constructor(
    @InjectRepository(Plugin)
    private readonly pluginsRepository: Repository<Plugin>,
    @InjectRepository(Audit)
    private readonly auditsRepository: Repository<Audit>,
    private readonly configService: ConfigService,
  ) {
    this.timeoutConfig = {
      pendingTimeoutMinutes: this.configService.get<number>('PLUGIN_PENDING_TIMEOUT_MINUTES', 30),
      processingTimeoutMinutes: this.configService.get<number>('PLUGIN_PROCESSING_TIMEOUT_MINUTES', 15),
      checkIntervalMinutes: this.configService.get<number>('TIMEOUT_CHECK_INTERVAL_MINUTES', 5),
    };

    console.log('TimeoutMonitorService initialized with config:', this.timeoutConfig);
  }

  /**
   * 定期检查超时的插件 - 每5分钟运行一次
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkTimeouts() {
    console.log('Starting timeout check for plugins...');
    
    try {
      const pendingTimeouts = await this.checkPendingTimeouts();
      const processingTimeouts = await this.checkProcessingTimeouts();
      
      const totalTimeouts = pendingTimeouts + processingTimeouts;
      
      if (totalTimeouts > 0) {
        console.log(`Timeout check completed: ${totalTimeouts} plugins marked as failed (${pendingTimeouts} pending, ${processingTimeouts} processing)`);
      } else {
        console.log('Timeout check completed: No timeouts detected');
      }
    } catch (error) {
      console.error('Error during timeout check:', error);
    }
  }

  /**
   * 检查长时间处于PENDING状态的插件
   */
  private async checkPendingTimeouts(): Promise<number> {
    const timeoutThreshold = new Date();
    timeoutThreshold.setMinutes(timeoutThreshold.getMinutes() - this.timeoutConfig.pendingTimeoutMinutes);

    const timedOutPlugins = await this.pluginsRepository.find({
      where: {
        status: PluginStatus.PENDING,
        createdAt: LessThan(timeoutThreshold),
      },
    });

    let failedCount = 0;

    for (const plugin of timedOutPlugins) {
      try {
        await this.markPluginAsFailed(
          plugin,
          `Plugin audit timed out after ${this.timeoutConfig.pendingTimeoutMinutes} minutes in PENDING status`,
          'PENDING_TIMEOUT'
        );
        failedCount++;
      } catch (error) {
        console.error(`Failed to mark plugin ${plugin.id} as failed:`, error);
      }
    }

    return failedCount;
  }

  /**
   * 检查长时间处于处理中状态的插件（通过审核记录判断）
   */
  private async checkProcessingTimeouts(): Promise<number> {
    const timeoutThreshold = new Date();
    timeoutThreshold.setMinutes(timeoutThreshold.getMinutes() - this.timeoutConfig.processingTimeoutMinutes);

    // 查找有正在进行的审核但超时的插件
    const processingAudits = await this.auditsRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.plugin', 'plugin')
      .where('audit.status = :status', { status: AuditStatus.PROCESSING })
      .andWhere('audit.createdAt < :threshold', { threshold: timeoutThreshold })
      .getMany();

    let failedCount = 0;

    for (const audit of processingAudits) {
      try {
        if (audit.plugin) {
          await this.markPluginAsFailed(
            audit.plugin,
            `Plugin audit timed out after ${this.timeoutConfig.processingTimeoutMinutes} minutes in PROCESSING status`,
            'PROCESSING_TIMEOUT'
          );

          // 更新审核记录状态
          await this.auditsRepository.update(audit.id, {
            status: AuditStatus.FAILURE,
            reportSummary: 'Audit timed out during processing',
            rawReport: {
              ...audit.rawReport,
              timeout_info: {
                timeout_type: 'PROCESSING_TIMEOUT',
                timeout_duration_minutes: this.timeoutConfig.processingTimeoutMinutes,
                timeout_timestamp: new Date().toISOString(),
              },
            },
          });

          failedCount++;
        }
      } catch (error) {
        console.error(`Failed to handle processing timeout for audit ${audit.id}:`, error);
      }
    }

    return failedCount;
  }

  /**
   * 将插件标记为失败并创建审核记录
   */
  private async markPluginAsFailed(plugin: Plugin, reason: string, timeoutType: string): Promise<void> {
    console.log(`Marking plugin ${plugin.id} (${plugin.name}) as failed due to timeout: ${timeoutType}`);

    // 更新插件状态
    await this.pluginsRepository.update(plugin.id, {
      status: PluginStatus.FAILED,
      updatedAt: new Date(),
    });

    // 创建失败的审核记录
    const failureAudit = {
      pluginId: plugin.id,
      version: plugin.latestVersion,
      status: AuditStatus.FAILURE,
      isSafe: false,
      reportSummary: reason,
      isPublic: false, // 超时失败的报告不公开
      rawReport: {
        timeout_info: {
          timeout_type: timeoutType,
          timeout_reason: reason,
          timeout_timestamp: new Date().toISOString(),
          plugin_info: {
            name: plugin.name,
            author: plugin.author,
            version: plugin.latestVersion,
            repo_url: plugin.repoUrl,
            created_at: plugin.createdAt.toISOString(),
            updated_at: plugin.updatedAt?.toISOString(),
          },
        },
        error: 'TIMEOUT',
        is_safe: false,
        reason: reason,
      },
    };

    await this.auditsRepository.save(failureAudit);

    console.log(`Plugin ${plugin.id} marked as failed and audit record created`);
  }

  /**
   * 手动检查特定插件的超时状态
   */
  async checkPluginTimeout(pluginId: string): Promise<boolean> {
    const plugin = await this.pluginsRepository.findOne({
      where: { id: pluginId },
    });

    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    const now = new Date();
    const createdAt = new Date(plugin.createdAt);
    const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60);

    // 检查是否超时
    if (plugin.status === PluginStatus.PENDING && minutesSinceCreation > this.timeoutConfig.pendingTimeoutMinutes) {
      await this.markPluginAsFailed(
        plugin,
        `Plugin audit timed out after ${Math.round(minutesSinceCreation)} minutes in PENDING status`,
        'MANUAL_TIMEOUT_CHECK'
      );
      return true;
    }

    return false;
  }

  /**
   * 获取超时配置
   */
  getTimeoutConfig(): TimeoutConfig {
    return { ...this.timeoutConfig };
  }

  /**
   * 获取超时统计信息
   */
  async getTimeoutStatistics(): Promise<{
    pendingPlugins: number;
    processingAudits: number;
    recentTimeouts: number;
  }> {
    const pendingTimeoutThreshold = new Date();
    pendingTimeoutThreshold.setMinutes(pendingTimeoutThreshold.getMinutes() - this.timeoutConfig.pendingTimeoutMinutes);

    const processingTimeoutThreshold = new Date();
    processingTimeoutThreshold.setMinutes(processingTimeoutThreshold.getMinutes() - this.timeoutConfig.processingTimeoutMinutes);

    const recentTimeoutThreshold = new Date();
    recentTimeoutThreshold.setHours(recentTimeoutThreshold.getHours() - 24); // 最近24小时

    const [pendingPlugins, processingAudits, recentTimeouts] = await Promise.all([
      this.pluginsRepository.count({
        where: {
          status: PluginStatus.PENDING,
          createdAt: LessThan(pendingTimeoutThreshold),
        },
      }),
      this.auditsRepository.count({
        where: {
          status: AuditStatus.PROCESSING,
          createdAt: LessThan(processingTimeoutThreshold),
        },
      }),
      this.auditsRepository.count({
        where: {
          status: AuditStatus.FAILURE,
          createdAt: LessThan(recentTimeoutThreshold),
          reportSummary: 'timeout',
        },
      }),
    ]);

    return {
      pendingPlugins,
      processingAudits,
      recentTimeouts,
    };
  }
}
