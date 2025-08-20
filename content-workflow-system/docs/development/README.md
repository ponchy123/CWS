# 开发指南

## 概述

本文档为内容创作工作流系统的开发人员提供详细的开发指南，包括项目结构、开发规范、工作流程和最佳实践。

## 目录

- [项目结构](#项目结构)
- [开发环境设置](#开发环境设置)
- [代码规范](#代码规范)
- [开发工作流](#开发工作流)
- [测试指南](#测试指南)
- [性能优化](#性能优化)
- [调试技巧](#调试技巧)
- [常见问题](#常见问题)

## 项目结构

```
content-workflow-system/
├── public/                 # 静态资源
│   ├── favicon.ico
│   └── index.html
├── src/                    # 源代码
│   ├── components/         # 组件
│   │   ├── ui/            # 基础UI组件
│   │   ├── business/      # 业务组件
│   │   ├── optimized/     # 性能优化组件
│   │   ├── accessibility/ # 无障碍组件
│   │   ├── i18n/         # 国际化组件
│   │   └── monitoring/    # 监控组件
│   ├── pages/             # 页面组件
│   │   ├── dashboard/     # 仪表板
│   │   ├── content/       # 内容管理
│   │   ├── planning/      # 内容规划
│   │   └── settings/      # 设置页面
│   ├── hooks/             # 自定义Hook
│   │   ├── useAuth.ts     # 认证Hook
│   │   ├── useApi.ts      # API Hook
│   │   └── useI18n.ts     # 国际化Hook
│   ├── stores/            # 状态管理
│   │   ├── userStore.ts   # 用户状态
│   │   ├── appStore.ts    # 应用状态
│   │   └── contentStore.ts # 内容状态
│   ├── services/          # 服务层
│   │   ├── api/           # API服务
│   │   ├── auth/          # 认证服务
│   │   └── storage/       # 存储服务
│   ├── lib/               # 工具库
│   │   ├── utils.ts       # 通用工具
│   │   ├── validation.ts  # 验证工具
│   │   ├── security.ts    # 安全工具
│   │   └── formatters.ts  # 格式化工具
│   ├── types/             # 类型定义
│   │   ├── api.ts         # API类型
│   │   ├── user.ts        # 用户类型
│   │   └── content.ts     # 内容类型
│   ├── i18n/              # 国际化
│   │   ├── index.ts       # 配置文件
│   │   └── locales/       # 语言文件
│   ├── styles/            # 样式文件
│   │   ├── globals.css    # 全局样式
│   │   └── components.css # 组件样式
│   └── main.tsx           # 应用入口
├── docs/                  # 文档
│   ├── api/               # API文档
│   ├── components/        # 组件文档
│   ├── deployment/        # 部署文档
│   └── development/       # 开发文档
├── tests/                 # 测试文件
│   ├── __mocks__/         # Mock文件
│   ├── fixtures/          # 测试数据
│   └── utils/             # 测试工具
├── .env.example           # 环境变量模板
├── .gitignore             # Git忽略文件
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript配置
├── vite.config.ts         # Vite配置
├── tailwind.config.js     # Tailwind配置
└── README.md              # 项目说明
```

## 开发环境设置

### 1. 系统要求

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0 或 **pnpm**: >= 7.0.0
- **Git**: >= 2.30.0
- **VS Code**: 推荐使用（配置了相关插件）

### 2. 推荐的VS Code插件

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml"
  ]
}
```

### 3. 环境配置

#### Git配置

```bash
# 设置用户信息
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 设置默认分支
git config --global init.defaultBranch main

# 设置换行符处理
git config --global core.autocrlf input  # Linux/Mac
git config --global core.autocrlf true   # Windows
```

#### Node.js版本管理

使用 nvm 管理 Node.js 版本：

```bash
# 安装指定版本
nvm install 18.17.0
nvm use 18.17.0

# 设置默认版本
nvm alias default 18.17.0
```

### 4. 项目初始化

```bash
# 克隆项目
git clone https://github.com/your-org/content-workflow-system.git
cd content-workflow-system

# 安装依赖
npm install

# 复制环境变量
cp .env.example .env.local

# 启动开发服务器
npm run dev
```

## 代码规范

### 1. TypeScript规范

#### 类型定义

```typescript
// ✅ 推荐：使用接口定义对象类型
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}

// ✅ 推荐：使用联合类型定义枚举
type UserRole = 'admin' | 'editor' | 'viewer';

// ✅ 推荐：使用泛型提高复用性
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// ❌ 避免：使用any类型
const userData: any = {};

// ✅ 推荐：使用具体类型
const userData: User = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date()
};
```

#### 函数定义

```typescript
// ✅ 推荐：明确的参数和返回类型
const fetchUser = async (id: string): Promise<User | null> => {
  try {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
};

// ✅ 推荐：使用可选参数
const createUser = (
  name: string,
  email: string,
  options?: {
    avatar?: string;
    role?: UserRole;
  }
): Promise<User> => {
  // 实现逻辑
};
```

### 2. React组件规范

#### 组件定义

```typescript
// ✅ 推荐：使用接口定义Props
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
  className?: string;
}

// ✅ 推荐：使用React.FC类型
export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  className
}) => {
  // 组件逻辑
  const handleEdit = useCallback(() => {
    onEdit?.(user);
  }, [user, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete?.(user.id);
  }, [user.id, onDelete]);

  return (
    <Card className={cn('user-card', className)}>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* 组件内容 */}
      </CardContent>
      <CardFooter>
        <Button onClick={handleEdit}>编辑</Button>
        <Button variant="destructive" onClick={handleDelete}>
          删除
        </Button>
      </CardFooter>
    </Card>
  );
};

// 设置显示名称
UserCard.displayName = 'UserCard';
```

#### Hook使用规范

```typescript
// ✅ 推荐：自定义Hook
const useUser = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const userData = await userService.getUser(userId);
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取用户失败');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  return { user, loading, error };
};

