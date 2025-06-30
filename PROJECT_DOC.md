# **AstrBot 可信插件市场：项目构建文档**

## 1. 详细任务要求 (Detailed Task Requirements)

### 1.1 项目愿景与目标

**愿景 (Vision):**
打造一个行业领先的、最值得信赖的 AstrBot 插件生态系统。通过引入基于大型语言模型 (LLM) 的自动化代码安全审计，我们旨在消除用户在安装第三方插件时的安全顾虑，同时为优秀的插件开发者提供一个展示其高质量作品的官方渠道。

**核心目标 (Goals):**
1.  **建立信任:** 为最终用户提供一个所有插件都经过基础安全审查的平台，使其成为发现和下载插件的首选渠道。
2.  **赋能开发者:** 为插件开发者提供一个简单、自动化的提交流程，并通过可信认证帮助他们获得更多用户。
3.  **提升生态安全:** 建立一个自动化的、持续的安全监控机制，能够在新版本发布时自动检测潜在风险（如后门、恶意代码），并快速响应，从而保障整个插件生态的健康发展。
4.  **实现平台化:** 构建一个可扩展的基础设施，为未来更多的开发者服务和社区功能打下坚实基础。

### 1.2 用户画像与故事

#### 1.2.1 访客 (Visitor)

*   **画像:** 希望为自己的 AstrBot 寻找新功能，但缺乏深度技术背景来审查代码安全性的普通用户。他们关心功能是否强大、使用是否方便，但更关心是否会引入安全风险。
*   **用户故事:**
    *   **As a visitor,** I want to browse plugins by categories (e.g., "效率工具", "数据分析") or search by keywords, **so that** I can quickly find the tools I need.
    *   **As a visitor,** I want to see a clear "security-audited" badge and a summary of the audit on each plugin's page, **so that** I can feel confident about its safety before downloading.
    *   **As a visitor,** I want to view the plugin's description, version history, author, and a link to its GitHub repository, **so that** I can get all the necessary information in one place.

#### 1.2.2 插件开发者 (Developer)

*   **画像:** 具备一定开发能力，为 AstrBot 创建了实用插件，并希望与社区分享的个人或团队开发者。他们希望有一个简单的发布流程，并获得社区的认可。
*   **用户故事:**
    *   **As a developer,** I want to log in using my GitHub account, **so that** I don't have to manage another set of credentials.
    *   **As a developer,** I want to submit my plugin by simply selecting its GitHub repository, **so that** the platform can automatically fetch its metadata and code for auditing.
    *   **As a developer,** I want the platform to automatically audit new versions of my plugin when I push updates, **so that** I can ensure continuous compliance and user trust without manual intervention.
    *   **As a developer,** if my plugin fails a security audit, I want to receive an immediate and detailed notification (e.g., via email or a GitHub Issue) explaining the problem, **so that** I can fix it quickly.

### 1.3 核心功能点 (Features)

#### 1.3.1 公开插件市场
*   **插件列表与搜索:** 提供分页的插件列表，支持按名称、作者或描述进行模糊搜索。
*   **插件详情页:** 展示从 `metadata.yaml` 和 GitHub API 获取的详细信息，包括：名称、作者、版本、描述、GitHub 仓库链接、Star/Fork 数量、最后更新时间。
*   **安全审计状态:** 在列表和详情页明确展示插件的当前状态：`已审核 (Audited)`、`审核中 (Pending)`、`已下架 (Delisted)`。
*   **审计报告摘要:** 对于已审核的插件，提供一个由 LLM 生成的、对普通用户友好的安全评估摘要。

#### 1.3.2 开发者中心
*   **GitHub OAuth 登录:** 使用 GitHub OAuth 2.0 实现安全、便捷的开发者身份认证。
*   **插件提交:** 开发者登录后，系统通过 GitHub API 拉取其拥有的仓库列表。开发者选择一个仓库进行提交。系统将进行初步校验，检查根目录下是否存在 `metadata.yaml` 文件。
*   **插件管理仪表盘:** 展示开发者已提交的所有插件及其当前状态、版本号和上次审核时间。
*   **下架通知查阅:** 开发者可以在此查看其插件被下架的历史记录和详细的 LLM 分析报告。

