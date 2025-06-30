import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audit, AuditStatus } from './entities/audit.entity';
import { Plugin } from '../plugins/entities/plugin.entity';

export interface AuditReport {
  id: string;
  pluginId: string;
  pluginName: string;
  version: string;
  status: AuditStatus;
  isSafe: boolean;
  reportSummary: string;
  rawReport: any;
  isPublic: boolean;
  createdAt: Date;
  plugin?: {
    name: string;
    author: string;
    repoUrl: string;
    status: string;
  };
}

export interface AuditStatistics {
  totalAudits: number;
  successfulAudits: number;
  failedAudits: number;
  safePlugins: number;
  unsafePlugins: number;
  recentAudits: AuditReport[];
}

@Injectable()
export class AuditsService {
  constructor(
    @InjectRepository(Audit)
    private readonly auditsRepository: Repository<Audit>,
    @InjectRepository(Plugin)
    private readonly pluginsRepository: Repository<Plugin>,
  ) {}

  /**
   * 获取所有公开的审查报告
   */
  async findAll(limit: number = 50, offset: number = 0): Promise<AuditReport[]> {
    const audits = await this.auditsRepository.find({
      where: { isPublic: true },
      relations: ['plugin'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return audits.map(this.mapToAuditReport);
  }

  /**
   * 获取所有审查报告（包括私有的，仅供管理员使用）
   */
  async findAllIncludingPrivate(limit: number = 50, offset: number = 0): Promise<AuditReport[]> {
    const audits = await this.auditsRepository.find({
      relations: ['plugin'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return audits.map(this.mapToAuditReport);
  }

  /**
   * 根据ID获取特定审查报告
   */
  async findOne(id: string): Promise<AuditReport> {
    const audit = await this.auditsRepository.findOne({
      where: { id },
      relations: ['plugin'],
    });

    if (!audit) {
      throw new NotFoundException(`Audit report with ID ${id} not found`);
    }

    return this.mapToAuditReport(audit);
  }

  /**
   * 获取特定插件的所有公开审查报告
   */
  async findByPlugin(pluginId: string): Promise<AuditReport[]> {
    const audits = await this.auditsRepository.find({
      where: { pluginId, isPublic: true },
      relations: ['plugin'],
      order: { createdAt: 'DESC' },
    });

    return audits.map(this.mapToAuditReport);
  }

  /**
   * 获取特定插件的所有审查报告（包括私有的，仅供插件作者使用）
   */
  async findByPluginForOwner(pluginId: string): Promise<AuditReport[]> {
    const audits = await this.auditsRepository.find({
      where: { pluginId },
      relations: ['plugin'],
      order: { createdAt: 'DESC' },
    });

    return audits.map(this.mapToAuditReport);
  }

  /**
   * 获取插件信息（用于权限验证）
   */
  async getPluginById(pluginId: string): Promise<Plugin | null> {
    return this.pluginsRepository.findOne({
      where: { id: pluginId },
    });
  }

  /**
   * 获取特定插件特定版本的审查报告
   */
  async findByPluginAndVersion(pluginId: string, version: string): Promise<AuditReport | null> {
    const audit = await this.auditsRepository.findOne({
      where: { pluginId, version },
      relations: ['plugin'],
      order: { createdAt: 'DESC' },
    });

    return audit ? this.mapToAuditReport(audit) : null;
  }

  /**
   * 获取审查统计信息
   */
  async getStatistics(): Promise<AuditStatistics> {
    const [
      totalAudits,
      successfulAudits,
      failedAudits,
      safePlugins,
      unsafePlugins,
      recentAudits,
    ] = await Promise.all([
      this.auditsRepository.count(),
      this.auditsRepository.count({ where: { status: AuditStatus.SUCCESS } }),
      this.auditsRepository.count({ where: { status: AuditStatus.FAILURE } }),
      this.auditsRepository.count({ where: { isSafe: true } }),
      this.auditsRepository.count({ where: { isSafe: false } }),
      this.auditsRepository.find({
        relations: ['plugin'],
        order: { createdAt: 'DESC' },
        take: 10,
      }),
    ]);

    return {
      totalAudits,
      successfulAudits,
      failedAudits,
      safePlugins,
      unsafePlugins,
      recentAudits: recentAudits.map(this.mapToAuditReport),
    };
  }

  /**
   * 获取失败的审查报告
   */
  async findFailedAudits(limit: number = 20): Promise<AuditReport[]> {
    const audits = await this.auditsRepository.find({
      where: [
        { status: AuditStatus.FAILURE },
        { isSafe: false },
      ],
      relations: ['plugin'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return audits.map(this.mapToAuditReport);
  }

  /**
   * 创建新的审查报告
   */
  async create(auditData: {
    pluginId: string;
    version: string;
    status: AuditStatus;
    isSafe: boolean;
    reportSummary: string;
    rawReport: any;
  }): Promise<AuditReport> {
    // 自动判断报告是否应该公开
    const isPublic = this.shouldReportBePublic(auditData);

    const audit = this.auditsRepository.create({
      ...auditData,
      isPublic,
    });
    const savedAudit = await this.auditsRepository.save(audit);

    return this.findOne(savedAudit.id);
  }

  /**
   * 判断报告是否应该公开显示
   */
  private shouldReportBePublic(auditData: {
    status: AuditStatus;
    isSafe: boolean;
    rawReport: any;
  }): boolean {
    // 如果审查失败，报告不公开
    if (auditData.status === AuditStatus.FAILURE) {
      return false;
    }

    // 如果插件不安全，报告不公开
    if (!auditData.isSafe) {
      return false;
    }

    // 检查风险级别
    if (auditData.rawReport?.risk_level) {
      const riskLevel = auditData.rawReport.risk_level.toLowerCase();
      // 高风险和严重风险的报告不公开
      if (riskLevel === 'high' || riskLevel === 'critical') {
        return false;
      }
    }

    // 检查是否有安全发现
    if (auditData.rawReport?.findings && Array.isArray(auditData.rawReport.findings)) {
      // 如果有任何安全发现，报告不公开
      if (auditData.rawReport.findings.length > 0) {
        return false;
      }
    }

    // 默认情况下，安全的报告是公开的
    return true;
  }

  /**
   * 删除审查报告
   */
  async remove(id: string): Promise<void> {
    const result = await this.auditsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Audit report with ID ${id} not found`);
    }
  }

  /**
   * 将数据库实体映射为API响应格式
   */
  private mapToAuditReport(audit: Audit): AuditReport {
    return {
      id: audit.id,
      pluginId: audit.pluginId,
      pluginName: audit.plugin?.name || 'Unknown',
      version: audit.version,
      status: audit.status,
      isSafe: audit.isSafe || false,
      reportSummary: audit.reportSummary || '',
      rawReport: audit.rawReport,
      isPublic: audit.isPublic,
      createdAt: audit.createdAt,
      plugin: audit.plugin ? {
        name: audit.plugin.name,
        author: audit.plugin.author,
        repoUrl: audit.plugin.repoUrl,
        status: audit.plugin.status,
      } : undefined,
    };
  }
}