// ✅ 推荐：使用依赖数组
useEffect(() => {
  // 副作用逻辑
}, [dependency1, dependency2]);

// ✅ 推荐：使用useCallback优化性能
const handleClick = useCallback((id: string) => {
  // 处理点击
}, []);

// ✅ 推荐：使用useMemo优化计算
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

### 3. 样式规范

#### Tailwind CSS使用

```typescript
// ✅ 推荐：使用cn工具函数合并类名
import { cn } from '@/lib/utils';

const Button: React.FC<ButtonProps> = ({ 
  variant = 'default', 
  size = 'md', 
  className,
  ...props 
}) => {
  return (
    <button
      className={cn(
        // 基础样式
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        // 变体样式
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
        },
        // 尺寸样式
        {
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4': size === 'md',
          'h-12 px-6 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    />
  );
};
```

#### 响应式设计

```typescript
// ✅ 推荐：移动优先的响应式设计
<div className="
  grid grid-cols-1 gap-4
  sm:grid-cols-2 sm:gap-6
  md:grid-cols-3 md:gap-8
  lg:grid-cols-4
  xl:grid-cols-5
">
  {/* 内容 */}
</div>

// ✅ 推荐：使用断点前缀
<div className="
  text-sm sm:text-base md:text-lg lg:text-xl
  p-2 sm:p-4 md:p-6 lg:p-8
">
  {/* 内容 */}
</div>
```

### 4. 文件命名规范

```
# 组件文件：PascalCase
UserCard.tsx
ContentEditor.tsx
NavigationMenu.tsx

# Hook文件：camelCase，以use开头
useAuth.ts
useLocalStorage.ts
useDebounce.ts

# 工具文件：camelCase
utils.ts
validation.ts
formatters.ts

# 类型文件：camelCase
user.ts
content.ts
api.ts

# 常量文件：SCREAMING_SNAKE_CASE
CONSTANTS.ts
API_ENDPOINTS.ts

# 页面文件：kebab-case
dashboard.tsx
content-creation.tsx
user-settings.tsx
```

## 开发工作流

### 1. Git工作流

#### 分支策略

```bash
# 主分支
main          # 生产环境代码
develop       # 开发环境代码

# 功能分支
feature/user-management
feature/content-editor
feature/dashboard-redesign

# 修复分支
hotfix/security-patch
hotfix/critical-bug-fix

# 发布分支
release/v1.2.0
release/v1.3.0
```

#### 提交规范

使用 Conventional Commits 规范：