#### 1.3.3 自动化审核引擎
*   **首次提交审核:** 接收到新插件提交后，触发一个后台异步任务，克隆仓库代码，调用 LLM 服务进行全面审计。
*   **Webhook 自动配置:** 首次审核成功后，系统通过 GitHub API 自动为该插件的仓库安装一个 Webhook，监听 `push` 事件。
*   **增量版本审核:** 当 Webhook 接收到 `push` 事件后，系统检查 `metadata.yaml` 文件中的 `version` 字段。如果版本号高于数据库中记录的最新版本，则触发对新版本的后台异步审核。
*   **自动下架机制:** 如果新版本的审计结果发现严重安全问题，系统自动将该插件的状态更新为 `delisted`，并从公开市场中隐藏。

#### 1.3.4 通知系统
*   **邮件通知:** 当插件状态发生重要变更（如审核通过、审核失败、被下架）时，向开发者注册的邮箱发送通知。
*   **GitHub Issue 通知:** 当插件因安全问题被下架时，系统自动使用开发者授权的 Token，在其原仓库中创建一个 GitHub Issue，详细说明下架原因并附上 LLM 的分析报告。这提供了最直接、最透明的沟通渠道。

### 1.4 非功能性要求

*   **1.4.1 安全性 (Security):**
    *   平台自身必须安全，特别是要加密存储用户的 GitHub Access Token。
    *   与 GitHub API 的交互必须使用 HTTPS。
    *   Webhook 载荷必须进行签名验证，防止恶意调用。
    *   请求 GitHub API 的权限范围 (scope) 应遵循最小权限原则。
*   **1.4.2 性能 (Performance):**
    *   所有面向用户的 Web 接口响应时间应在 200ms 以内。
    *   代码克隆、分析和 LLM 调用等耗时操作必须在后台异步执行，不能阻塞 API 响应。
    *   前端页面应进行优化，实现快速加载。
*   **1.4.3 可靠性 (Reliability):**
    *   异步任务队列应具备失败重试机制。
    *   系统应有完善的日志记录，方便追踪和调试问题。
    *   核心服务（Web 应用、数据库、任务队列）应保证 99.9% 的可用性。

## 2. 技术实现方案 (Technical Implementation Plan)

### 2.1 推荐技术栈

*   **前端 (Frontend):** **Next.js (React)** - 提供优秀的开发体验和 SEO 友好的服务端渲染能力，适合构建公开市场。
*   **后端 (Backend):** **NestJS (Node.js/TypeScript)** - 采用模块化、可扩展的架构，与前端技术栈统一，便于团队协作。内置的依赖注入系统非常适合实现服务抽象。
*   **数据库 (Database):** **PostgreSQL** - 功能强大、稳定可靠的关系型数据库，足以应对当前业务的数据结构。
*   **任务队列 (Task Queue):** **Redis + BullMQ** - 高性能的内存数据库 Redis 作为消息代理，结合 BullMQ 库在 Node.js 生态中实现强大且易于管理的后台任务队列。
*   **部署 (Deployment):**
    *   **Frontend:** **Vercel** - 与 Next.js 无缝集成，提供全球 CDN 和自动化的 CI/CD。
    *   **Backend & Services:** **Docker** + **AWS/GCP** - 将后端应用、数据库和 Redis 容器化，便于在云平台上进行弹性部署和管理。

### 2.2 系统架构设计

#### 2.2.1 整体架构图

