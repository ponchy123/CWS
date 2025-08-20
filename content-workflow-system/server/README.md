# 内容工作流管理系统 - 后端服务

这是内容工作流管理系统的后端API服务，基于Node.js + Express + MongoDB构建。

## 功能特性

- 🔐 用户认证与授权
- 📝 内容创作管理
- 💡 灵感收集整理
- 📊 数据分析统计
- 🚀 多平台发布
- ⚙️ 系统设置管理
- 👥 用户管理（管理员）
- 🔄 实时通知（WebSocket）

## 技术栈

- **运行环境**: Node.js 16+
- **Web框架**: Express.js
- **数据库**: MongoDB
- **认证**: JWT
- **实时通信**: Socket.io
- **数据验证**: Joi
- **密码加密**: bcryptjs
- **定时任务**: node-cron

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 环境配置

复制环境变量模板并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接等信息。

### 3. 启动MongoDB

确保MongoDB服务正在运行：

```bash
# 使用Docker启动MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 或使用本地安装的MongoDB
mongod
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务将在 `http://localhost:3001` 启动。

## API文档

### 认证相关

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/refresh` - 刷新Token
- `POST /api/auth/logout` - 用户登出

### 内容管理

- `GET /api/content` - 获取内容列表
- `POST /api/content` - 创建内容
- `GET /api/content/:id` - 获取内容详情
- `PUT /api/content/:id` - 更新内容
- `DELETE /api/content/:id` - 删除内容
- `POST /api/content/batch` - 批量操作

### 灵感管理

- `GET /api/inspiration` - 获取灵感列表
- `POST /api/inspiration` - 创建灵感
- `GET /api/inspiration/:id` - 获取灵感详情
- `PUT /api/inspiration/:id` - 更新灵感
- `DELETE /api/inspiration/:id` - 删除灵感
- `PATCH /api/inspiration/:id/star` - 切换收藏状态
- `GET /api/inspiration/stats/overview` - 获取统计数据

### 发布管理

- `GET /api/publish/tasks` - 获取发布任务列表
- `POST /api/publish/tasks` - 创建发布任务
- `POST /api/publish/tasks/:id/publish` - 立即发布
- `PATCH /api/publish/tasks/:id/pause` - 暂停任务
- `PATCH /api/publish/tasks/:id/resume` - 恢复任务
- `POST /api/publish/tasks/:id/retry` - 重试发布
- `GET /api/publish/stats` - 获取发布统计

### 数据分析

- `GET /api/analytics/overview` - 获取概览统计
- `GET /api/analytics/platforms` - 获取平台数据
- `GET /api/analytics/content-performance` - 获取内容表现
- `GET /api/analytics/trends` - 获取趋势数据
- `GET /api/analytics/audience` - 获取用户画像
- `GET /api/analytics/export` - 导出数据

### 用户管理

- `GET /api/user` - 获取用户列表（管理员）
- `PUT /api/user/profile` - 更新用户资料
- `PUT /api/user/settings` - 更新用户设置
- `PUT /api/user/password` - 修改密码
- `PATCH /api/user/:id/status` - 禁用/启用用户（管理员）
- `PATCH /api/user/:id/role` - 更新用户角色（管理员）
- `DELETE /api/user/:id` - 删除用户（管理员）

### 系统设置

- `GET /api/settings` - 获取系统设置
- `PUT /api/settings` - 更新系统设置
- `POST /api/settings/reset` - 重置设置
- `GET /api/settings/export` - 导出用户数据

## 数据模型

### User（用户）

```javascript
{
  username: String,      // 用户名
  email: String,         // 邮箱
  password: String,      // 密码（加密）
  avatar: String,        // 头像URL
  profile: {             // 个人资料
    phone: String,
    company: String,
    position: String,
    location: String,
    bio: String
  },
  settings: {            // 用户设置
    theme: String,
    language: String,
    notifications: Object
  },
  role: String,          // 角色：user/admin/editor
  isActive: Boolean,     // 是否激活
  lastLogin: Date        // 最后登录时间
}
```

### Content（内容）

```javascript
{
  title: String,         // 标题
  content: String,       // 内容
  summary: String,       // 摘要
  author: ObjectId,      // 作者ID
  category: String,      // 分类
  tags: [String],        // 标签
  platforms: [{          // 发布平台
    name: String,
    status: String,
    publishedAt: Date,
    url: String,
    metrics: Object
  }],
  status: String,        // 状态
  priority: String,      // 优先级
  scheduledAt: Date,     // 计划发布时间
  publishedAt: Date,     // 实际发布时间
  analytics: Object      // 分析数据
}
```

### Inspiration（灵感）

```javascript
{
  title: String,         // 标题
  content: String,       // 内容
  source: String,        // 来源
  sourceUrl: String,     // 来源链接
  type: String,          // 类型
  category: String,      // 分类
  tags: [String],        // 标签
  priority: String,      // 优先级
  status: String,        // 状态
  author: ObjectId,      // 作者ID
  isStarred: Boolean,    // 是否收藏
  relatedContent: ObjectId // 关联内容
}
```

## 部署说明

### 使用Docker部署

1. 构建镜像：

```bash
docker build -t content-workflow-server .
```

2. 运行容器：

```bash
docker run -d -p 3001:3001 --env-file .env content-workflow-server
```

### 使用PM2部署

1. 安装PM2：

```bash
npm install -g pm2
```

2. 启动应用：

```bash
pm2 start src/index.js --name "content-workflow-server"
```

## 开发指南

### 项目结构

```
server/
├── src/
│   ├── config/          # 配置文件
│   ├── controllers/     # 控制器
│   ├── middleware/      # 中间件
│   ├── models/          # 数据模型
│   ├── routes/          # 路由
│   ├── utils/           # 工具函数
│   └── index.js         # 入口文件
├── uploads/             # 文件上传目录
├── logs/                # 日志目录
├── package.json
└── README.md
```

### 添加新功能

1. 在 `models/` 中定义数据模型
2. 在 `routes/` 中定义路由
3. 在 `middleware/` 中添加中间件（如需要）
4. 在 `index.js` 中注册路由

### 测试

```bash
npm test
```

## 常见问题

### 1. MongoDB连接失败

确保MongoDB服务正在运行，并检查 `.env` 文件中的 `MONGODB_URI` 配置。

### 2. JWT Token无效

检查 `.env` 文件中的 `JWT_SECRET` 配置，确保前后端使用相同的密钥。

### 3. 跨域问题

检查 `CORS` 配置，确保 `CLIENT_URL` 设置正确。

## 许可证

MIT License