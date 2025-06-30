import { Controller, Get, Query, Res, Post, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
    ) { }

    @Get('github/login')
    githubLogin(@Res() res: Response) {
        const GITHUB_CLIENT_ID = this.configService.get<string>('GITHUB_CLIENT_ID');
        const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo,user:email`;
        res.redirect(url);
    }

    @Get('github/callback')
    async githubCallback(
      @Query('code') code: string,
      @Res() res: Response,
    ) {
      const { accessToken } = await this.authService.githubLogin(code);
      const frontendUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
      // Redirect to the frontend dashboard with the token
      res.redirect(`${frontendUrl}/dashboard?token=${accessToken}`);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    async logout(@Req() req: Request, @Res() res: Response) {
      try {
        const user = req.user as any;
        // 撤销GitHub访问令牌并清除数据库中的令牌
        await this.authService.logout(user.userId);
        res.json({ message: 'Logged out successfully' });
      } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Logout failed', error: error.message });
      }
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Req() req: Request) {
      const reqUser = req.user as any;
      const user = await this.usersService.findById(reqUser.userId);
      if (!user) {
        throw new UnauthorizedException();
      }
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatarUrl, // 转换字段名
        github_id: user.githubId,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      };
    }
}
