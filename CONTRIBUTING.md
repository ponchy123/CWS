# 贡献指南 / Contributing Guide

感谢您对内容创作工作流系统项目的关注和支持！本指南将帮助您了解如何为项目做出贡献。

## 📋 目录

- [开发环境设置](#开发环境设置)
- [项目结构](#项目结构)
- [开发工作流](#开发工作流)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [测试指南](#测试指南)
- [问题反馈](#问题反馈)

## 🚀 开发环境设置

### 前置要求

- Node.js 16.x 或更高版本
- npm 8.x 或更高版本
- Git

### 克隆项目

```bash
git clone https://github.com/your-org/content-workflow-system.git
cd content-workflow-system
```

### 安装依赖

```bash
# 安装前端依赖
cd content-workflow-system
npm install

# 安装后端依赖
cd server
npm install
```

### 配置环境变量

```bash
# 前端
cp .env.example .env

# 后端
cd server
cp .env.example .env
```

根据您的本地开发环境修改 `.env` 文件中的配置。

### 启动开发服务器

```bash
# 前端（在 content-workflow-system 目录）
npm run dev

# 后端（在 content-workflow-system/server 目录）
npm run dev
```

## 📁 项目结构

```
content-workflow-system/
├── src/                    # 前端源代码
│   ├── components/         # React 组件
│   ├── pages/              # 页面组件
│   ├── hooks/              # 自定义 Hooks
│   ├── services/           # API 服务
│   ├── utils/              # 工具函数
│   ├── types/              # TypeScript 类型定义
│   └── router/             # 路由配置
├── server/                 # 后端源代码
│   ├── src/
│   │   ├── routes/         # API 路由
│   │   ├── controllers/    # 控制器
│   │   ├── models/         # 数据模型
│   │   ├── middleware/     # 中间件
│   │   └── utils/          # 工具函数
├── docs/                   # 项目文档
└── public/                 # 静态资源
```

## 🔄 开发工作流

### 1. 创建新分支

```bash
# 功能开发
git checkout -b feature/your-feature-name

# Bug 修复
git checkout -b fix/bug-description

# 文档更新
git checkout -b docs/what-you-are-documenting
```

### 2. 进行开发

- 遵循项目的代码规范
- 编写清晰的代码注释（如有必要）
- 确保新功能有对应的测试
- 更新相关文档

### 3. 提交代码

```bash
git add .
git commit -m "feat: 添加新功能描述"
```

### 4. 推送分支

```bash
git push origin feature/your-feature-name
```

### 5. 创建 Pull Request

- 在 GitHub 上创建 Pull Request
- 填写详细的 PR 描述
- 等待代码审查

## 📝 代码规范

### TypeScript/JavaScript

- 使用 TypeScript 进行开发
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 优先使用函数式组件和 Hooks
- 避免使用 `any` 类型，尽量提供具体的类型定义

```typescript
// ✅ 推荐
interface UserData {
  id: string;
  name: string;
  email: string;
}

const getUser = async (id: string): Promise<UserData> => {
  // 实现
};

// ❌ 不推荐
const getUser = async (id: any): Promise<any> => {
  // 实现
};
```

### 组件规范

- 组件文件名使用 PascalCase（如 `UserProfile.tsx`）
- 使用命名导出的组件
- Props 接口要明确定义

```typescript
// ✅ 推荐
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ onClick, children, variant = 'primary' }) => {
  return <button onClick={onClick} className={variant}>{children}</button>;
};

export default Button;
```

### CSS/样式规范

- 使用 Tailwind CSS 的实用类
- 避免内联样式（除非必要）
- 组件特定样式放在 CSS Module 中

## 💬 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 提交类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响代码功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 添加或修改测试
- `chore`: 构建过程或辅助工具的变动

### 提交示例

```bash
feat: 添加用户认证功能
fix: 修复登录页面的表单验证问题
docs: 更新 API 文档
style: 格式化代码，统一缩进
refactor: 重构用户管理模块
perf: 优化列表渲染性能
test: 添加用户服务的单元测试
chore: 更新依赖包版本
```

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

示例：

```
feat(auth): 添加 OAuth2.0 登录支持

实现了 Google 和 GitHub 的 OAuth2.0 登录功能。
- 添加 OAuth2.0 配置
- 创建回调处理路由
- 更新用户认证流程

Closes #123
```

## 🧪 测试指南

### 运行测试

```bash
# 前端单元测试
npm test

# 前端测试覆盖率
npm run test:coverage

# E2E 测试
npm run test:e2e

# 后端测试
cd server
npm test
```

### 编写测试

- 为新功能编写单元测试
- 为关键用户流程编写 E2E 测试
- 测试覆盖率目标：80% 以上

```typescript
// 组件测试示例
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button Component', () => {
  it('should render correctly', () => {
    render(<Button onClick={() => {}}>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 🐛 问题反馈

### 报告 Bug

在提交 Bug 报告之前，请确保：

1. 搜索现有的 Issue，避免重复
2. 使用最新版本的代码
3. 提供详细的复现步骤

Bug 报告应包含：

- **问题描述**：清晰描述问题
- **复现步骤**：一步步说明如何复现
- **期望行为**：说明预期的结果
- **实际行为**：说明实际发生的情况
- **环境信息**：操作系统、浏览器、Node.js 版本等
- **截图/日志**：如果可能，提供相关截图或错误日志

### 功能建议

功能建议应包含：

- **功能描述**：详细描述建议的功能
- **使用场景**：说明该功能的应用场景
- **期望收益**：该功能能带来什么好处
- **实现思路**：如有想法，可以提供实现建议

## 📚 文档贡献

文档同样重要！您可以：

- 修正文档中的错误
- 改进文档的可读性
- 添加示例代码
- 翻译文档
- 补充缺失的文档

## 🎯 最佳实践

### 代码审查

- 审查他人的 PR，提供建设性的反馈
- 及时响应对您 PR 的评论
- 保持友好和专业的态度

### 持续学习

- 关注项目的最新动态
- 学习新的技术和最佳实践
- 与社区分享您的经验

## 📞 联系方式

如有任何问题，欢迎通过以下方式联系我们：

- 提交 GitHub Issue
- 发送邮件至：support@example.com
- 加入我们的社区讨论群

## 📄 许可证

通过为本项目做出贡献，您同意您的贡献将在相同的许可证下发布。

---

再次感谢您的贡献！🎉
