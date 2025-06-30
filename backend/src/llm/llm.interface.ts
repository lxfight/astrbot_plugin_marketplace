export interface AuditResult {
  is_safe: boolean;
  reason: string;
  raw_report: any;
}

export const LLM_SERVICE = 'LLMService';

export interface AuditContext {
  plugin_name: string;
  source_code: string;
}

export interface LLMService {
  auditCode(context: AuditContext): Promise<AuditResult>;
}