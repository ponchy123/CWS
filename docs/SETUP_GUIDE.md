# 项目设置指南 / Setup Guide

本指南将帮助您快速设置和运行内容创作工作流系统。

## 📋 目录

- [前置要求](#前置要求)
- [快速开始](#快速开始)
- [详细设置步骤](#详细设置步骤)
- [Docker 部署](#docker-部署)
- [常见问题](#常见问题)
- [验证安装](#验证安装)

## 🔧 前置要求

在开始之前，请确保您的系统已安装以下软件：

### 必需软件

| 软件 | 最低版本 | 推荐版本 | 下载链接 |
|------|---------|---------|----------|
| Node.js | 16.x | 18.x 或更高 | [nodejs.org](https://nodejs.org/) |
| npm | 8.x | 9.x 或更高 | 随 Node.js 安装 |
| Git | 2.x | 最新版 | [git-scm.com](https://git-scm.com/) |
| PostgreSQL | 14.x | 15.x | [postgresql.org](https://www.postgresql.org/) |
| Redis | 6.x | 7.x | [redis.io](https://redis.io/) |

### 可选软件（推荐）

- **Docker**: 用于容器化部署
- **VS Code**: 推荐的代码编辑器
- **Postman**: API 测试工具

## 🚀 快速开始

### 方法一：使用 Docker Compose（推荐）

这是最简单的启动方式，适合快速体验项目。

```bash
# 1. 克隆仓库
git clone https://github.com/your-org/content-workflow-system.git
cd content-workflow-system/content-workflow-system

# 2. 复制环境变量配置
cp .env.example .env

# 3. 启动所有服务（开发环境）
docker-compose -f docker-compose.dev.yml up -d

# 访问应用
# 前端: http://localhost:5173
# 后端 API: http://localhost:3001
```

### 方法二：本地开发环境

适合需要进行代码开发和调试的场景。

```bash
# 1. 克隆仓库
git clone https://github.com/your-org/content-workflow-system.git
cd content-workflow-system/content-workflow-system

# 2. 安装前端依赖
npm install

# 3. 安装后端依赖
cd server
npm install
cd ..

# 4. 启动数据库（使用 Docker）
docker-compose -f docker-compose.dev.yml up -d postgres redis

# 5. 配置环境变量
cp .env.example .env
cp server/.env.example server/.env

# 6. 初始化数据库
cd server
npm run db:init
cd ..

# 7. 启动前端开发服务器（终端 1）
npm run dev

# 8. 启动后端开发服务器（终端 2）
cd server
npm run dev
```

## 📖 详细设置步骤

### 1. 克隆项目

```bash
# 使用 HTTPS
git clone https://github.com/your-org/content-workflow-system.git

# 或使用 SSH
git clone git@github.com:your-org/content-workflow-system.git

cd content-workflow-system/content-workflow-system
```

### 2. 安装依赖

#### 前端依赖

```bash
# 在项目根目录
npm install

# 或使用 yarn
yarn install

# 或使用 pnpm
pnpm install
```

#### 后端依赖

```bash
cd server
npm install
cd ..
```

### 3. 设置数据库

#### 使用 Docker（推荐）

```bash
# 启动 PostgreSQL
docker run -d \
  --name postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=content_workflow \
  -p 5432:5432 \
  postgres:14

# 启动 Redis
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:alpine
```

#### 本地安装

**PostgreSQL 安装**

- **macOS**: `brew install postgresql@14`
- **Ubuntu**: `sudo apt-get install postgresql-14`
- **Windows**: 下载安装器 [postgresql.org](https://www.postgresql.org/download/)

**Redis 安装**

- **macOS**: `brew install redis`
- **Ubuntu**: `sudo apt-get install redis-server`
- **Windows**: 使用 WSL 或下载 Windows 版本

#### 创建数据库

```bash
# 连接到 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE content_workflow;

# 创建用户
CREATE USER cws_user WITH PASSWORD 'your_password';

# 授予权限
GRANT ALL PRIVILEGES ON DATABASE content_workflow TO cws_user;

# 退出
\q
```

### 4. 配置环境变量

#### 前端环境变量

复制 `.env.example` 到 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# API 配置
VITE_API_BASE_URL=http://localhost:3001/api
VITE_API_TIMEOUT=30000

# 应用配置
VITE_APP_TITLE=内容创作工作流系统
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development

# 认证配置
VITE_JWT_TOKEN_KEY=content_workflow_token
VITE_REFRESH_TOKEN_KEY=content_workflow_refresh_token

# 国际化配置
VITE_DEFAULT_LOCALE=zh-CN
VITE_FALLBACK_LOCALE=zh-CN
```

#### 后端环境变量

复制 `server/.env.example` 到 `server/.env`：

```bash
cp server/.env.example server/.env
```

编辑 `server/.env` 文件：

```env
# 服务器配置
PORT=3001
HOST=localhost
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=content_workflow
DB_USER=cws_user
DB_PASSWORD=your_password

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 认证配置
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=7d

# 日志配置
LOG_LEVEL=info
LOG_FORMAT=combined

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB
```

### 5. 初始化数据库

```bash
cd server

# 运行数据库迁移
npm run db:migrate

# 填充初始数据（可选）
npm run db:seed

cd ..
```

如果没有迁移脚本，可以手动运行 SQL：

```bash
cd server
psql -U cws_user -d content_workflow -f ../init.sql
cd ..
```

### 6. 启动开发服务器

#### 方式一：分别启动（推荐用于开发）

**终端 1 - 前端**

```bash
npm run dev
```

前端服务将在 `http://localhost:5173` 启动。

**终端 2 - 后端**

```bash
cd server
npm run dev
```

后端服务将在 `http://localhost:3001` 启动。

#### 方式二：同时启动

如果项目配置了并发启动脚本：

```bash
npm run dev:all
```

## 🐳 Docker 部署

### 开发环境

```bash
# 构建并启动所有服务
docker-compose -f docker-compose.dev.yml up -d --build

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f

# 停止服务
docker-compose -f docker-compose.dev.yml down

# 清理数据卷（慎用）
docker-compose -f docker-compose.dev.yml down -v
```

### 生产环境

```bash
# 构建并启动
docker-compose -f docker-compose.prod.yml up -d --build

# 查看运行状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f app

# 停止服务
docker-compose -f docker-compose.prod.yml down
```

## ✅ 验证安装

### 1. 检查服务状态

**前端服务**

打开浏览器，访问 `http://localhost:5173`，应该能看到登录页面。

**后端服务**

访问健康检查端点：

```bash
curl http://localhost:3001/api/health
```

应该返回：

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. 测试数据库连接

```bash
# 连接到 PostgreSQL
psql -U cws_user -d content_workflow -c "SELECT version();"

# 连接到 Redis
redis-cli ping
# 应该返回: PONG
```

### 3. 运行测试

```bash
# 前端测试
npm test

# 后端测试
cd server
npm test
```

### 4. 创建测试账号

可以通过 API 或直接在数据库中创建：

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123456"
  }'
```

## ❓ 常见问题

### Q1: 端口被占用

**错误信息**: `Error: listen EADDRINUSE: address already in use :::5173`

**解决方案**:

```bash
# 查找占用端口的进程
lsof -i :5173

# 杀死进程
kill -9 <PID>

# 或修改端口
# 编辑 .env 文件，修改 VITE_PORT
```

### Q2: 数据库连接失败

**错误信息**: `ECONNREFUSED 127.0.0.1:5432`

**解决方案**:

1. 确认 PostgreSQL 服务正在运行
2. 检查数据库配置是否正确
3. 验证用户名和密码
4. 检查防火墙设置

```bash
# 检查 PostgreSQL 状态
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# 重启 PostgreSQL
# macOS
brew services restart postgresql

# Linux
sudo systemctl restart postgresql
```

### Q3: npm install 失败

**解决方案**:

```bash
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 如果仍然失败，尝试使用淘宝镜像
npm install --registry=https://registry.npmmirror.com
```

### Q4: TypeScript 编译错误

**解决方案**:

```bash
# 安装缺失的类型定义
npm install -D @types/node @types/react @types/react-dom

# 清理构建缓存
rm -rf dist node_modules/.vite

# 重新构建
npm run build
```

### Q5: Redis 连接失败

**错误信息**: `Error: connect ECONNREFUSED 127.0.0.1:6379`

**解决方案**:

```bash
# 检查 Redis 状态
# macOS
brew services list | grep redis

# Linux
sudo systemctl status redis

# 启动 Redis
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# 或使用 Docker
docker start redis
```

## 🔍 调试技巧

### 查看日志

```bash
# 前端日志
# 打开浏览器开发者工具 (F12)

# 后端日志
cd server
tail -f logs/app.log

# Docker 日志
docker-compose logs -f
```

### 重置数据库

```bash
cd server

# 回滚所有迁移
npm run db:rollback

# 重新运行迁移
npm run db:migrate

# 重新填充数据
npm run db:seed
```

## 📚 下一步

安装完成后，您可以：

1. 阅读 [开发指南](./DEVELOPMENT_GUIDE.md) 了解开发流程
2. 查看 [架构文档](./ARCHITECTURE.md) 了解系统架构
3. 参考 [贡献指南](../CONTRIBUTING.md) 开始贡献代码
4. 浏览 [API 文档](./content-workflow-system/docs/api/) 了解 API 接口

## 💡 提示

- 首次启动可能需要较长时间下载依赖
- 建议使用 VS Code 并安装推荐的扩展
- 开发时建议开启热重载功能
- 定期更新依赖包以获取最新功能和安全修复

## 📞 获取帮助

如果遇到问题：

1. 查看本文档的常见问题部分
2. 搜索项目的 [GitHub Issues](https://github.com/your-org/content-workflow-system/issues)
3. 提交新的 Issue 描述您的问题
4. 加入我们的社区讨论群

---

祝您使用愉快！🎉
