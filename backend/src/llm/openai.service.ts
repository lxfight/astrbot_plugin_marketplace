import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMService, AuditResult, AuditContext } from './llm.interface';
import OpenAI from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as mustache from 'mustache';

interface PromptStructure {
  system_prompt: string;
  user_prompt_template: string;
}

@Injectable()
export class OpenAIService implements LLMService, OnModuleInit {
  private readonly openai: OpenAI;
  private readonly model: string;
  private prompt: PromptStructure;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      baseURL: this.configService.get<string>('OPENAI_API_BASE_URL'),
    });
    this.model = this.configService.get<string>('OPENAI_API_MODEL', 'gpt-4-turbo');
  }

  async onModuleInit() {
    const promptPath = path.join(
      __dirname,
      '..',
      'prompts',
      'security_audit.yaml',
    );
    const fileContents = await fs.readFile(promptPath, 'utf8');
    this.prompt = yaml.load(fileContents) as PromptStructure;
    console.log('Security audit prompt loaded successfully.');
  }

  async auditCode(context: AuditContext): Promise<AuditResult> {
    if (!this.prompt) {
      throw new Error('Audit prompt has not been loaded.');
    }

    const userPrompt = mustache.render(this.prompt.user_prompt_template, context);

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.prompt.system_prompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('OpenAI response content is null.');
      }
      const result = JSON.parse(content);
      return {
        is_safe: result.is_safe,
        reason: result.reason,
        raw_report: {
          ...result,
          analysis_metadata: {
            model: this.model,
            timestamp: new Date().toISOString(),
            confidence: result.confidence || 5,
            risk_level: result.risk_level || 'unknown',
            findings: result.findings || [],
          },
        },
      };
    } catch (error) {
      console.error('Error auditing code with OpenAI:', error);
      return {
        is_safe: false,
        reason: 'Failed to perform audit due to an internal error.',
        raw_report: { error: error.message },
      };
    }
  }
}