```bash
# 功能提交
git commit -m "feat: 添加用户管理功能"
git commit -m "feat(auth): 实现JWT认证"

# 修复提交
git commit -m "fix: 修复登录页面样式问题"
git commit -m "fix(api): 处理网络请求超时"

# 文档提交
git commit -m "docs: 更新API文档"
git commit -m "docs(readme): 添加安装说明"

# 样式提交
git commit -m "style: 格式化代码"
git commit -m "style(components): 统一组件样式"

# 重构提交
git commit -m "refactor: 重构用户状态管理"
git commit -m "refactor(hooks): 优化自定义Hook"

# 测试提交
git commit -m "test: 添加用户组件测试"
git commit -m "test(utils): 完善工具函数测试"

# 构建提交
git commit -m "build: 更新依赖版本"
git commit -m "build(docker): 优化Docker配置"
```

#### 代码审查流程

```bash
# 1. 创建功能分支
git checkout -b feature/new-feature

# 2. 开发功能
# ... 编写代码 ...

# 3. 提交代码
git add .
git commit -m "feat: 实现新功能"

# 4. 推送分支
git push origin feature/new-feature

# 5. 创建Pull Request
# 在GitHub/GitLab上创建PR

# 6. 代码审查
# 团队成员审查代码

# 7. 合并代码
# 审查通过后合并到develop分支
```

### 2. 开发流程

#### 新功能开发

1. **需求分析**
   - 理解功能需求
   - 设计技术方案
   - 评估开发时间

2. **技术设计**
   - 设计组件结构
   - 定义数据流
   - 确定API接口

3. **编码实现**
   - 创建组件
   - 实现业务逻辑
   - 添加样式

4. **测试验证**
   - 编写单元测试
   - 进行集成测试
   - 手动功能测试

5. **代码审查**
   - 提交Pull Request
   - 团队代码审查
   - 修复审查问题

6. **部署上线**
   - 合并到主分支
   - 部署到测试环境
   - 部署到生产环境

#### Bug修复流程

1. **问题定位**
   - 复现问题
   - 分析错误日志
   - 确定问题范围

2. **修复方案**
   - 设计修复方案
   - 评估影响范围
   - 制定测试计划

3. **代码修复**
   - 实现修复代码
   - 添加防护措施
   - 更新相关测试

4. **验证测试**
   - 验证修复效果
   - 回归测试
   - 性能测试

5. **发布部署**
   - 紧急修复直接发布
   - 常规修复跟随版本

## 测试指南

### 1. 测试策略

```
测试金字塔：
┌─────────────────┐
│   E2E Tests     │  少量，关键流程
├─────────────────┤
│ Integration     │  适量，组件集成
│    Tests        │
├─────────────────┤
│   Unit Tests    │  大量，函数/组件
└─────────────────┘
```

### 2. 单元测试

#### 组件测试

```typescript
// UserCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UserCard } from './UserCard';

const mockUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date('2023-01-01')
};

describe('UserCard', () => {
  it('应该正确渲染用户信息', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('应该处理编辑按钮点击', () => {
    const handleEdit = vi.fn();
    render(<UserCard user={mockUser} onEdit={handleEdit} />);
    
    fireEvent.click(screen.getByText('编辑'));
    expect(handleEdit).toHaveBeenCalledWith(mockUser);
  });

  it('应该处理删除按钮点击', () => {
    const handleDelete = vi.fn();
    render(<UserCard user={mockUser} onDelete={handleDelete} />);
    
    fireEvent.click(screen.getByText('删除'));
    expect(handleDelete).toHaveBeenCalledWith(mockUser.id);
  });
});
```

#### Hook测试

```typescript
// useUser.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useUser } from './useUser';
import * as userService from '@/services/userService';

vi.mock('@/services/userService');

describe('useUser', () => {
  it('应该获取用户数据', async () => {
    const mockUser = { id: '1', name: 'John Doe' };
    vi.mocked(userService.getUser).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useUser('1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBe(null);
  });

  it('应该处理获取用户失败', async () => {
    const errorMessage = '获取用户失败';
    vi.mocked(userService.getUser).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useUser('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe(errorMessage);
  });
});
```

#### 工具函数测试

