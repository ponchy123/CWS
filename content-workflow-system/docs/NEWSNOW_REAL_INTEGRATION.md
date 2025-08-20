# NewsNow 真实 API 集成指南

## 概述

本文档介绍如何使用集成的 NewsNow 真实 API 功能，该功能基于开源项目 [ourongxing/newsnow](https://github.com/ourongxing/newsnow) 和在线服务 [newsnow.busiyi.world](https://newsnow.busiyi.world/)。

## 功能特性

### 🔥 多数据源支持
- **真实 NewsNow**: 直接对接 newsnow.busiyi.world 服务
- **模拟 NewsNow**: 使用高质量模拟数据
- **本地数据**: 本地热点话题数据
- **混合模式**: 智能混合多个数据源

### ⚡ 双模式切换
- **最热模式 (hottest)**: 展示当前最热门的话题，按热度排序
- **最新模式 (latest)**: 展示最新发布的话题，按时间排序

### 🎯 15+ 平台覆盖
支持的数据源包括：
- **知识社区**: 知乎、V2EX
- **社交媒体**: 微博、抖音
- **科技资讯**: 少数派、掘金
- **商业财经**: 36氪、虎嗅
- **娱乐内容**: B站、豆瓣
- **新闻资讯**: 百度、今日头条
- **技术平台**: GitHub
- **设计创意**: Dribbble

## API 接口

### 1. 获取热点话题

```http
GET /api/hot-topics
```

**参数说明:**
- `source`: 数据源类型
  - `mixed` (默认): 混合数据源
  - `newsnow-real`: 真实 NewsNow 数据
  - `newsnow`: 模拟 NewsNow 数据
  - `local`: 本地数据
- `mode`: 热点模式
  - `hottest` (默认): 最热话题
  - `latest`: 最新话题
- `sources`: 指定数据源列表，用逗号分隔 (如: `zhihu,weibo,v2ex`)
- `limit`: 返回数量限制 (默认: 15)

**请求示例:**
```bash
# 获取混合数据源的最热话题
curl "http://localhost:3001/api/hot-topics?source=mixed&mode=hottest&limit=10"

# 获取知乎和微博的最新话题
curl "http://localhost:3001/api/hot-topics?source=newsnow-real&mode=latest&sources=zhihu,weibo&limit=8"
```

**响应格式:**
```json
{
  "success": true,
  "data": [
    {
      "title": "话题标题",
      "platform": "知乎",
      "url": "https://...",
      "heat": 85000,
      "category": "知识问答",
      "tags": ["AI", "技术", "创新"],
      "summary": "话题摘要...",
      "content": "详细内容...",
      "createdAt": "2024-01-19T10:30:00.000Z",
      "rank": 1,
      "source": "zhihu",
      "mode": "hottest",
      "color": "#0066ff",
      "isRealData": true,
      "aiAnalysis": {
        "sentiment": "positive",
        "keywords": ["AI", "技术"],
        "contentType": "news",
        "difficulty": "medium",
        "estimatedReadTime": 3,
        "targetAudience": ["技术从业者", "AI爱好者"],
        "viralPotential": 85,
        "commercialValue": 75,
        "trendScore": 90,
        "engagementRate": 25,
        "shareability": 80,
        "timeValue": "high",
        "competitiveness": 45,
        "authenticity": 98,
        "reliability": 95
      }
    }
  ],
  "total": 10,
  "source": "mixed",
  "mode": "hottest",
  "sources": ["zhihu", "weibo"],
  "timestamp": "2024-01-19T10:30:00.000Z"
}
```

### 2. 获取数据源列表

```http
GET /api/hot-topics/sources
```

**响应格式:**
```json
{
  "success": true,
  "data": {
    "sources": [
      {
        "id": "zhihu",
        "name": "知乎",
        "category": "知识问答",
        "color": "#0066ff",
        "endpoint": "zhihu"
      }
    ],
    "recommendations": {
      "comprehensive": {
        "name": "综合热点",
        "sources": ["zhihu", "weibo", "v2ex", "36kr", "bilibili"],
        "description": "涵盖知识问答、社交媒体、技术社区、创业资讯和视频内容的综合热点"
      }
    },
    "total": 14
  }
}
```

### 3. 获取特定数据源热点

```http
GET /api/hot-topics/source/:sourceId
```

**参数说明:**
- `sourceId`: 数据源ID (如: zhihu, weibo, v2ex)
- `mode`: 热点模式 (hottest/latest)
- `limit`: 返回数量限制

**请求示例:**
```bash
# 获取知乎的最新话题
curl "http://localhost:3001/api/hot-topics/source/zhihu?mode=latest&limit=5"
```

## 前端组件使用

### 基础用法

```tsx
import HotTopics from './components/inspiration/HotTopics';

function App() {
  return (
    <div>
      <HotTopics />
    </div>
  );
}
```

### 组件特性

1. **数据源切换**: 支持混合、NewsNow真实、NewsNow模拟、本地数据四种模式
2. **模式切换**: 支持最热/最新两种模式，实时切换
3. **数据源选择**: 可自定义选择特定的数据源组合
4. **推荐组合**: 提供预设的数据源组合（综合热点、科技焦点、商业财经等）
5. **自动刷新**: 支持30秒自动刷新功能
6. **详情展开**: 支持展开查看话题详细内容
7. **AI分析**: 显示情感倾向、传播潜力、商业价值等AI分析结果

### 界面功能

- **控制面板**: 数据源选择、模式切换、数量限制、自动刷新
- **高级设置**: 推荐组合、自定义数据源选择
- **话题卡片**: 标题、摘要、标签、热度、AI分析、操作按钮
- **详情弹窗**: 完整内容、深度AI分析、外链跳转

## 配置说明

### 环境变量

```bash
# .env 文件
NEWSNOW_API_BASE=https://newsnow.busiyi.world
NEWSNOW_TIMEOUT=10000
NEWSNOW_RETRY_COUNT=3
```

### 数据源配置

在 `newsNowRealAPI.js` 中可以配置数据源：

```javascript
const NEWSNOW_REAL_SOURCES = {
  'zhihu': { 
    name: '知乎', 
    category: '知识问答', 
    color: '#0066ff',
    endpoint: 'zhihu'
  },
  // ... 其他数据源
};
```

## 测试验证

### 运行测试脚本

```bash
# 安装依赖
npm install axios

# 运行测试
node test-newsnow-real-integration.js
```

### 测试内容

1. **API连通性测试**: 验证各个API端点的可用性
2. **数据质量测试**: 检查返回数据的完整性和准确性
3. **性能测试**: 测试响应时间和成功率
4. **数据源测试**: 验证各个数据源的数据获取能力

### 测试结果示例

```
🎯 NewsNow 真实 API 集成测试
测试时间: 2024/1/19 上午10:30:00
测试目标: http://localhost:3001
================================================================================

📋 测试数据源列表 API...
==================================================
✅ 获取到 14 个可用数据源

🎯 数据源列表:
1. 知乎 (zhihu)
   分类: 知识问答 | 端点: zhihu
2. 微博 (weibo)
   分类: 社会热点 | 端点: weibo
...

📊 测试: 混合数据源 - 最热模式
==================================================
🔗 请求地址: http://localhost:3001/api/hot-topics?source=mixed&mode=hottest&limit=10
✅ 请求成功 (1250ms)
📈 获取到 10 条热点话题
🔄 数据源: mixed, 模式: hottest

🎯 热点话题预览:

1. OpenAI发布GPT-5预览版，多模态能力大幅提升
   平台: 知乎 | 热度: 8.5万 | 分类: 知识问答
   标签: AI, 技术, 创新
   时间: 2小时前
   数据类型: 真实数据
   AI分析: 情感积极 | 传播潜力85% | 商业价值75%
```

## 故障排除

### 常见问题

1. **数据获取失败**
   - 检查网络连接
   - 确认 NewsNow 服务可用性
   - 查看服务器日志

2. **响应时间过长**
   - 调整超时设置
   - 减少并发请求
   - 使用缓存机制

3. **数据质量问题**
   - 检查数据源配置
   - 验证数据转换逻辑
   - 启用备用数据机制

### 日志监控

```javascript
// 启用详细日志
console.log(`🔥 正在从 NewsNow 获取${type === 'latest' ? '最新' : '最热'}数据...`);
console.log(`目标数据源: ${targetSources.join(', ')}`);
console.log(`✅ 成功获取 ${sourceInfo.name} ${sourceTopics.length} 条数据`);
```

## 最佳实践

### 1. 数据源选择策略

- **综合内容**: 使用混合模式，覆盖多个平台
- **技术内容**: 重点选择知乎、V2EX、掘金、GitHub
- **商业内容**: 重点选择36氪、虎嗅、知乎
- **娱乐内容**: 重点选择微博、抖音、B站、豆瓣

### 2. 模式选择建议

- **最热模式**: 适合深度分析、长期关注的内容创作
- **最新模式**: 适合快速响应、实时跟进的内容创作

### 3. 性能优化

- 合理设置数据量限制 (建议10-20条)
- 启用自动刷新时注意频率控制
- 使用缓存减少重复请求
- 异步加载详细内容

### 4. 用户体验

- 提供加载状态提示
- 支持错误重试机制
- 优化移动端显示效果
- 提供快捷操作按钮

## 更新日志

### v1.0.0 (2024-01-19)
- ✨ 新增 NewsNow 真实 API 集成
- ✨ 支持15+平台数据源
- ✨ 新增最热/最新双模式
- ✨ 新增推荐数据源组合
- ✨ 新增AI深度分析功能
- ✨ 新增自动刷新功能
- 🐛 修复数据格式兼容性问题
- 🎨 优化用户界面和交互体验

## 技术支持

如有问题或建议，请：

1. 查看项目文档: [GitHub - ourongxing/newsnow](https://github.com/ourongxing/newsnow)
2. 访问在线服务: [NewsNow.busiyi.world](https://newsnow.busiyi.world/)
3. 检查服务器日志: `content-workflow-system/server/logs/`
4. 运行测试脚本: `node test-newsnow-real-integration.js`

---

*最后更新: 2024年1月19日*