# Revive

Revive 是一个 Web 优先的个人内容记忆与任务生成工具。

它不是通用聊天工具，也不是静态 mock/demo。当前版本已经接入真实链路：用户可以导入网页或手动粘贴正文，系统会把内容写入 Supabase PostgreSQL，切块后生成 embedding，并在发起任务时基于全部收藏内容检索相关片段，再调用 LLM 生成结构化结果和引用依据。

## 当前状态

项目仍处于 prototype / early product 阶段，但核心链路已经可运行：

- 网页链接导入
- 手动正文导入
- 内容集管理
- 内容写入 Supabase PostgreSQL
- 正文切块并写入 `chunks`
- DashScope embedding
- DeepSeek LLM 生成
- 基于全部收藏内容的向量检索
- 结构化任务结果输出
- citations 引用依据
- Bookmarklet 一键收藏网页
- 任务偏好记忆系统 v1.1

## 技术栈

- Frontend: Next.js App Router, React, TypeScript
- Backend: Next.js Route Handlers, Node.js, TypeScript
- Database: Supabase PostgreSQL
- Vector Search: pgvector
- Embedding: DashScope compatible OpenAI API
- LLM: DeepSeek compatible OpenAI API

## 本地启动

安装依赖：

```bash
npm install
```

创建本地环境变量文件：

```bash
cp .env.example .env.local
```

然后在 `.env.local` 中填写自己的数据库和模型服务配置。

启动开发服务器：

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

## 环境变量

不要把 `.env.local` 提交到 Git。

项目需要以下配置：

```bash
DATABASE_URL=

LLM_API_KEY=
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat

DASHSCOPE_API_KEY=
DASHSCOPE_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1

EMBEDDING_API_KEY=
EMBEDDING_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
EMBEDDING_MODEL=text-embedding-v4
EMBEDDING_DIMENSIONS=1536

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

说明：

- `DATABASE_URL` 使用 Supabase PostgreSQL 连接串。
- `LLM_API_KEY` 用于 DeepSeek 兼容接口。
- `DASHSCOPE_API_KEY` 或 `EMBEDDING_API_KEY` 用于 embedding。
- `NEXT_PUBLIC_APP_URL` 用于生成 Bookmarklet 调用地址。

## 数据库

当前核心表：

- `collections`
- `items`
- `chunks`
- `task_runs`
- `memories`

迁移文件位于：

```text
supabase/migrations
```

本地开发时需要先在 Supabase 中执行这些 SQL migration，确保表结构、pgvector 和约束都已创建。

## 主要页面

- `/`：首页 / 任务输入
- `/collections`：内容集视图
- `/import`：导入内容
- `/input`：任务输入
- `/preferences`：我的偏好
- `/help`：帮助入口
- `/bookmarklet/import`：Bookmarklet 安装引导

## 主要 API

- `GET /api/collections`
- `GET /api/collections/[collectionId]`
- `PATCH /api/collections/[collectionId]`
- `DELETE /api/collections/[collectionId]`
- `POST /api/import-url`
- `POST /api/import-text`
- `POST /api/run-task`
- `DELETE /api/items/[itemId]`
- `GET /api/memories`
- `POST /api/memories`
- `PATCH /api/memories/[id]`
- `DELETE /api/memories/[id]`
- `POST /api/bookmarklet-import`
- `POST /api/task-feedback`

## Bookmarklet

项目支持浏览器 Bookmarklet：

1. 打开 `/bookmarklet/import`
2. 将页面中的按钮拖到浏览器书签栏
3. 在任意网页点击该书签
4. 当前网页会被导入到 Revive 的“最近收藏”内容集

Bookmarklet 请求会调用：

```text
POST /api/bookmarklet-import
```

该接口允许跨域请求，并会自动使用“最近收藏”内容集。

## 任务偏好记忆系统

当前已实现 v1.1 基础能力：

- 偏好写入 `memories`
- 偏好管理页 `/preferences`
- 结果页轻反馈
- 生成任务前读取启用的偏好
- 全局偏好与任务类型偏好合并
- 任务类型级偏好优先于同维度全局偏好
- 注入到 Prompt 中作为软约束
- `task_runs.injected_memory_ids` 记录本次注入的 memory id

当前用户系统尚未接入，开发阶段使用：

```text
local-demo-user
```

后续接入登录系统时需要替换为真实用户 ID。

## 安全注意事项

- 不要提交 `.env.local`。
- 不要把真实 API Key、数据库密码、Supabase 连接串写进 README、源码或 migration。
- `.env.example` 只能放占位符或示例值。
- 如果误提交了密钥，应立即在对应平台轮换密钥，并从 Git 历史中清理。
- 当前仓库 `.gitignore` 已忽略 `.env*`、`.next/`、`node_modules/` 和 build 产物。

## 开发检查

提交前建议执行：

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## 项目原则

- 不回到 mock。
- 不把产品做成通用聊天工具。
- 优先复用现有真实链路。
- 功能迭代尽量保持小步提交，方便回退。
- 新功能需要同步考虑数据库 migration、API、UI 和安全边界。