```typescript
// utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate, validateEmail, debounce } from './utils';

describe('utils', () => {
  describe('formatDate', () => {
    it('应该格式化日期', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      expect(formatDate(date)).toBe('2023-01-01');
    });

    it('应该处理无效日期', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });
  });

  describe('validateEmail', () => {
    it('应该验证有效邮箱', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('应该拒绝无效邮箱', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('debounce', () => {
    it('应该延迟执行函数', async () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
```

### 3. 集成测试

```typescript
// UserManagement.integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserManagement } from './UserManagement';
import * as userService from '@/services/userService';

vi.mock('@/services/userService');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('UserManagement Integration', () => {
  it('应该完成用户管理流程', async () => {
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ];

    vi.mocked(userService.getUsers).mockResolvedValue(mockUsers);
    vi.mocked(userService.deleteUser).mockResolvedValue(undefined);

    render(<UserManagement />, { wrapper: createWrapper() });

    // 等待用户列表加载
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // 删除用户
    const deleteButtons = screen.getAllByText('删除');
    fireEvent.click(deleteButtons[0]);

    // 确认删除
    const confirmButton = screen.getByText('确认');
    fireEvent.click(confirmButton);

    // 验证删除调用
    await waitFor(() => {
      expect(userService.deleteUser).toHaveBeenCalledWith('1');
    });
  });
});
```

### 4. E2E测试

使用 Playwright 进行端到端测试：

```typescript
// e2e/user-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('用户管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/users');
  });

  test('应该显示用户列表', async ({ page }) => {
    await expect(page.locator('[data-testid="user-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-card"]')).toHaveCount(3);
  });

  test('应该能够创建新用户', async ({ page }) => {
    // 点击创建按钮
    await page.click('[data-testid="create-user-button"]');

    // 填写表单
    await page.fill('[data-testid="user-name-input"]', 'New User');
    await page.fill('[data-testid="user-email-input"]', 'newuser@example.com');

    // 提交表单
    await page.click('[data-testid="submit-button"]');

    // 验证用户创建成功
    await expect(page.locator('text=用户创建成功')).toBeVisible();
    await expect(page.locator('text=New User')).toBeVisible();
  });

  test('应该能够编辑用户', async ({ page }) => {
    // 点击编辑按钮
    await page.click('[data-testid="edit-user-button"]');

    // 修改用户名
    await page.fill('[data-testid="user-name-input"]', 'Updated User');

    // 保存修改
    await page.click('[data-testid="save-button"]');

    // 验证修改成功
    await expect(page.locator('text=用户更新成功')).toBeVisible();
    await expect(page.locator('text=Updated User')).toBeVisible();
  });

  test('应该能够删除用户', async ({ page }) => {
    // 点击删除按钮
    await page.click('[data-testid="delete-user-button"]');

    // 确认删除
    await page.click('[data-testid="confirm-delete-button"]');

    // 验证删除成功
    await expect(page.locator('text=用户删除成功')).toBeVisible();
  });
});
```

## 性能优化

### 1. 组件优化

#### React.memo使用

```typescript
// ✅ 推荐：对纯展示组件使用React.memo
export const UserCard = React.memo<UserCardProps>(({ user, onEdit, onDelete }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={() => onEdit(user)}>编辑</Button>
        <Button onClick={() => onDelete(user.id)}>删除</Button>
      </CardFooter>
    </Card>
  );
});

// ✅ 推荐：自定义比较函数
export const ExpensiveComponent = React.memo<Props>(
  ({ data, config }) => {
    // 复杂组件逻辑
  },
  (prevProps, nextProps) => {
    // 自定义比较逻辑
    return (
      prevProps.data.id === nextProps.data.id &&
      prevProps.config.theme === nextProps.config.theme
    );
  }
);
```

#### useCallback和useMemo

```typescript
const UserList: React.FC<UserListProps> = ({ users, searchTerm, onUserSelect }) => {
  // ✅ 推荐：缓存过滤结果
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // ✅ 推荐：缓存事件处理函数
  const handleUserClick = useCallback((user: User) => {
    onUserSelect(user);
  }, [onUserSelect]);

  // ✅ 推荐：缓存复杂计算
  const userStats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
    };
  }, [users]);

  return (
    <div>
      <UserStats stats={userStats} />
      {filteredUsers.map(user => (
        <UserCard
          key={user.id}
          user={user}
          onClick={handleUserClick}
        />
      ))}
    </div>
  );
};
```

### 2. 代码分割

#### 路由级别分割

