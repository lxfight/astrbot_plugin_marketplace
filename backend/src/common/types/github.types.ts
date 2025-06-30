export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
  };
  html_url: string;
  clone_url: string;
  ssh_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

export interface GitHubCommit {
  id: string;
  message: string;
  timestamp: string;
  author: {
    name: string;
    email: string;
    username?: string;
  };
  modified?: string[];
  added?: string[];
  removed?: string[];
}

export interface GitHubWebhookPayload {
  ref: string;
  before: string;
  after: string;
  repository: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    clone_url: string;
    owner: {
      name: string;
      login: string;
      id: number;
    };
  };
  commits?: GitHubCommit[];
  head_commit?: GitHubCommit;
  pusher: {
    name: string;
    email: string;
  };
}

export interface PluginMetadata {
  name: string;
  author: string;
  version: string;
  description: string;
  repo: string;
  dependencies?: string[];
  tags?: string[];
  license?: string;
}

// 原始元数据接口，支持简写和全称字段
export interface RawPluginMetadata {
  // 名称字段 - 支持简写和全称
  name?: string;
  plugin_name?: string;

  // 描述字段 - 支持简写和全称
  desc?: string;
  description?: string;
  summary?: string;

  // 版本字段 - 支持简写和全称
  version?: string;
  ver?: string;
  plugin_version?: string;

  // 作者字段 - 支持简写和全称
  author?: string;
  authors?: string | string[];
  creator?: string;
  maintainer?: string;

  // 仓库字段 - 支持简写和全称
  repo?: string;
  repository?: string;
  url?: string;
  git_url?: string;
  github?: string;

  // 可选字段
  dependencies?: string[] | string;
  deps?: string[] | string;
  requirements?: string[] | string;

  tags?: string[] | string;
  keywords?: string[] | string;
  categories?: string[] | string;

  license?: string;
  licence?: string;

  // 其他可能的字段
  help?: string;
  usage?: string;
  commands?: string[] | string;
}
