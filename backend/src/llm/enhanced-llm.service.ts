import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMService, AuditResult, AuditContext, LLM_SERVICE } from './llm.interface';

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  timeoutMs: number;
}

interface RetryAttempt {
  attempt: number;
  error: Error;
  delayMs: number;
  timestamp: Date;
}

@Injectable()
export class EnhancedLLMService implements LLMService {
  private readonly retryConfig: RetryConfig;

  constructor(
    @Inject('BASE_LLM_SERVICE') private readonly baseLLMService: LLMService,
    private readonly configService: ConfigService,
  ) {
    this.retryConfig = {
      maxRetries: this.configService.get<number>('LLM_MAX_RETRIES', 3),
      baseDelayMs: this.configService.get<number>('LLM_BASE_DELAY_MS', 1000),
      maxDelayMs: this.configService.get<number>('LLM_MAX_DELAY_MS', 30000),
      backoffMultiplier: this.configService.get<number>('LLM_BACKOFF_MULTIPLIER', 2),
      timeoutMs: this.configService.get<number>('LLM_TIMEOUT_MS', 300000), // 5分钟
    };
  }

  async auditCode(context: AuditContext): Promise<AuditResult> {
    const startTime = Date.now();
    const attempts: RetryAttempt[] = [];

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        console.log(`LLM audit attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1} for plugin: ${context.plugin_name}`);

        // 检查总超时
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime > this.retryConfig.timeoutMs) {
          throw new Error(`LLM audit timeout after ${elapsedTime}ms (max: ${this.retryConfig.timeoutMs}ms)`);
        }

        // 为单次调用设置超时
        const remainingTime = this.retryConfig.timeoutMs - elapsedTime;
        const singleCallTimeout = Math.min(remainingTime, 120000); // 单次调用最多2分钟

        const result = await this.executeWithTimeout(
          () => this.baseLLMService.auditCode(context),
          singleCallTimeout
        );

        // 成功时记录统计信息
        const totalTime = Date.now() - startTime;
        console.log(`LLM audit completed successfully for ${context.plugin_name} in ${totalTime}ms after ${attempt + 1} attempts`);

        return {
          ...result,
          raw_report: {
            ...result.raw_report,
            retry_metadata: {
              total_attempts: attempt + 1,
              total_time_ms: totalTime,
              attempts: attempts,
              success: true,
            },
          },
        };

      } catch (error) {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;

        // 记录失败尝试
        const retryAttempt: RetryAttempt = {
          attempt: attempt + 1,
          error: error instanceof Error ? error : new Error(String(error)),
          delayMs: 0,
          timestamp: new Date(currentTime),
        };

        attempts.push(retryAttempt);

        console.error(`LLM audit attempt ${attempt + 1} failed for ${context.plugin_name}:`, error.message);

        // 如果是最后一次尝试或者超时，直接失败
        if (attempt === this.retryConfig.maxRetries || elapsedTime > this.retryConfig.timeoutMs) {
          console.error(`LLM audit failed permanently for ${context.plugin_name} after ${attempt + 1} attempts and ${elapsedTime}ms`);
          
          return {
            is_safe: false,
            reason: `LLM audit failed after ${attempt + 1} attempts: ${error.message}`,
            raw_report: {
              error: error.message,
              retry_metadata: {
                total_attempts: attempt + 1,
                total_time_ms: elapsedTime,
                attempts: attempts,
                success: false,
                final_error: error.message,
              },
            },
          };
        }

        // 计算指数退避延迟
        const delayMs = this.calculateBackoffDelay(attempt);
        retryAttempt.delayMs = delayMs;

        console.log(`Retrying LLM audit for ${context.plugin_name} in ${delayMs}ms (attempt ${attempt + 2}/${this.retryConfig.maxRetries + 1})`);

        // 等待指数退避延迟
        await this.sleep(delayMs);
      }
    }

    // 这里不应该到达，但为了类型安全
    throw new Error('Unexpected end of retry loop');
  }

  /**
   * 计算指数退避延迟
   */
  private calculateBackoffDelay(attempt: number): number {
    const exponentialDelay = this.retryConfig.baseDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attempt);
    
    // 添加随机抖动 (±25%)
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
    const delayWithJitter = exponentialDelay + jitter;
    
    // 确保不超过最大延迟
    return Math.min(Math.max(delayWithJitter, this.retryConfig.baseDelayMs), this.retryConfig.maxDelayMs);
  }

  /**
   * 为异步操作添加超时
   */
  private async executeWithTimeout<T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * 睡眠指定毫秒数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 检查错误是否可重试
   */
  private isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      /timeout/i,
      /rate limit/i,
      /too many requests/i,
      /service unavailable/i,
      /internal server error/i,
      /bad gateway/i,
      /gateway timeout/i,
      /connection/i,
      /network/i,
      /ECONNRESET/i,
      /ENOTFOUND/i,
      /ETIMEDOUT/i,
    ];

    const errorMessage = error.message.toLowerCase();
    return retryablePatterns.some(pattern => pattern.test(errorMessage));
  }
}