```typescript
// ✅ 推荐：懒加载页面组件
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const UserManagement = lazy(() => import('@/pages/UserManagement'));
const ContentEditor = lazy(() => import('@/pages/ContentEditor'));

export const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/content" element={<ContentEditor />} />
      </Routes>
    </Suspense>
  );
};
```

#### 组件级别分割

```typescript
// ✅ 推荐：懒加载重型组件
const HeavyChart = lazy(() => import('@/components/charts/HeavyChart'));
const RichTextEditor = lazy(() => import('@/components/editor/RichTextEditor'));

export const Dashboard = () => {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <h1>仪表板</h1>
      {showChart && (
        <Suspense fallback={<div>加载图表中...</div>}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
};
```

### 3. 虚拟化长列表

```typescript
// ✅ 推荐：使用虚拟滚动处理大量数据
import { VirtualList } from '@/components/optimized/VirtualList';

export const LargeUserList: React.FC<{ users: User[] }> = ({ users }) => {
  return (
    <VirtualList
      items={users}
      itemHeight={80}
      height={600}
      renderItem={(user, index) => (
        <UserCard key={user.id} user={user} />
      )}
    />
  );
};
```

### 4. 图片优化

```typescript
// ✅ 推荐：懒加载图片
import { OptimizedImage } from '@/components/optimized/OptimizedImage';

export const UserAvatar: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={64}
      height={64}
      className="rounded-full"
      loading="lazy"
      placeholder="/placeholder-avatar.svg"
    />
  );
};
```

## 调试技巧

### 1. 浏览器开发者工具

#### React DevTools

```typescript
// 在组件中添加调试信息
const UserCard = ({ user }) => {
  // 开发环境下添加调试信息
  if (process.env.NODE_ENV === 'development') {
    console.log('UserCard render:', user);
  }

  return <div>{user.name}</div>;
};

// 使用displayName便于调试
UserCard.displayName = 'UserCard';
```

#### 性能分析

```typescript
// 使用React Profiler分析性能
import { Profiler } from 'react';

const onRenderCallback = (id, phase, actualDuration) => {
  console.log('Profiler:', { id, phase, actualDuration });
};

export const App = () => {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <Router>
        <AppRoutes />
      </Router>
    </Profiler>
  );
};
```

### 2. 调试工具

#### 状态调试

```typescript
// Zustand DevTools
import { devtools } from 'zustand/middleware';

export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      users: [],
      loading: false,
      fetchUsers: async () => {
        set({ loading: true });
        const users = await userService.getUsers();
        set({ users, loading: false });
      },
    }),
    {
      name: 'user-store',
    }
  )
);
```

#### 网络请求调试

```typescript
// API请求拦截器
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    return Promise.reject(error);
  }
);
```

### 3. 错误边界

```typescript
// 错误边界组件
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // 发送错误到监控服务
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>出现了错误</h2>
          <p>抱歉，应用遇到了意外错误。</p>
          <button onClick={() => window.location.reload()}>
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 常见问题

### 1. 开发环境问题

#### 热重载不工作

```bash
# 检查Vite配置
# vite.config.ts
export default defineConfig({
  server: {
    hmr: {
      overlay: false, // 禁用错误覆盖层
    },
  },
});

# 清理缓存
rm -rf node_modules/.vite
npm run dev
```

#### 端口冲突

```bash
# 指定端口启动
npm run dev -- --port 3001

# 或在vite.config.ts中配置
export default defineConfig({
  server: {
    port: 3001,
  },
});
```

### 2. 构建问题

#### 内存不足

```bash
# 增加Node.js内存限制
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# 或在package.json中配置
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
  }
}
```

#### 类型检查错误

```bash
# 跳过类型检查构建
npm run build -- --skipLibCheck

# 或修复TypeScript错误
npx tsc --noEmit
```

### 3. 运行时问题

#### 状态更新问题

```typescript
// ❌ 错误：直接修改状态
const [users, setUsers] = useState([]);
users.push(newUser); // 错误

// ✅ 正确：创建新状态
setUsers(prev => [...prev, newUser]);

// ❌ 错误：直接修改对象
const [user, setUser] = useState({});
user.name = 'New Name'; // 错误

