import { plainToInstance, Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync, IsUrl, IsOptional } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  // Database Configuration
  @IsString()
  DATABASE_HOST: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  DATABASE_PORT: number;

  @IsString()
  DATABASE_USER: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsString()
  DATABASE_NAME: string;

  // Redis Configuration
  @IsString()
  REDIS_HOST: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  REDIS_PORT: number;

  // Authentication
  @IsString()
  JWT_SECRET: string;

  // GitHub OAuth
  @IsString()
  GITHUB_CLIENT_ID: string;

  @IsString()
  GITHUB_CLIENT_SECRET: string;

  @IsString()
  GITHUB_WEBHOOK_SECRET: string;

  // Application URLs
  @IsUrl({ require_tld: false })
  APP_URL: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  API_URL?: string;

  // LLM Configuration
  @IsString()
  OPENAI_API_KEY: string;

  @IsUrl()
  @IsOptional()
  OPENAI_API_BASE_URL?: string;

  @IsString()
  @IsOptional()
  OPENAI_API_MODEL?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }
  
  return validatedConfig;
}
