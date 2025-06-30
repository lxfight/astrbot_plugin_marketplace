import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async githubLogin(code: string): Promise<{ accessToken: string }> {
    const accessToken = await this.getGithubAccessToken(code);
    const githubUser = await this.getGithubUser(accessToken);

    const user = await this.usersService.findOrCreate(
      {
        githubId: githubUser.id,
        username: githubUser.login,
        email: githubUser.email,
        avatarUrl: githubUser.avatar_url,
      },
      accessToken,
    );

    const jwtPayload = { sub: user.id, username: user.username };
    const jwt = await this.jwtService.signAsync(jwtPayload);

    return { accessToken: jwt };
  }

  private async getGithubAccessToken(code: string): Promise<string> {
    const url = 'https://github.com/login/oauth/access_token';
    const backendUrl = this.configService.get<string>('API_URL');
    const redirect_uri = `${backendUrl}/auth/github/callback`;
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          url,
          {
            client_id: this.configService.get<string>('GITHUB_CLIENT_ID'),
            client_secret: this.configService.get<string>(
              'GITHUB_CLIENT_SECRET',
            ),
            code,
            redirect_uri,
          },
          {
            headers: { Accept: 'application/json' },
          },
        ),
      );
      if (response.data.error) {
        throw new Error(response.data.error_description);
      }
      return response.data.access_token;
    } catch (error) {
      console.error('GitHub Access Token Error:', error.response?.data || error.message);
      throw new UnauthorizedException(
        'Failed to get GitHub access token',
        error.response?.data?.error_description || error.message,
      );
    }
  }

  private async getGithubUser(accessToken: string): Promise<any> {
    const url = 'https://api.github.com/user';
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      return response.data;
    } catch (error) {
      throw new UnauthorizedException(
        'Failed to get user from GitHub',
        error.message,
      );
    }
  }

  /**
   * 撤销GitHub访问令牌并清除用户的访问令牌
   */
  async logout(userId: string): Promise<void> {
    try {
      // 获取用户信息
      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // 撤销GitHub访问令牌
      if (user.accessToken) {
        await this.revokeGithubAccessToken(user.accessToken);
      }

      // 清除数据库中的访问令牌
      await this.usersService.clearAccessToken(userId);
    } catch (error) {
      console.error('Logout error:', error);
      // 即使撤销失败，也要清除数据库中的令牌
      await this.usersService.clearAccessToken(userId);
    }
  }

  /**
   * 撤销GitHub访问令牌
   */
  private async revokeGithubAccessToken(accessToken: string): Promise<void> {
    const url = `https://api.github.com/applications/${this.configService.get<string>('GITHUB_CLIENT_ID')}/token`;

    try {
      await firstValueFrom(
        this.httpService.delete(url, {
          headers: {
            'Authorization': `Basic ${Buffer.from(
              `${this.configService.get<string>('GITHUB_CLIENT_ID')}:${this.configService.get<string>('GITHUB_CLIENT_SECRET')}`
            ).toString('base64')}`,
            'Accept': 'application/vnd.github.v3+json',
          },
          data: {
            access_token: accessToken,
          },
        }),
      );
      console.log('GitHub access token revoked successfully');
    } catch (error) {
      console.error('Failed to revoke GitHub access token:', error.response?.data || error.message);
      // 不抛出错误，因为即使撤销失败，我们也要清除本地令牌
    }
  }
}