\`\`\`
+----------------+      +----------------------+      +--------------------+
|     Visitor/   |      |                      |      |                    |
|    Developer   +----->+  Frontend (Next.js)  +----->+  Backend (NestJS)  |
+----------------+      |      (Vercel)        |      | (AWS/GCP - Docker) |
                        +----------------------+      +---------+----------+
                                                                |
                                                                | (API Calls)
                                                                |
+-------------------------+      +------------------+      +----+----+
| GitHub API              |      | LLM Service      |      |  Redis  |
| (OAuth, Repos, Webhook) |<-----+ (OpenAI, etc.)   |<-----+ (BullMQ)|
+-------------------------+      +------------------+      +----+----+
                                                                | (Jobs)
                                                                |
                                                      +---------+----------+
                                                      | Asynchronous Worker|
                                                      | (Node.js Process)  |
                                                      +--------------------+
\`\`\`

#### 2.2.2 组件说明

*   **Frontend (Next.js):** 负责用户交互界面，包括插件市场、详情页和开发者中心。通过 API 与后端通信。
*   **Backend (NestJS):** 核心业务逻辑层。处理 API 请求、用户认证、与数据库交互，并将耗时任务推送到任务队列。
*   **Redis (BullMQ):** 作为消息代理和任务队列的存储。解耦 Web 服务和后台耗时任务，保证 API 的快速响应。
*   **Asynchronous Worker:** 一个或多个独立的 Node.js 进程，负责从 Redis 队列中消费任务（如代码审计），并与外部 API (GitHub, LLM) 交互。
*   **PostgreSQL:** 持久化存储所有业务数据。
*   **外部服务 (External Services):** GitHub API 和 LLM API。

### 2.3 核心模块设计

#### 2.3.1 用户认证模块 (GitHub OAuth)
1.  前端引导用户点击“使用 GitHub 登录”按钮，跳转至 GitHub 授权页面。
2.  用户授权后，GitHub 重定向回后端指定的回调 URL，并附带一个 \`code\`。
3.  后端用 \`code\`、\`client_id\` 和 \`client_secret\` 向 GitHub 换取 \`access_token\`。
4.  后端使用 \`access_token\` 获取用户基本信息（GitHub ID, username, email）。
5.  在 \`Users\` 表中查找或创建用户记录，**加密存储** \`access_token\`。
6.  生成一个 JWT (JSON Web Token) 返回给前端，用于后续的身份验证。

#### 2.3.2 插件提交流程模块
1.  开发者在前端点击“提交插件”。
2.  前端使用 JWT 调用后端 API \`/api/github/repos\`。
3.  后端解密并使用当前用户的 \`access_token\` 调用 GitHub API，获取该用户的所有仓库。
4.  前端展示仓库列表，用户选择一个进行提交。
5.  前端将选定的仓库信息（如 \`repo_full_name\`）发送到后端 API \`/api/plugins/submit\`。
6.  后端创建一条新的 \`Plugins\` 记录，状态为 \`pending\`，并向 BullMQ 推送一个 \`InitialAudit\` 任务。

#### 2.3.3 异步审核 Worker 模块
1.  Worker 进程监听 \`InitialAudit\` 和 \`VersionAudit\` 队列。
2.  **接收任务后执行:**
    a. 从任务载荷中获取 \`repo_url\` 和 \`plugin_id\`。
    b. 使用 \`git clone\` 将仓库代码克隆到临时目录。
    c. 读取并解析根目录下的 \`metadata.yaml\`。若不存在或格式错误，则更新插件状态为 \`failed\` 并记录原因。
    d. 遍历仓库中的所有源代码文件（如 \`.py\`, \`.js\`），拼接成一个大的文本块。
    e. 调用 **LLM 审核服务抽象层**，传入代码文本和预设的 "Security Audit Prompt"。
    f. **处理 LLM 结果:** 解析 LLM 返回的 JSON，判断是否存在严重安全问题。
    g. **更新数据库:**
        *   在 \`Audits\` 表中创建一条详细的审计记录。
        *   根据审计结果更新 \`Plugins\` 表的状态为 \`approved\` 或 \`delisted\`。
    h. **首次审核通过的特殊流程:** 如果是 \`InitialAudit\` 且审核通过，则调用 GitHub API 为该仓库安装 Webhook。
    i. **触发通知:** 调用通知模块，发送邮件或创建 GitHub Issue。
    j. 清理临时克隆的仓库文件。

#### 2.3.4 LLM 审核服务抽象层
这是确保系统可扩展性的关键。

\`\`\`typescript
// src/llm/llm.interface.ts
export interface AuditResult {
  is_safe: boolean;
  reason: string;
  raw_report: any;
}

export interface LLMService {
  auditCode(code: string): Promise<AuditResult>;
}

// src/llm/openai.service.ts
import { LLMService, AuditResult } from './llm.interface';

export class OpenAIService implements LLMService {
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async auditCode(code: string): Promise<AuditResult> {
    const prompt = \`Analyze the following code for security vulnerabilities...\`; // 详细的 Prompt
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'system', content: prompt }, { role: 'user', content: code }],
      response_format: { type: "json_object" },
    });
    // ... 解析 response 并返回 AuditResult
  }
}

// src/llm/llm.provider.ts (使用 NestJS 的依赖注入)
@Injectable()
export class LLMProvider {
  constructor(private readonly llmService: LLMService) {}

  async performAudit(code: string): Promise<AuditResult> {
    return this.llmService.auditCode(code);
  }
}
\`\`\`
通过依赖注入，我们可以在应用的主模块中轻松切换 \`LLMService\` 的实现（\`OpenAIService\`, \`ClaudeService\` 等）。

#### 2.3.5 GitHub Webhook 监听与处理模块
1.  创建一个公开的后端 API 端点，如 \`/api/webhooks/github\`。
2.  接收到请求后，首先使用 \`secret\` 验证 \`X-Hub-Signature-256\` 头，确保请求来自 GitHub。
3.  检查 \`X-GitHub-Event\` 头是否为 \`push\`。
4.  解析请求体 (payload)，获取仓库 ID 和 \`ref\`（确保是推送到主分支）。
5.  从 payload 中找到 \`modified\` 文件列表，检查 \`metadata.yaml\` 是否在其中。
6.  如果 \`metadata.yaml\` 被修改，则通过 GitHub API 获取其最新内容。
7.  解析 YAML，提取 \`version\` 字段。
8.  查询数据库中该插件的最新审核版本。
9.  如果新版本号 > 旧版本号，则向 BullMQ 推送一个 \`VersionAudit\` 任务。
10. 无论是否触发审核，都立即返回 \`200 OK\` 响应给 GitHub。

### 2.4 数据模型设计 (数据库表结构)

#### 2.4.1 \`Users\` 表
*   \`id\` (PK, UUID)
*   \`github_id\` (Integer, Unique, Not Null)
*   \`username\` (Varchar, Not Null)
*   \`email\` (Varchar)
*   \`avatar_url\` (Varchar)
*   \`access_token\` (Varchar, Encrypted, Not Null)
*   \`created_at\` (Timestamp)
*   \`updated_at\` (Timestamp)

#### 2.4.2 \`Plugins\` 表
*   \`id\` (PK, UUID)
*   \`user_id\` (FK to Users.id)
*   \`name\` (Varchar, Not Null)
*   \`author\` (Varchar, Not Null)
*   \`repo_url\` (Varchar, Unique, Not Null)
*   \`description\` (Text)
*   \`latest_version\` (Varchar)
*   \`status\` (Enum: \`pending\`, \`approved\`, \`delisted\`, \`failed\`, Not Null)
*   \`webhook_id\` (Integer) - 存储 GitHub 返回的 Webhook ID
*   \`created_at\` (Timestamp)
*   \`updated_at\` (Timestamp)

#### 2.4.3 \`Audits\` 表
*   \`id\` (PK, UUID)
*   \`plugin_id\` (FK to Plugins.id)
*   \`version\` (Varchar, Not Null)
*   \`status\` (Enum: \`success\`, \`failure\`, Not Null)
*   \`is_safe\` (Boolean)
*   \`report_summary\` (Text) - LLM 生成的简要报告
*   \`raw_report\` (JSONB) - LLM 返回的完整原始报告
*   \`created_at\` (Timestamp)

### 2.5 关键流程数据流图

#### 2.5.1 开发者首次提交插件流程
\`\`\`mermaid
sequenceDiagram
    participant Dev as Developer
    participant FE as Frontend (Next.js)
    participant BE as Backend (NestJS)
    participant DB as PostgreSQL
    participant Q as Queue (Redis)
    participant W as Worker

    Dev->>FE: 1. Clicks "Submit Plugin" & Selects Repo
    FE->>BE: 2. POST /api/plugins/submit (repo_url)
    BE->>DB: 3. INSERT INTO Plugins (status='pending')
    BE->>Q: 4. Enqueue "InitialAudit" job
    BE-->>FE: 5. { success: true }
    W->>Q: 6. Dequeue "InitialAudit" job
    W->>GitHub: 7. Clone repository
    W->>LLM: 8. Send code for audit
    LLM-->>W: 9. Return audit report
    W->>DB: 10. INSERT INTO Audits & UPDATE Plugins (status='approved')
    W->>GitHub: 11. Install Webhook for the repo
    W->>Notification: 12. Send "Approved" email to Dev
\`\`\`

#### 2.5.2 插件版本更新自动审核流程
\`\`\`mermaid
sequenceDiagram
    participant Dev as Developer
    participant GitHub as GitHub
    participant BE as Backend (NestJS)
    participant DB as PostgreSQL
    participant Q as Queue (Redis)
    participant W as Worker

    Dev->>GitHub: 1. git push (with new version in metadata.yaml)
    GitHub->>BE: 2. POST /api/webhooks/github (Webhook Payload)
    BE->>BE: 3. Verify signature
    BE->>GitHub: 4. Get latest metadata.yaml
    BE->>DB: 5. Compare version with Plugins.latest_version
    alt New Version Detected
        BE->>Q: 6. Enqueue "VersionAudit" job
    end
    BE-->>GitHub: 7. 200 OK
    W->>Q: 8. Dequeue "VersionAudit" job
    W->>GitHub: 9. Clone repository
    W->>LLM: 10. Send code for audit
    LLM-->>W: 11. Return audit report (result: unsafe)
    W->>DB: 12. INSERT INTO Audits & UPDATE Plugins (status='delisted')
    W->>Notification: 13. Create GitHub Issue & Send "Delisted" email
\`\`\`

## 3. 快速部署指南 (Quick Start Guide)

本项目已完全容器化，您可以使用 Docker 和 Docker Compose 实现一键部署。

### 3.1 先决条件

*   **Docker:** [https://www.docker.com/get-started](https://www.docker.com/get-started)
*   **Docker Compose:** (通常随 Docker Desktop 一起安装)

### 3.2 环境变量配置

在启动前，请确保项目根目录下的 `backend/.env` 文件已根据您的环境正确配置，特别是以下部分：

*   `DATABASE_*`: 数据库连接信息。`docker-compose.yml` 会使用这些变量来初始化 PostgreSQL 服务。
*   `GITHUB_*`: 您的 GitHub OAuth 应用程序的凭证。
*   `OPENAI_*`: 您的 LLM 服务提供商的 API 密钥和配置。

### 3.3 启动应用

在项目的根目录下（与 `docker-compose.yml` 文件同级），打开终端并运行以下命令：

```bash
docker-compose up --build
```

*   `--build` 参数会强制 Docker 重新构建后端镜像，确保应用最新的代码变更。

该命令将会：
1.  拉取 PostgreSQL 和 Redis 的官方镜像。
2.  根据 `backend/Dockerfile` 构建后端应用的镜像。
3.  依次启动 PostgreSQL、Redis 和后端应用三个服务。
4.  将后端服务的 `3001` 端口映射到您的主机。

### 3.4 访问服务

*   **后端 API:** `http://localhost:3001`
*   **前端 (本地开发):** 您可以独立运行前端项目（`cd frontend && npm run dev`），它将连接到由 Docker 启动的后端服务。

