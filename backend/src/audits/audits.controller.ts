import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Request,
} from '@nestjs/common';
import { AuditsService, AuditReport, AuditStatistics } from './audits.service';
import { TimeoutMonitorService } from './timeout-monitor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('audits')
export class AuditsController {
  constructor(
    private readonly auditsService: AuditsService,
    private readonly timeoutMonitorService: TimeoutMonitorService,
  ) {}

  /**
   * 获取所有审查报告（分页）
   * GET /audits?limit=50&offset=0
   */
  @Get()
  async findAll(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<AuditReport[]> {
    return this.auditsService.findAll(limit, offset);
  }

  /**
   * 获取审查统计信息
   * GET /audits/statistics
   */
  @Get('statistics')
  async getStatistics(): Promise<AuditStatistics> {
    return this.auditsService.getStatistics();
  }

  /**
   * 获取失败的审查报告
   * GET /audits/failed?limit=20
   */
  @Get('failed')
  async getFailedAudits(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<AuditReport[]> {
    return this.auditsService.findFailedAudits(limit);
  }

  /**
   * 获取特定插件的所有公开审查报告
   * GET /audits/plugin/:pluginId
   */
  @Get('plugin/:pluginId')
  async findByPlugin(@Param('pluginId') pluginId: string): Promise<AuditReport[]> {
    return this.auditsService.findByPlugin(pluginId);
  }

  /**
   * 获取用户自己插件的所有审查报告（包括私有的）
   * GET /audits/my-plugin/:pluginId
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-plugin/:pluginId')
  async findMyPluginAudits(
    @Param('pluginId') pluginId: string,
    @Request() req: any
  ): Promise<AuditReport[]> {
    // 首先验证插件是否属于当前用户
    const plugin = await this.auditsService.getPluginById(pluginId);
    if (!plugin || plugin.publisherId !== req.user.id) {
      throw new Error('Plugin not found or access denied');
    }

    return this.auditsService.findByPluginForOwner(pluginId);
  }

  /**
   * 获取特定插件特定版本的审查报告
   * GET /audits/plugin/:pluginId/version/:version
   */
  @Get('plugin/:pluginId/version/:version')
  async findByPluginAndVersion(
    @Param('pluginId') pluginId: string,
    @Param('version') version: string,
  ): Promise<AuditReport | null> {
    return this.auditsService.findByPluginAndVersion(pluginId, version);
  }

  /**
   * 获取超时统计信息
   * GET /audits/timeout-statistics
   */
  @Get('timeout-statistics')
  async getTimeoutStatistics(): Promise<any> {
    const stats = await this.timeoutMonitorService.getTimeoutStatistics();
    const config = this.timeoutMonitorService.getTimeoutConfig();

    return {
      config,
      statistics: stats,
    };
  }

  /**
   * 手动检查特定插件的超时状态
   * GET /audits/check-timeout/:pluginId
   */
  @Get('check-timeout/:pluginId')
  async checkPluginTimeout(@Param('pluginId') pluginId: string): Promise<any> {
    const wasTimedOut = await this.timeoutMonitorService.checkPluginTimeout(pluginId);

    return {
      pluginId,
      wasTimedOut,
      message: wasTimedOut
        ? 'Plugin was marked as failed due to timeout'
        : 'Plugin is not timed out',
    };
  }

  /**
   * 获取特定审查报告详情
   * GET /audits/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AuditReport> {
    return this.auditsService.findOne(id);
  }
}
