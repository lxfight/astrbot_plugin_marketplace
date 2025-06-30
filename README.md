# AstrBot 可信插件市场

一个基于大型语言模型(LLM)自动化安全审计的可信插件市场平台。

## 🌟 特性

- **🔒 自动化安全审计**: 使用LLM对插件代码进行全面的安全分析
- **🔄 持续监控**: 通过GitHub Webhook自动监控插件版本更新
- **👥 开发者友好**: 简单的GitHub OAuth登录和插件提交流程
- **📊 透明度**: 详细的审计报告和状态展示
- **🚀 现代技术栈**: Next.js + NestJS + PostgreSQL + Redis

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        │
                    ┌─────────────────┐                │
                    │   PostgreSQL    │                │
                    │   Database      │                │
                    └─────────────────┘                │
                              │                        │
                              ▼                        │
                    ┌─────────────────┐                │
                    │     Redis       │                │
                    │  (Task Queue)   │                │
                    └─────────────────┘                │
                              │                        │
                              ▼                        │
                    ┌─────────────────┐                │
                    │  Async Worker   │                │
                    │  (Code Audit)   │◄───────────────┘
                    └─────────────────┘
```

## 🚀 快速开始

### 前置要求

- Docker & Docker Compose
- Node.js 20+ (可选，用于本地开发)

### 1. 克隆项目

```bash
git clone <repository-url>
cd astrbot-plugin-marketplace
```

### 2. 环境配置

```bash
# 复制环境变量文件
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 编辑配置文件，设置必要的环境变量
```

### 3. GitHub OAuth设置

1. 访问 [GitHub Developer Settings](https://github.com/settings/applications/new)
2. 创建OAuth应用：
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3001/auth/github/callback`
3. 将Client ID和Secret添加到 `backend/.env`

### 4. 启动应用

```bash
# 开发环境
docker-compose -f docker-compose.dev.yml up --build

# 生产环境
docker-compose up --build
```

### 5. 访问应用

- 前端: http://localhost:3000
- 后端API: http://localhost:3001
- 健康检查: http://localhost:3001/health

## 📖 使用指南

### 对于访客

1. 访问主页浏览已审核的插件
2. 使用搜索功能查找特定插件
3. 查看插件详情和安全状态
4. 点击链接访问GitHub仓库

### 对于开发者

1. 点击"Developer Dashboard"使用GitHub登录
2. 选择要提交的仓库
3. 确保仓库根目录包含 `metadata.yaml` 文件：

```yaml
name: your_plugin_name
author: your_username
version: 1.0.0
description: 插件描述
repo: "https://github.com/username/repository"
```

4. 提交插件等待审核
5. 系统会自动安装Webhook监控版本更新

## 🔧 开发

### 项目结构

```
├── backend/                 # NestJS后端
│   ├── src/
│   │   ├── auth/           # 认证模块
│   │   ├── plugins/        # 插件管理
│   │   ├── audits/         # 审计模块
│   │   ├── llm/            # LLM服务抽象
│   │   └── users/          # 用户管理
│   └── Dockerfile
├── frontend/               # Next.js前端
│   ├── src/
│   │   ├── app/           # 页面组件
│   │   ├── components/    # 共享组件
│   │   └── utils/         # 工具函数
│   └── Dockerfile
├── docker-compose.yml     # 生产环境
├── docker-compose.dev.yml # 开发环境
└── README.md
```

### 本地开发

```bash
# 启动数据库服务
docker-compose up postgres redis

# 后端开发
cd backend
npm install
npm run start:dev

# 前端开发
cd frontend
npm install
npm run dev
```

### 运行测试

```bash
# 后端测试
cd backend
npm run test

# 前端测试
cd frontend
npm run test
```

## 🔒 安全特性

- **代码审计**: LLM分析插件源代码检测安全漏洞
- **版本监控**: 自动检测新版本并重新审计
- **访问控制**: GitHub OAuth认证和权限管理
- **数据加密**: 敏感数据加密存储
- **CORS配置**: 严格的跨域访问控制

## 📊 监控和日志

- 健康检查端点: `/health`
- 应用日志: Docker容器日志
- 数据库监控: PostgreSQL性能指标
- 任务队列: Redis队列状态

## 🤝 贡献

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如果遇到问题，请：

1. 查看 [部署指南](DEPLOYMENT.md)
2. 检查 [故障排除](DEPLOYMENT.md#故障排除) 部分
3. 提交 [Issue](../../issues)

## 🗺️ 路线图

- [ ] 插件评分和评论系统
- [ ] 更多LLM提供商支持
- [ ] 插件依赖分析
- [ ] API文档自动生成
- [ ] 插件使用统计
- [ ] 多语言支持
