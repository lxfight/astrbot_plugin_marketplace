import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { GPGService } from './gpg.service';
import { GPGController } from './gpg.controller';
import { GPGKey } from './entities/gpg-key.entity';
import { PluginSignature } from './entities/plugin-signature.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GPGKey, PluginSignature]),
    HttpModule,
  ],
  controllers: [GPGController],
  providers: [GPGService],
  exports: [GPGService],
})
export class GPGModule {}
