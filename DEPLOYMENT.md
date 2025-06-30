# AstrBot Plugin Marketplace - 部署指南

## 快速开始

### 1. 环境要求

- Docker & Docker Compose
- Node.js 20+ (用于本地开发)
- PostgreSQL 15+ (如果不使用Docker)
- Redis 7+ (如果不使用Docker)

### 2. 环境配置

#### 后端环境变量

复制环境变量示例文件：
```bash
cp backend/.env.example backend/.env
```

编辑 `backend/.env` 文件，配置以下关键变量：

```bash
# 数据库配置
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=astrbot_plugins

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379

# 认证配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# GitHub OAuth应用配置
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_WEBHOOK_SECRET=your-super-secret-webhook-key

# 应用URL配置
APP_URL=http://localhost:3000
API_URL=http://localhost:3001

# LLM服务配置
OPENAI_API_KEY=your-openai-api-key
OPENAI_API_BASE_URL=https://api.openai.com/v1
OPENAI_API_MODEL=gpt-4-turbo

# 环境
NODE_ENV=development
```

#### 前端环境变量

复制环境变量示例文件：
```bash
cp frontend/.env.example frontend/.env.local
```

编辑 `frontend/.env.local` 文件：

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=AstrBot Plugin Marketplace
```

### 3. GitHub OAuth应用设置

1. 访问 [GitHub Developer Settings](https://github.com/settings/applications/new)
2. 创建新的OAuth应用：
   - **Application name**: AstrBot Plugin Marketplace
   - **Homepage URL**: `http://localhost:3000` (开发环境)
   - **Authorization callback URL**: `http://localhost:3001/auth/github/callback`
3. 获取 Client ID 和 Client Secret，更新到 `.env` 文件

### 4. 启动应用

#### 使用Docker Compose (推荐)

```bash
# 开发环境
docker-compose -f docker-compose.dev.yml up --build

# 生产环境
docker-compose up --build
```

#### 手动启动 (开发环境)

1. 启动数据库和Redis：
```bash
docker-compose up postgres redis
```

2. 启动后端：
```bash
cd backend
npm install
npm run start:dev
```

3. 启动前端：
```bash
cd frontend
npm install
npm run dev
```

### 5. 数据库初始化

如果使用手动部署，需要初始化数据库：

```bash
# 连接到PostgreSQL
psql -h localhost -U postgres -d astrbot_plugins

# 执行初始化脚本
\i backend/src/database/migrations/001-initial-schema.sql
```

### 6. 验证部署

1. 访问健康检查端点：
   - 后端: http://localhost:3001/health
   - 前端: http://localhost:3000

2. 测试GitHub OAuth登录流程

3. 检查日志输出确保没有错误

## 生产环境部署

### 1. 环境变量调整

生产环境需要修改以下配置：

```bash
# 生产环境
NODE_ENV=production

# 使用实际域名
APP_URL=https://your-domain.com
API_URL=https://api.your-domain.com

# 使用强密码
JWT_SECRET=your-very-secure-jwt-secret
DATABASE_PASSWORD=your-very-secure-db-password
GITHUB_WEBHOOK_SECRET=your-very-secure-webhook-secret

# 数据库配置
DATABASE_HOST=your-db-host
REDIS_HOST=your-redis-host
```

### 2. 安全配置

1. 使用HTTPS
2. 配置防火墙规则
3. 定期更新依赖包
4. 监控日志和性能

### 3. 备份策略

1. 定期备份PostgreSQL数据库
2. 备份环境配置文件
3. 监控磁盘空间使用

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务是否运行
   - 验证连接参数
   - 检查网络连接

2. **GitHub OAuth失败**
   - 验证Client ID和Secret
   - 检查回调URL配置
   - 确认应用权限设置

3. **LLM API调用失败**
   - 验证API密钥
   - 检查网络连接
   - 确认API配额

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs backend
docker-compose logs postgres
```

### 重置环境

```bash
# 停止所有服务
docker-compose down

# 清理数据卷 (注意：会删除所有数据)
docker-compose down -v

# 重新构建和启动
docker-compose up --build
```
