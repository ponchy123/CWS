# 系统架构文档 / System Architecture

本文档详细描述了内容创作工作流系统的整体架构设计。

## 📋 目录

- [系统概述](#系统概述)
- [架构设计](#架构设计)
- [技术架构](#技术架构)
- [数据库设计](#数据库设计)
- [API 设计](#api-设计)
- [安全架构](#安全架构)
- [性能架构](#性能架构)
- [部署架构](#部署架构)

## 🎯 系统概述

内容创作工作流系统是一个企业级的内容管理平台，采用前后端分离的架构设计，支持内容创作的全生命周期管理。

### 核心特性

- 📝 **内容创作**: 富文本编辑、Markdown 支持、多媒体管理
- 📅 **内容规划**: 内容日历、任务分配、进度跟踪
- 🚀 **多平台发布**: 一键发布到多个社交媒体平台
- 📊 **数据分析**: 实时数据统计、用户行为分析
- 🔗 **平台集成**: 与第三方服务无缝集成
- 👥 **团队协作**: 用户权限管理、协作编辑

## 🏗️ 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         用户层                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Web 浏览器│  │ 移动浏览器│  │  桌面应用 │  │  API 客户端│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      CDN / 负载均衡                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Nginx                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       应用层                                  │
│  ┌─────────────────┐          ┌─────────────────────────┐  │
│  │    前端应用      │          │      后端 API 服务       │  │
│  │  React + Vite   │          │   Express + Node.js    │  │
│  │  TypeScript     │   ←──→   │      TypeScript        │  │
│  │  Zustand        │          │      RESTful API       │  │
│  └─────────────────┘          └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       服务层                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │认证服务  │  │内容服务  │  │分析服务  │  │通知服务  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      数据层                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │ PostgreSQL  │  │    Redis    │  │  文件存储       │    │
│  │  (主数据库)  │  │   (缓存)     │  │  (对象存储)      │    │
│  └─────────────┘  └─────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   基础设施层                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Docker  │  │   CI/CD  │  │  监控    │  │  日志    │   │
│  │Container │  │  GitHub  │  │Prometheus│  │ ELK Stack│   │
│  │          │  │  Actions │  │ Grafana  │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 分层架构

#### 1. 表现层（Presentation Layer）

**前端应用**
- **框架**: React 18 + TypeScript
- **状态管理**: Zustand
- **路由**: React Router v6
- **UI 组件**: shadcn/ui + Radix UI
- **样式**: Tailwind CSS
- **构建工具**: Vite

**职责**:
- 用户界面渲染
- 用户交互处理
- 状态管理
- 路由导航

#### 2. 业务逻辑层（Business Logic Layer）

**后端服务**
- **框架**: Express.js + TypeScript
- **API 风格**: RESTful
- **认证**: JWT
- **验证**: Joi

**职责**:
- 业务规则实现
- 数据验证
- 权限控制
- 业务流程编排

#### 3. 数据访问层（Data Access Layer）

**数据库访问**
- **ORM**: TypeORM / Sequelize
- **查询构建器**: Knex.js
- **缓存**: Redis

**职责**:
- 数据库操作封装
- 查询优化
- 事务管理
- 数据缓存

#### 4. 数据存储层（Data Storage Layer）

**存储系统**
- **关系数据库**: PostgreSQL
- **缓存**: Redis
- **文件存储**: 对象存储服务

**职责**:
- 数据持久化
- 数据备份
- 数据恢复

## 🔧 技术架构

### 前端技术栈

```
┌─────────────────────────────────────────────┐
│              React Application              │
├─────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Pages    │  │Components│  │ Hooks    │ │
│  └──────────┘  └──────────┘  └──────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Services │  │  Utils   │  │  Types   │ │
│  └──────────┘  └──────────┘  └──────────┘ │
├─────────────────────────────────────────────┤
│           State Management (Zustand)        │
├─────────────────────────────────────────────┤
│            Routing (React Router)           │
├─────────────────────────────────────────────┤
│           API Client (Axios)                │
└─────────────────────────────────────────────┘
```

### 后端技术栈

```
┌─────────────────────────────────────────────┐
│            Express Application              │
├─────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐  │
│  │         Middleware Stack             │  │
│  │  CORS │ Auth │ Logger │ Error       │  │
│  └──────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │ Routes   │  │Controller│  │Services │  │
│  └──────────┘  └──────────┘  └─────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │  Models  │  │  Utils   │  │  Types  │  │
│  └──────────┘  └──────────┘  └─────────┘  │
├─────────────────────────────────────────────┤
│              Database Layer                 │
│         PostgreSQL + Redis                  │
└─────────────────────────────────────────────┘
```

## 🗄️ 数据库设计

### 核心数据表

#### 用户表（users）

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(50) DEFAULT 'active',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 内容表（contents）

```sql
CREATE TABLE contents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(500) NOT NULL,
  content TEXT,
  format VARCHAR(50) DEFAULT 'markdown',
  status VARCHAR(50) DEFAULT 'draft',
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 标签表（tags）

```sql
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  color VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 内容标签关联表（content_tags）

```sql
CREATE TABLE content_tags (
  content_id INTEGER REFERENCES contents(id),
  tag_id INTEGER REFERENCES tags(id),
  PRIMARY KEY (content_id, tag_id)
);
```

### 数据库关系图

```
┌─────────┐       ┌──────────┐       ┌─────────┐
│  users  │───┐   │ contents │   ┌───│  tags   │
└─────────┘   │   └──────────┘   │   └─────────┘
              │         │         │
              │         │         │
              │         ├─────────┤
              │         │         │
              │   ┌────────────┐  │
              └───│content_tags│──┘
                  └────────────┘
```

## 🔌 API 设计

### RESTful API 规范

#### 认证相关

```
POST   /api/auth/register      # 用户注册
POST   /api/auth/login         # 用户登录
POST   /api/auth/logout        # 用户登出
POST   /api/auth/refresh       # 刷新令牌
GET    /api/auth/me            # 获取当前用户信息
```

#### 内容管理

```
GET    /api/contents           # 获取内容列表
GET    /api/contents/:id       # 获取单个内容
POST   /api/contents           # 创建内容
PUT    /api/contents/:id       # 更新内容
DELETE /api/contents/:id       # 删除内容
POST   /api/contents/:id/publish  # 发布内容
```

#### 用户管理

```
GET    /api/users              # 获取用户列表
GET    /api/users/:id          # 获取单个用户
PUT    /api/users/:id          # 更新用户信息
DELETE /api/users/:id          # 删除用户
```

### API 响应格式

#### 成功响应

```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "message": "操作成功"
}
```

#### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

## 🔒 安全架构

### 认证与授权

#### JWT 令牌

```typescript
// 令牌结构
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "12345",
    "email": "user@example.com",
    "role": "user",
    "iat": 1234567890,
    "exp": 1234654290
  }
}
```

#### 权限控制

```typescript
// 基于角色的访问控制 (RBAC)
enum Role {
  ADMIN = 'admin',
  EDITOR = 'editor',
  USER = 'user'
}

// 权限装饰器
@RequireAuth()
@RequireRole(Role.ADMIN)
async deleteUser(userId: string) {
  // 只有管理员可以删除用户
}
```

### 数据安全

- **密码加密**: bcrypt 哈希算法
- **数据传输**: HTTPS/TLS 加密
- **SQL 注入防护**: 参数化查询
- **XSS 防护**: 输入验证和输出编码
- **CSRF 防护**: CSRF 令牌

## ⚡ 性能架构

### 缓存策略

#### 多层缓存

```
┌──────────────┐
│ 浏览器缓存    │ (静态资源)
└──────────────┘
       ↓
┌──────────────┐
│ CDN 缓存      │ (静态内容)
└──────────────┘
       ↓
┌──────────────┐
│ Redis 缓存    │ (API 响应、会话)
└──────────────┘
       ↓
┌──────────────┐
│ 数据库        │ (持久化数据)
└──────────────┘
```

#### 缓存策略

```typescript
// 缓存装饰器
@Cache({ ttl: 3600, key: 'users:list' })
async getUsers() {
  return await db.query('SELECT * FROM users');
}
```

### 数据库优化

- **索引优化**: 为常用查询字段创建索引
- **查询优化**: 避免 N+1 查询问题
- **连接池**: 复用数据库连接
- **读写分离**: 主从复制架构

### 前端性能优化

- **代码分割**: React.lazy + Suspense
- **懒加载**: 图片、路由组件
- **虚拟列表**: 大数据列表优化
- **防抖/节流**: 频繁操作优化
- **Service Worker**: 离线缓存

## 🚀 部署架构

### 容器化部署

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./dist:/usr/share/nginx/html

  app:
    build: .
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=content_workflow
      - POSTGRES_PASSWORD=${DB_PASSWORD}

  redis:
    image: redis:alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}

volumes:
  postgres_data:
```

### CI/CD 流程

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy
        run: |
          # 部署脚本
```

### 监控架构

```
┌─────────────────────────────────────────┐
│          应用程序                         │
│  ┌────────────┐      ┌────────────┐    │
│  │   Metrics  │      │    Logs    │    │
│  └────────────┘      └────────────┘    │
└────────┬────────────────────┬───────────┘
         │                    │
         ↓                    ↓
┌────────────────┐    ┌────────────────┐
│  Prometheus    │    │  ELK Stack     │
│  (指标收集)     │    │  (日志收集)     │
└────────────────┘    └────────────────┘
         │                    │
         ↓                    ↓
┌─────────────────────────────────────────┐
│              Grafana                    │
│         (可视化监控面板)                  │
└─────────────────────────────────────────┘
```

## 📊 系统扩展性

### 水平扩展

- **应用层**: 多实例部署 + 负载均衡
- **数据库**: 主从复制、分库分表
- **缓存**: Redis 集群
- **文件存储**: 分布式对象存储

### 垂直扩展

- **服务器升级**: 提升 CPU、内存、磁盘性能
- **数据库优化**: 索引优化、查询优化
- **代码优化**: 算法优化、资源管理

## 🔄 系统可靠性

### 高可用设计

- **负载均衡**: Nginx/HAProxy
- **故障转移**: 主从切换
- **健康检查**: 定期健康检查
- **熔断降级**: 防止级联故障

### 容灾备份

- **数据备份**: 定期自动备份
- **异地容灾**: 多地域部署
- **灾难恢复**: 快速恢复机制

## 📈 未来架构演进

### 微服务架构

考虑将单体应用拆分为微服务：

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  认证服务    │  │  内容服务    │  │  分析服务    │
└─────────────┘  └─────────────┘  └─────────────┘
       │                │                │
       └────────────────┴────────────────┘
                        │
                 ┌──────────────┐
                 │  API 网关    │
                 └──────────────┘
```

### 事件驱动架构

引入消息队列，实现异步处理：

```
┌─────────┐      ┌──────────┐      ┌─────────┐
│ 生产者  │──→   │消息队列  │  ──→  │ 消费者  │
└─────────┘      │(RabbitMQ)│      └─────────┘
                 └──────────┘
```

## 📝 总结

本系统采用现代化的技术栈和架构设计，具有良好的扩展性、可维护性和可靠性。通过分层架构、模块化设计和容器化部署，能够满足企业级应用的各种需求。

---

如有架构相关的问题或建议，欢迎提交 Issue 或 Pull Request。