// ✅ 正确：创建新对象
setUser(prev => ({ ...prev, name: 'New Name' }));
```

#### 依赖数组问题

```typescript
// ❌ 错误：缺少依赖
useEffect(() => {
  fetchUser(userId);
}, []); // 缺少userId依赖

// ✅ 正确：包含所有依赖
useEffect(() => {
  fetchUser(userId);
}, [userId]);

// ✅ 正确：使用useCallback稳定函数引用
const fetchUser = useCallback(async (id: string) => {
  const user = await userService.getUser(id);
  setUser(user);
}, []);

useEffect(() => {
  fetchUser(userId);
}, [userId, fetchUser]);
```

### 4. 性能问题

#### 不必要的重渲染

```typescript
// ❌ 错误：每次渲染都创建新对象
const UserList = ({ users }) => {
  return (
    <div>
      {users.map(user => (
        <UserCard
          key={user.id}
          user={user}
          style={{ margin: 10 }} // 每次都是新对象
        />
      ))}
    </div>
  );
};

// ✅ 正确：使用稳定的样式对象
const cardStyle = { margin: 10 };

const UserList = ({ users }) => {
  return (
    <div>
      {users.map(user => (
        <UserCard
          key={user.id}
          user={user}
          style={cardStyle}
        />
      ))}
    </div>
  );
};
```

#### 内存泄漏

```typescript
// ❌ 错误：未清理事件监听器
useEffect(() => {
  const handleResize = () => {
    // 处理窗口大小变化
  };
  
  window.addEventListener('resize', handleResize);
  // 缺少清理函数
}, []);

// ✅ 正确：清理事件监听器
useEffect(() => {
  const handleResize = () => {
    // 处理窗口大小变化
  };
  
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

## 最佳实践总结

### 1. 代码组织

- 按功能模块组织文件结构
- 使用绝对路径导入
- 保持组件单一职责
- 提取可复用的逻辑到自定义Hook

### 2. 性能优化

- 合理使用React.memo、useCallback、useMemo
- 实现代码分割和懒加载
- 使用虚拟化处理大量数据
- 优化图片和静态资源

### 3. 类型安全

- 为所有函数和组件定义类型
- 使用严格的TypeScript配置
- 避免使用any类型
- 定义清晰的接口和类型

### 4. 测试覆盖

- 编写单元测试覆盖核心逻辑
- 添加集成测试验证组件交互
- 使用E2E测试覆盖关键流程
- 保持测试代码的可维护性

### 5. 错误处理

- 使用错误边界捕获组件错误
- 实现全局错误处理机制
- 提供用户友好的错误提示
- 集成错误监控服务

### 6. 可访问性

- 使用语义化HTML元素
- 添加适当的ARIA属性
- 支持键盘导航
- 确保颜色对比度符合标准

### 7. 国际化

- 提取所有文本到翻译文件
- 使用统一的翻译Key命名规范
- 考虑不同语言的文本长度差异
- 实现RTL语言支持

## 开发工具推荐

### 1. VS Code插件

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-playwright.playwright",
    "vitest.explorer"
  ]
}
```

### 2. 浏览器插件

- React Developer Tools
- Redux DevTools
- Lighthouse
- Web Vitals
- axe DevTools (无障碍测试)

### 3. 命令行工具

```bash
# 代码质量检查
npm install -g eslint prettier typescript

# 性能分析
npm install -g lighthouse clinic

# 依赖分析
npm install -g depcheck npm-check-updates

# Git工具
npm install -g commitizen conventional-changelog-cli
```

## 贡献指南

### 1. 提交代码

1. Fork项目到个人仓库
2. 创建功能分支
3. 编写代码和测试
4. 提交Pull Request
5. 等待代码审查

### 2. 代码审查标准

- 功能正确性
- 代码质量
- 测试覆盖率
- 性能影响
- 安全性考虑
- 文档完整性

### 3. 发布流程

1. 更新版本号
2. 生成变更日志
3. 创建发布标签
4. 部署到生产环境
5. 通知相关人员

## 支持与反馈

如有开发相关问题，请联系：

- 📧 Email: dev@content-workflow.com
- 📚 文档: https://docs.content-workflow.com/development
- 🐛 问题反馈: https://github.com/content-workflow/system/issues
- 💬 开发讨论: https://discord.gg/content-workflow-dev

---

*本文档会持续更新，请关注最新版本。*
