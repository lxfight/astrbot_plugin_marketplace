import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

export type UserProfile = {
  githubId: number;
  username: string;
  email?: string;
  avatarUrl?: string;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findOrCreate(
    profile: UserProfile,
    accessToken: string,
  ): Promise<User> {
    let user = await this.usersRepository.findOne({
      where: { githubId: profile.githubId },
    });

    if (user) {
      // Update access token and profile info if user exists
      user.accessToken = accessToken;
      user.username = profile.username;
      user.email = profile.email;
      user.avatarUrl = profile.avatarUrl;
    } else {
      // Create a new user if not found
      user = this.usersRepository.create({
        ...profile,
        accessToken,
      });
    }

    return this.usersRepository.save(user);
  }

  async findOneById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  /**
   * 清除用户的GitHub访问令牌
   */
  async clearAccessToken(userId: string): Promise<void> {
    await this.usersRepository.update(userId, { accessToken: undefined });
  }
}
