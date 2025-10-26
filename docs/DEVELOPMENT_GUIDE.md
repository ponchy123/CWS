# 开发指南 / Development Guide

本指南提供了内容创作工作流系统的详细开发说明。

## 📋 目录

- [环境要求](#环境要求)
- [项目结构](#项目结构)
- [开发流程](#开发流程)
- [常用命令](#常用命令)
- [技术架构](#技术架构)
- [调试技巧](#调试技巧)
- [性能优化](#性能优化)
- [常见问题](#常见问题)

## 🔧 环境要求

### 必需软件

- **Node.js**: 16.x 或更高版本
- **npm**: 8.x 或更高版本
- **Git**: 2.x 或更高版本
- **Docker**: 20.x 或更高版本（可选，用于容器化开发）
- **PostgreSQL**: 14.x 或更高版本
- **Redis**: 6.x 或更高版本

### 推荐工具

- **VS Code**: 推荐的代码编辑器
  - ESLint 扩展
  - Prettier 扩展
  - TypeScript 扩展
  - Tailwind CSS IntelliSense 扩展
- **Postman**: API 测试工具
- **Git GUI**: SourceTree、GitKraken 等

## 📁 项目结构

```
content-workflow-system/
├── src/                          # 前端源代码
│   ├── components/               # React 组件
│   │   ├── ui/                   # UI 基础组件（shadcn/ui）
│   │   ├── Layout/               # 布局组件
│   │   └── ...                   # 其他业务组件
│   ├── pages/                    # 页面组件
│   │   ├── dashboard.tsx         # 工作台
│   │   ├── content-creator.tsx   # 内容创作器
│   │   └── ...                   # 其他页面
│   ├── hooks/                    # 自定义 Hooks
│   │   ├── useAuth.ts            # 认证 Hook
│   │   ├── useToast.ts           # 提示信息 Hook
│   │   └── ...                   # 其他 Hooks
│   ├── services/                 # API 服务
│   │   ├── api.ts                # API 客户端配置
│   │   ├── auth.service.ts       # 认证服务
│   │   └── ...                   # 其他服务
│   ├── utils/                    # 工具函数
│   │   ├── formatters.ts         # 格式化工具
│   │   ├── validators.ts         # 验证工具
│   │   └── ...                   # 其他工具
│   ├── types/                    # TypeScript 类型定义
│   │   ├── index.ts              # 通用类型
│   │   ├── api.types.ts          # API 类型
│   │   └── ...                   # 其他类型
│   ├── router/                   # 路由配置
│   │   └── index.tsx             # 路由定义
│   ├── config/                   # 配置文件
│   ├── App.tsx                   # 应用根组件
│   └── main.tsx                  # 应用入口
├── server/                       # 后端源代码
│   ├── src/
│   │   ├── routes/               # API 路由
│   │   ├── controllers/          # 控制器
│   │   ├── models/               # 数据模型
│   │   ├── middleware/           # 中间件
│   │   ├── services/             # 业务逻辑
│   │   ├── utils/                # 工具函数
│   │   └── index.ts              # 服务器入口
│   ├── logs/                     # 日志文件
│   └── uploads/                  # 上传文件
├── public/                       # 静态资源
│   ├── icons/                    # 图标文件
│   ├── manifest.json             # PWA 清单
│   └── sw.js                     # Service Worker
├── docs/                         # 项目文档
├── .github/                      # GitHub 配置
│   └── workflows/                # CI/CD 工作流
└── config/                       # 项目配置
```

## 🔄 开发流程

### 1. 获取代码

```bash
# 克隆仓库
git clone https://github.com/your-org/content-workflow-system.git
cd content-workflow-system
```

### 2. 安装依赖

```bash
# 安装前端依赖
cd content-workflow-system
npm install

# 安装后端依赖
cd server
npm install
```

### 3. 配置环境

```bash
# 复制环境变量配置文件
cp .env.example .env

# 编辑 .env 文件，配置数据库、Redis 等
vim .env
```

### 4. 初始化数据库

```bash
# 启动 PostgreSQL 和 Redis（使用 Docker）
docker-compose -f docker-compose.dev.yml up -d postgres redis

# 运行数据库迁移
npm run db:migrate

# 填充初始数据（可选）
npm run db:seed
```

### 5. 启动开发服务器

```bash
# 启动前端开发服务器（端口 5173）
npm run dev

# 在另一个终端启动后端服务器（端口 3001）
cd server
npm run dev
```

### 6. 访问应用

- 前端：http://localhost:5173
- 后端 API：http://localhost:3001/api
- API 文档：http://localhost:3001/api-docs

## 💻 常用命令

### 前端命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 运行测试
npm test

# 测试覆盖率
npm run test:coverage

# E2E 测试
npm run test:e2e

# 代码检查
npm run lint

# 代码格式化
npm run format

# 类型检查
npm run type-check

# 分析构建产物
npm run analyze
```

### 后端命令

```bash
# 开发模式（带热重载）
npm run dev

# 生产模式
npm start

# 运行测试
npm test

# 测试覆盖率
npm run test:coverage

# 代码检查
npm run lint

# 数据库迁移
npm run db:migrate

# 数据库回滚
npm run db:rollback

# 填充测试数据
npm run db:seed
```

### Docker 命令

```bash
# 启动开发环境
docker-compose -f docker-compose.dev.yml up -d

# 启动生产环境
docker-compose -f docker-compose.prod.yml up -d

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f

# 重新构建
docker-compose up -d --build
```

## 🏗️ 技术架构

### 前端架构

#### 组件层次

```
App
├── Router
│   └── Layout
│       ├── Sidebar
│       ├── Header
│       └── Page Components
│           ├── Dashboard
│           ├── ContentCreator
│           └── ...
```

#### 状态管理

使用 Zustand 进行状态管理：

```typescript
// 创建 Store
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (credentials) => {
    // 登录逻辑
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));
```

#### API 调用

```typescript
// services/api.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
});

// 请求拦截器
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 错误处理
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 后端架构

#### 路由结构

```
/api
├── /auth           # 认证相关
│   ├── POST /login
│   ├── POST /register
│   └── POST /logout
├── /content        # 内容管理
│   ├── GET /
│   ├── POST /
│   ├── PUT /:id
│   └── DELETE /:id
├── /users          # 用户管理
└── /analytics      # 数据分析
```

#### 中间件

```typescript
// 认证中间件
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

## 🐛 调试技巧

### 前端调试

#### 使用 Chrome DevTools

1. 打开 Chrome 开发者工具（F12）
2. 在 Sources 面板中设置断点
3. 使用 Console 面板查看日志

#### React DevTools

安装 React Developer Tools 扩展：
- 查看组件树
- 检查组件 Props 和 State
- 性能分析

#### VSCode 调试配置

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

### 后端调试

#### Node.js Debugger

```bash
# 启动调试模式
npm run dev:debug
```

VSCode 配置：

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to Node",
  "port": 9229,
  "restart": true
}
```

#### 日志调试

```typescript
import logger from './utils/logger';

// 不同级别的日志
logger.info('信息日志');
logger.warn('警告日志');
logger.error('错误日志', error);
logger.debug('调试日志', { data });
```

## ⚡ 性能优化

### 前端优化

#### 代码分割

```typescript
// 懒加载路由组件
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/dashboard'));

// 使用 Suspense 包裹
<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

#### 组件优化

```typescript
// 使用 React.memo 避免不必要的重渲染
const MemoizedComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// 使用 useMemo 缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// 使用 useCallback 缓存回调函数
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);
```

### 后端优化

#### 数据库查询优化

```typescript
// 使用索引
CREATE INDEX idx_user_email ON users(email);

// 使用连接查询代替多次查询
SELECT u.*, p.title FROM users u 
LEFT JOIN posts p ON u.id = p.user_id;

// 分页查询
SELECT * FROM posts 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 0;
```

#### Redis 缓存

```typescript
// 缓存常用数据
const cacheKey = `user:${userId}`;
const cachedData = await redis.get(cacheKey);

if (cachedData) {
  return JSON.parse(cachedData);
}

const data = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
await redis.set(cacheKey, JSON.stringify(data), 'EX', 3600);
return data;
```

## ❓ 常见问题

### Q: 如何解决端口冲突？

**A**: 修改 `.env` 文件中的端口配置：

```env
# 前端端口
VITE_PORT=5174

# 后端端口
PORT=3002
```

### Q: 数据库连接失败怎么办？

**A**: 检查以下几点：
1. PostgreSQL 服务是否启动
2. 数据库配置是否正确
3. 数据库用户权限是否充足
4. 网络连接是否正常

### Q: 如何清理缓存？

**A**: 使用以下命令：

```bash
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 和重新安装
rm -rf node_modules package-lock.json
npm install

# 清理构建产物
rm -rf dist
```

### Q: TypeScript 类型错误如何处理？

**A**: 
1. 确保安装了所有类型定义包
2. 运行 `npm run type-check` 检查类型错误
3. 查看错误信息，根据提示修复
4. 必要时查阅 TypeScript 文档

### Q: 如何添加新的页面？

**A**: 
1. 在 `src/pages/` 创建新页面组件
2. 在 `src/router/index.tsx` 添加路由配置
3. 如需侧边栏显示，更新路由的 `icon` 和 `name`

### Q: 如何集成新的第三方库？

**A**: 
1. 安装依赖：`npm install library-name`
2. 安装类型定义：`npm install -D @types/library-name`
3. 在代码中导入使用
4. 更新文档说明新增的依赖

## 📚 相关资源

- [React 官方文档](https://react.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Vite 官方文档](https://vitejs.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Express.js 文档](https://expressjs.com/)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)

## 💡 最佳实践

1. **保持代码简洁**: 函数单一职责，避免过度复杂
2. **类型安全**: 充分利用 TypeScript 的类型系统
3. **错误处理**: 始终处理可能的错误情况
4. **测试覆盖**: 为关键功能编写测试
5. **代码审查**: 提交前自我审查，保证代码质量
6. **文档更新**: 及时更新相关文档
7. **性能意识**: 关注应用性能，避免不必要的渲染
8. **安全意识**: 注意数据验证和权限控制

---

如有其他问题，欢迎查阅其他文档或提交 Issue。
