import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Headers,
  RawBodyRequest,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { PluginsService } from './plugins.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubmitPluginDto } from './dto/submit-plugin.dto';
import { PluginStatus } from './entities/plugin.entity';

@Controller('plugins')
export class PluginsController {
  constructor(private readonly pluginsService: PluginsService) {}

  @Get('public')
  async getPublicPlugins() {
    return this.pluginsService.findAllPublic();
  }

  @UseGuards(JwtAuthGuard)
  @Get('github/repos')
  async getGithubRepos(@Request() req) {
    // req.user is populated by JwtStrategy.validate
    return this.pluginsService.getGithubRepos(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user')
  async getUserPlugins(@Request() req) {
    return this.pluginsService.findByUserId(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('submit')
  async submit(@Request() req, @Body() submitPluginDto: SubmitPluginDto) {
    return this.pluginsService.submit(
      req.user.id,
      submitPluginDto.repoUrl,
    );
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
    @Body() payload: any,
    @Request() req: RawBodyRequest<any>,
  ) {
    if (event === 'push') {
      if (!req.rawBody) {
        throw new BadRequestException('Raw body not available.');
      }
      // The service will handle signature verification and processing
      await this.pluginsService.handlePushEvent(signature, req.rawBody, payload);
    }
    return;
  }

  /**
   * 自动创建AstrBot仓库的Issue
   */
  @UseGuards(JwtAuthGuard)
  @Post(':pluginId/create-issue')
  async createAstrBotIssue(@Param('pluginId') pluginId: string, @Request() req: any) {
    // 获取插件信息
    const plugin = await this.pluginsService.findOne(pluginId);
    if (!plugin) {
      throw new BadRequestException('Plugin not found');
    }

    // 检查是否是插件的所有者
    if (plugin.publisherId !== req.user.id) {
      throw new BadRequestException('You can only create issues for your own plugins');
    }

    // 检查插件状态
    if (plugin.status !== PluginStatus.APPROVED) {
      throw new BadRequestException('Only approved plugins can create AstrBot issues');
    }

    const result = await this.pluginsService.createAstrBotIssue(plugin);
    return {
      success: true,
      data: result,
      message: 'AstrBot issue created successfully'
    };
  }

  /**
   * 获取手动提交Issue的URL
   */
  @UseGuards(JwtAuthGuard)
  @Get(':pluginId/manual-issue-url')
  async getManualIssueUrl(@Param('pluginId') pluginId: string, @Request() req: any) {
    // 获取插件信息
    const plugin = await this.pluginsService.findOne(pluginId);
    if (!plugin) {
      throw new BadRequestException('Plugin not found');
    }

    // 检查是否是插件的所有者
    if (plugin.publisherId !== req.user.id) {
      throw new BadRequestException('You can only get issue URLs for your own plugins');
    }

    // 检查插件状态
    if (plugin.status !== PluginStatus.APPROVED) {
      throw new BadRequestException('Only approved plugins can create AstrBot issues');
    }

    const issueUrl = this.pluginsService.generateManualIssueUrl(plugin);
    return {
      success: true,
      data: { issueUrl },
      message: 'Manual issue URL generated successfully'
    };
  }
}
