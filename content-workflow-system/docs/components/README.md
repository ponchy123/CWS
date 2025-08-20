# 组件文档

## 概述

本文档介绍了内容创作工作流系统中的所有UI组件，包括使用方法、属性说明和示例代码。

## 组件分类

### 基础组件 (shadcn/ui)
- [Button](#button) - 按钮组件
- [Input](#input) - 输入框组件
- [Card](#card) - 卡片组件
- [Badge](#badge) - 徽章组件
- [Dialog](#dialog) - 对话框组件

### 业务组件
- [ContentEditor](#contenteditor) - 内容编辑器
- [FileUploader](#fileuploader) - 文件上传器
- [UserAvatar](#useravatar) - 用户头像
- [ContentCard](#contentcard) - 内容卡片
- [TagSelector](#tagselector) - 标签选择器

### 优化组件
- [OptimizedCard](#optimizedcard) - 优化卡片组件
- [OptimizedImage](#optimizedimage) - 优化图片组件
- [VirtualList](#virtuallist) - 虚拟滚动列表

### 无障碍组件
- [AccessibleButton](#accessiblebutton) - 无障碍按钮
- [AccessibleForm](#accessibleform) - 无障碍表单
- [AccessibleNavigation](#accessiblenavigation) - 无障碍导航

### 国际化组件
- [LanguageSwitcher](#languageswitcher) - 语言切换器
- [LocalizedText](#localizedtext) - 本地化文本

### 监控组件
- [MonitoringDashboard](#monitoringdashboard) - 监控仪表板
- [HealthIndicator](#healthindicator) - 健康状态指示器

---

## 基础组件

### Button

通用按钮组件，支持多种样式和状态。

#### 属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| variant | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | `'default'` | 按钮样式变体 |
| size | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | 按钮尺寸 |
| disabled | `boolean` | `false` | 是否禁用 |
| loading | `boolean` | `false` | 是否显示加载状态 |
| onClick | `() => void` | - | 点击事件处理函数 |

#### 使用示例

```tsx
import { Button } from '@/components/ui/button';

// 基础用法
<Button onClick={() => console.log('clicked')}>
  点击我
</Button>

// 不同样式
<Button variant="destructive">删除</Button>
<Button variant="outline">取消</Button>
<Button variant="ghost">幽灵按钮</Button>

// 不同尺寸
<Button size="sm">小按钮</Button>
<Button size="lg">大按钮</Button>

// 加载状态
<Button loading>
  保存中...
</Button>

// 禁用状态
<Button disabled>
  已禁用
</Button>
```

### Input

输入框组件，支持多种输入类型和验证。

#### 属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| type | `string` | `'text'` | 输入类型 |
| placeholder | `string` | - | 占位符文本 |
| value | `string` | - | 输入值 |
| onChange | `(value: string) => void` | - | 值变化回调 |
| error | `string` | - | 错误信息 |
| disabled | `boolean` | `false` | 是否禁用 |

#### 使用示例

```tsx
import { Input } from '@/components/ui/input';

// 基础用法
<Input 
  placeholder="请输入用户名"
  value={username}
  onChange={setUsername}
/>

// 密码输入
<Input 
  type="password"
  placeholder="请输入密码"
  value={password}
  onChange={setPassword}
/>

// 带错误提示
<Input 
  placeholder="邮箱地址"
  value={email}
  onChange={setEmail}
  error="请输入有效的邮箱地址"
/>

// 禁用状态
<Input 
  value="只读内容"
  disabled
/>
```

### Card

卡片容器组件，用于组织和展示内容。

#### 子组件

- `CardHeader` - 卡片头部
- `CardTitle` - 卡片标题
- `CardDescription` - 卡片描述
- `CardContent` - 卡片内容
- `CardFooter` - 卡片底部

#### 使用示例

```tsx
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>卡片标题</CardTitle>
    <CardDescription>
      这是卡片的描述信息
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p>卡片的主要内容区域</p>
  </CardContent>
  <CardFooter>
    <Button>操作按钮</Button>
  </CardFooter>
</Card>
```

---

## 业务组件

### ContentEditor

富文本内容编辑器，支持多种格式和媒体插入。

#### 属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| value | `string` | `''` | 编辑器内容 |
| onChange | `(content: string) => void` | - | 内容变化回调 |
| placeholder | `string` | `'开始写作...'` | 占位符文本 |
| readOnly | `boolean` | `false` | 是否只读 |
| toolbar | `ToolbarConfig` | - | 工具栏配置 |

#### 使用示例

```tsx
import { ContentEditor } from '@/components/editor/ContentEditor';

<ContentEditor
  value={content}
  onChange={setContent}
  placeholder="请输入文章内容..."
  toolbar={{
    bold: true,
    italic: true,
    link: true,
    image: true,
    video: true
  }}
/>
```

### FileUploader

文件上传组件，支持拖拽上传和多文件选择。

#### 属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| accept | `string` | - | 接受的文件类型 |
| multiple | `boolean` | `false` | 是否支持多文件 |
| maxSize | `number` | - | 最大文件大小(字节) |
| onUpload | `(files: File[]) => void` | - | 上传回调 |
| onError | `(error: string) => void` | - | 错误回调 |

#### 使用示例

```tsx
import { FileUploader } from '@/components/upload/FileUploader';

<FileUploader
  accept="image/*"
  multiple
  maxSize={5 * 1024 * 1024} // 5MB
  onUpload={handleFileUpload}
  onError={handleUploadError}
/>
```

### UserAvatar

用户头像组件，支持默认头像和状态指示。

#### 属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| src | `string` | - | 头像图片URL |
| name | `string` | - | 用户名 |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | 头像尺寸 |
| status | `'online' \| 'offline' \| 'away'` | - | 在线状态 |
| onClick | `() => void` | - | 点击回调 |

#### 使用示例

```tsx
import { UserAvatar } from '@/components/user/UserAvatar';

<UserAvatar
  src="/avatars/user.jpg"
  name="张三"
  size="lg"
  status="online"
  onClick={() => showUserProfile()}
/>
```

---

## 优化组件

### OptimizedCard

性能优化的卡片组件，使用React.memo和虚拟化技术。

#### 属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| data | `CardData` | - | 卡片数据 |
| onAction | `(action: string, data: any) => void` | - | 操作回调 |
| loading | `boolean` | `false` | 加载状态 |
| skeleton | `boolean` | `false` | 是否显示骨架屏 |

#### 使用示例

```tsx
import { OptimizedCard } from '@/components/optimized/OptimizedCard';

<OptimizedCard
  data={{
    id: '1',
    title: '文章标题',
    content: '文章摘要...',
    author: '作者名',
    createdAt: new Date()
  }}
  onAction={(action, data) => {
    if (action === 'edit') {
      editContent(data.id);
    }
  }}
/>
```

### VirtualList

虚拟滚动列表组件，适用于大量数据的高性能渲染。

#### 属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| items | `T[]` | - | 列表数据 |
| itemHeight | `number` | - | 单项高度 |
| renderItem | `(item: T, index: number) => ReactNode` | - | 渲染函数 |
| height | `number` | - | 容器高度 |
| overscan | `number` | `5` | 预渲染项目数 |

#### 使用示例

```tsx
import { VirtualList } from '@/components/optimized/VirtualList';

<VirtualList
  items={contentList}
  itemHeight={120}
  height={600}
  renderItem={(item, index) => (
    <ContentCard key={item.id} data={item} />
  )}
/>
```

---

## 无障碍组件

### AccessibleButton

符合WCAG标准的无障碍按钮组件。

#### 属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| ariaLabel | `string` | - | 无障碍标签 |
| ariaDescribedBy | `string` | - | 描述关联ID |
| focusable | `boolean` | `true` | 是否可聚焦 |
| role | `string` | `'button'` | ARIA角色 |

#### 使用示例

```tsx
import { AccessibleButton } from '@/components/accessibility/AccessibleButton';

<AccessibleButton
  ariaLabel="删除文章"
  ariaDescribedBy="delete-help"
  onClick={handleDelete}
>
  <TrashIcon />
</AccessibleButton>
<div id="delete-help" className="sr-only">
  此操作将永久删除文章，无法恢复
</div>
```

### AccessibleForm

无障碍表单组件，支持键盘导航和屏幕阅读器。

#### 属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| onSubmit | `(data: FormData) => void` | - | 提交回调 |
| validation | `ValidationRules` | - | 验证规则 |
| ariaLabelledBy | `string` | - | 表单标题ID |

#### 使用示例

```tsx
import { AccessibleForm } from '@/components/accessibility/AccessibleForm';

<AccessibleForm
  onSubmit={handleSubmit}
  validation={{
    title: { required: true, minLength: 5 },
    content: { required: true, minLength: 10 }
  }}
  ariaLabelledBy="form-title"
>
  <h2 id="form-title">创建新文章</h2>
  <Input name="title" label="文章标题" required />
  <Textarea name="content" label="文章内容" required />
  <Button type="submit">提交</Button>
</AccessibleForm>
```

---

## 国际化组件

### LanguageSwitcher

语言切换器组件，支持多语言切换。

#### 属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| languages | `Language[]` | - | 支持的语言列表 |
| currentLanguage | `string` | - | 当前语言 |
| onChange | `(language: string) => void` | - | 语言切换回调 |
| variant | `'dropdown' \| 'tabs' \| 'buttons'` | `'dropdown'` | 显示样式 |

#### 使用示例

```tsx
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';

<LanguageSwitcher
  languages={[
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' },
    { code: 'ja-JP', name: '日本語', flag: '🇯🇵' }
  ]}
  currentLanguage={currentLang}
  onChange={setLanguage}
  variant="dropdown"
/>
```

### LocalizedText

本地化文本组件，自动根据当前语言显示对应文本。

#### 属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| i18nKey | `string` | - | 国际化键名 |
| values | `Record<string, any>` | - | 插值变量 |
| fallback | `string` | - | 回退文本 |

#### 使用示例

```tsx
import { LocalizedText } from '@/components/i18n/LocalizedText';

<LocalizedText 
  i18nKey="welcome.message" 
  values={{ name: userName }}
  fallback="Welcome!"
/>

<LocalizedText 
  i18nKey="content.count" 
  values={{ count: contentCount }}
/>
```

---

## 监控组件

### MonitoringDashboard

系统监控仪表板，显示系统健康状态和性能指标。

#### 属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| refreshInterval | `number` | `30000` | 刷新间隔(毫秒) |
| showMetrics | `string[]` | - | 显示的指标列表 |
| onAlert | `(alert: Alert) => void` | - | 告警回调 |

#### 使用示例

```tsx
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';

<MonitoringDashboard
  refreshInterval={10000}
  showMetrics={['cpu', 'memory', 'response_time', 'error_rate']}
  onAlert={handleAlert}
/>
```

### HealthIndicator

健康状态指示器，显示服务或组件的健康状态。

#### 属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| status | `'healthy' \| 'degraded' \| 'unhealthy'` | - | 健康状态 |
| label | `string` | - | 指示器标签 |
| details | `string` | - | 详细信息 |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | 指示器尺寸 |

#### 使用示例

```tsx
import { HealthIndicator } from '@/components/monitoring/HealthIndicator';

<HealthIndicator
  status="healthy"
  label="数据库连接"
  details="响应时间: 15ms"
  size="md"
/>
```

---

## 组件开发指南

### 创建新组件

1. **组件结构**
```
src/components/
├── ui/                 # 基础UI组件
├── business/          # 业务组件
├── optimized/         # 性能优化组件
├── accessibility/     # 无障碍组件
├── i18n/             # 国际化组件
└── monitoring/       # 监控组件
```

2. **组件模板**
```tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface MyComponentProps {
  className?: string;
  children?: React.ReactNode;
  // 其他属性...
}

export const MyComponent: React.FC<MyComponentProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('my-component-base-styles', className)} {...props}>
      {children}
    </div>
  );
};

MyComponent.displayName = 'MyComponent';
```

3. **TypeScript类型定义**
```tsx
// types/components.ts
export interface ComponentProps {
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export type ComponentVariant = ComponentProps['variant'];
export type ComponentSize = ComponentProps['size'];
```

### 样式规范

1. **使用Tailwind CSS类名**
```tsx
// ✅ 推荐
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">

// ❌ 避免
<div style={{ display: 'flex', padding: '16px' }}>
```

2. **响应式设计**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

3. **暗色主题支持**
```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
```

### 性能优化

1. **使用React.memo**
```tsx
import React from 'react';

export const OptimizedComponent = React.memo<Props>(({ data }) => {
  return <div>{data.title}</div>;
});
```

2. **懒加载组件**
```tsx
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

export const App = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <HeavyComponent />
  </Suspense>
);
```

3. **虚拟化长列表**
```tsx
import { VirtualList } from '@/components/optimized/VirtualList';

<VirtualList
  items={largeDataSet}
  itemHeight={60}
  height={400}
  renderItem={(item) => <ItemComponent data={item} />}
/>
```

### 无障碍性

1. **ARIA属性**
```tsx
<button
  aria-label="关闭对话框"
  aria-describedby="dialog-description"
  onClick={onClose}
>
  <CloseIcon />
</button>
```

2. **键盘导航**
```tsx
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    onClick();
  }
};

<div
  role="button"
  tabIndex={0}
  onKeyDown={handleKeyDown}
  onClick={onClick}
>
```

3. **焦点管理**
```tsx
import { useRef, useEffect } from 'react';

const Modal = ({ isOpen }) => {
  const firstFocusableRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (isOpen && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, [isOpen]);
  
  return (
    <dialog open={isOpen}>
      <button ref={firstFocusableRef}>第一个可聚焦元素</button>
    </dialog>
  );
};
```

### 国际化

1. **使用翻译Hook**
```tsx
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('page.title')}</h1>
      <p>{t('page.description', { count: 5 })}</p>
    </div>
  );
};
```

2. **格式化数据**
```tsx
import { useI18n } from '@/hooks/useI18n';

const Component = () => {
  const { formatDate, formatNumber } = useI18n();
  
  return (
    <div>
      <span>{formatDate(new Date())}</span>
      <span>{formatNumber(1234.56)}</span>
    </div>
  );
};
```

### 测试

1. **组件测试模板**
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('应该正确渲染', () => {
    render(<MyComponent>测试内容</MyComponent>);
    expect(screen.getByText('测试内容')).toBeInTheDocument();
  });
  
  it('应该处理点击事件', () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

2. **快照测试**
```tsx
it('应该匹配快照', () => {
  const { container } = render(<MyComponent />);
  expect(container.firstChild).toMatchSnapshot();
});
```

### 文档规范

1. **组件文档结构**
```markdown
# ComponentName

组件描述

## 属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|

## 使用示例

```tsx
// 代码示例
```

## 注意事项

- 使用注意事项
```

2. **Storybook集成**
```tsx
// MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'Components/MyComponent',
  component: MyComponent,
  parameters: {
    docs: {
      description: {
        component: '组件描述'
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: '默认示例'
  }
};
```

## 最佳实践

1. **组件设计原则**
   - 单一职责：每个组件只负责一个功能
   - 可复用性：设计通用的、可配置的组件
   - 可组合性：支持组件之间的组合使用
   - 一致性：保持设计和交互的一致性

2. **性能考虑**
   - 避免不必要的重渲染
   - 合理使用useMemo和useCallback
   - 大列表使用虚拟化
   - 图片懒加载

3. **可维护性**
   - 清晰的命名规范
   - 完善的类型定义
   - 充分的测试覆盖
   - 详细的文档说明

4. **用户体验**
   - 响应式设计
   - 加载状态提示
   - 错误处理
   - 无障碍支持

## 贡献指南

1. **提交新组件**
   - 遵循现有的代码规范
   - 提供完整的TypeScript类型
   - 编写单元测试
   - 更新文档

2. **代码审查**
   - 功能正确性
   - 性能影响
   - 无障碍性
   - 测试覆盖率

3. **版本管理**
   - 遵循语义化版本
   - 记录破坏性变更
   - 提供迁移指南

## 支持

如有问题或建议，请联系：

- 📧 Email: components@content-workflow.com
- 📚 文档: https://docs.content-workflow.com/components
- 🐛 问题反馈: https://github.com/content-workflow/components/issues
