import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LLM_SERVICE } from './llm.interface';
import { OpenAIService } from './openai.service';
import { EnhancedLLMService } from './enhanced-llm.service';

@Module({
  imports: [ConfigModule],
  providers: [
    OpenAIService,
    {
      provide: 'BASE_LLM_SERVICE',
      useClass: OpenAIService,
    },
    {
      provide: LLM_SERVICE,
      useClass: EnhancedLLMService,
    },
  ],
  exports: [LLM_SERVICE],
})
export class LlmModule {}