### 3.5 停止应用

要停止所有正在运行的服务，请在同一终端窗口按下 `Ctrl + C`，然后运行以下命令以彻底清理容器和网络：

```bash
docker-compose down
```

### 3.6 启动开发环境 (Hot-Reloading)

如果您需要在开发过程中修改后端代码并希望服务能够自动重启（热重载），请使用为开发环境优化的 `docker-compose.dev.yml` 文件。

在项目根目录下，运行以下命令：

```bash
docker-compose -f docker-compose.dev.yml up --build
```

这个命令会：
1.  使用 `backend/Dockerfile.dev` 来构建一个开发镜像。
2.  将您本地的 `backend` 目录挂载到容器中，实现代码的实时同步。
3.  以开发模式启动 NestJS 服务，开启热重载功能。

现在，您在本地对 `backend` 目录下的任何 `.ts` 文件所做的修改，都会立即触发容器内服务的自动重启，极大提升了开发效率。

## 4. 本地开发指南 (非容器化)

如果您希望在不使用 Docker 的情况下直接在本地机器上运行和开发，请遵循以下步骤。这种方式非常适合专注于前端或后端单一服务的开发和调试。

### 4.1 环境准备

请确保您的本地开发环境中已安装并正在运行以下软件：

1.  **Node.js:** v20.x 或更高版本 ([https://nodejs.org/](https://nodejs.org/))
2.  **PostgreSQL:** v15 或更高版本 ([https://www.postgresql.org/download/](https://www.postgresql.org/download/))
3.  **Redis:** v7 或更高版本 ([https://redis.io/docs/getting-started/](https://redis.io/docs/getting-started/))

### 4.2 后端启动流程

1.  **进入后端目录**
    ```bash
    cd backend
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **配置环境变量**
    *   复制或重命名 `.env.example` 为 `.env` (如果存在)。
    *   打开 `backend/.env` 文件，确保 `DATABASE_*` 和 `REDIS_*` 相关的配置指向您本地安装的 PostgreSQL 和 Redis 服务实例。

4.  **启动后端服务 (带热重载)**
    ```bash
    npm run start:dev
    ```
    服务启动后，将监听在 `http://localhost:3001`。

### 4.3 前端启动流程

1.  **进入前端目录 (在新的终端窗口中)**
    ```bash
    cd frontend
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **启动前端开发服务器**
    ```bash
    npm run dev
    ```
    服务启动后，您可以通过浏览器访问 `http://localhost:3000` 来查看和调试前端界面。前端应用会自动连接到在 `3001` 端口运行的后端服务。

现在，您可以在本地编辑器中直接修改前端（或后端）代码，相关的开发服务器会自动重新加载，让您即时看到更改效果。