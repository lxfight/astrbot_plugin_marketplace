import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plugin } from './entities/plugin.entity';
import { PluginsService } from './plugins.service';
import { PluginsController } from './plugins.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plugin]),
    AuthModule,
    UsersModule,
    HttpModule,
    BullModule.registerQueue({
      name: 'audit-queue',
    }),
  ],
  controllers: [PluginsController],
  providers: [PluginsService],
})
export class PluginsModule {}
