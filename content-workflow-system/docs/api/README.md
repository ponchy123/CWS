# API 文档

## 概述

内容创作工作流系统提供了完整的RESTful API，支持内容管理、用户认证、文件上传等功能。

## 基础信息

- **基础URL**: `https://api.content-workflow.com/v1`
- **认证方式**: Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证

所有API请求都需要在请求头中包含认证令牌：

```http
Authorization: Bearer <your-access-token>
```

### 获取访问令牌

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "用户名"
    }
  }
}
```

## 错误处理

API使用标准的HTTP状态码来表示请求结果：

- `200` - 请求成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未授权
- `403` - 禁止访问
- `404` - 资源不存在
- `422` - 验证失败
- `500` - 服务器内部错误

**错误响应格式**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "title",
        "message": "标题不能为空"
      }
    ]
  }
}
```

## 分页

支持分页的API端点使用以下参数：

- `page` - 页码（从1开始）
- `limit` - 每页数量（默认10，最大100）
- `sort` - 排序字段
- `order` - 排序方向（asc/desc）

**分页响应格式**:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

## API端点

### 用户管理

#### 获取用户信息
```http
GET /users/me
```

#### 更新用户信息
```http
PUT /users/me
Content-Type: application/json

{
  "name": "新用户名",
  "avatar": "https://example.com/avatar.jpg",
  "preferences": {
    "theme": "dark",
    "language": "zh-CN"
  }
}
```

#### 修改密码
```http
POST /users/change-password
Content-Type: application/json

{
  "current_password": "当前密码",
  "new_password": "新密码"
}
```

### 内容管理

#### 获取内容列表
```http
GET /contents?page=1&limit=10&status=published&category=tech
```

**查询参数**:
- `status` - 内容状态（draft/published/archived）
- `category` - 内容分类
- `search` - 搜索关键词
- `author` - 作者ID
- `created_after` - 创建时间筛选
- `created_before` - 创建时间筛选

**响应示例**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "content-123",
        "title": "文章标题",
        "content": "文章内容...",
        "status": "published",
        "category": "tech",
        "author": {
          "id": "user-123",
          "name": "作者名"
        },
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T11:00:00Z",
        "published_at": "2024-01-15T12:00:00Z",
        "tags": ["技术", "教程"],
        "meta": {
          "views": 1250,
          "likes": 45,
          "comments": 12
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

#### 获取单个内容
```http
GET /contents/{id}
```

#### 创建内容
```http
POST /contents
Content-Type: application/json

{
  "title": "新文章标题",
  "content": "文章内容...",
  "category": "tech",
  "tags": ["技术", "教程"],
  "status": "draft",
  "scheduled_at": "2024-01-20T10:00:00Z"
}
```

#### 更新内容
```http
PUT /contents/{id}
Content-Type: application/json

{
  "title": "更新后的标题",
  "content": "更新后的内容...",
  "status": "published"
}
```

#### 删除内容
```http
DELETE /contents/{id}
```

#### 发布内容
```http
POST /contents/{id}/publish
Content-Type: application/json

{
  "scheduled_at": "2024-01-20T10:00:00Z" // 可选，立即发布则不传
}
```

#### 归档内容
```http
POST /contents/{id}/archive
```

### 文件管理

#### 上传文件
```http
POST /files/upload
Content-Type: multipart/form-data

file: <binary-data>
folder: "images" // 可选
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "file-123",
    "filename": "image.jpg",
    "original_name": "my-image.jpg",
    "mime_type": "image/jpeg",
    "size": 1024000,
    "url": "https://cdn.example.com/files/image.jpg",
    "thumbnail": "https://cdn.example.com/files/thumbnails/image.jpg",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### 获取文件列表
```http
GET /files?type=image&folder=uploads
```

#### 删除文件
```http
DELETE /files/{id}
```

### 分类管理

#### 获取分类列表
```http
GET /categories
```

#### 创建分类
```http
POST /categories
Content-Type: application/json

{
  "name": "技术",
  "slug": "tech",
  "description": "技术相关内容",
  "parent_id": null // 可选，用于创建子分类
}
```

#### 更新分类
```http
PUT /categories/{id}
```

#### 删除分类
```http
DELETE /categories/{id}
```

### 标签管理

#### 获取标签列表
```http
GET /tags?search=技术
```

#### 创建标签
```http
POST /tags
Content-Type: application/json

{
  "name": "人工智能",
  "color": "#3b82f6"
}
```

### 评论管理

#### 获取评论列表
```http
GET /contents/{content_id}/comments
```

#### 创建评论
```http
POST /contents/{content_id}/comments
Content-Type: application/json

{
  "content": "这是一条评论",
  "parent_id": null // 可选，用于回复评论
}
```

#### 删除评论
```http
DELETE /comments/{id}
```

### 统计分析

#### 获取内容统计
```http
GET /analytics/contents?period=30d&group_by=day
```

#### 获取用户活动统计
```http
GET /analytics/users?period=7d
```

#### 获取热门内容
```http
GET /analytics/popular?type=views&limit=10
```

## Webhook

系统支持Webhook通知，可以在特定事件发生时向指定URL发送HTTP POST请求。

### 支持的事件

- `content.created` - 内容创建
- `content.published` - 内容发布
- `content.updated` - 内容更新
- `content.deleted` - 内容删除
- `user.registered` - 用户注册
- `comment.created` - 评论创建

### Webhook配置

```http
POST /webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["content.published", "comment.created"],
  "secret": "your-webhook-secret"
}
```

### Webhook负载示例

```json
{
  "event": "content.published",
  "timestamp": "2024-01-15T12:00:00Z",
  "data": {
    "content": {
      "id": "content-123",
      "title": "文章标题",
      "author": {
        "id": "user-123",
        "name": "作者名"
      }
    }
  }
}
```

## 速率限制

API实施速率限制以防止滥用：

- **认证用户**: 每分钟1000次请求
- **未认证用户**: 每分钟100次请求
- **文件上传**: 每分钟10次请求

超出限制时返回HTTP 429状态码。

## SDK和工具

### JavaScript SDK

```bash
npm install @content-workflow/sdk
```

```javascript
import { ContentWorkflowClient } from '@content-workflow/sdk';

const client = new ContentWorkflowClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.content-workflow.com/v1'
});

// 获取内容列表
const contents = await client.contents.list({
  status: 'published',
  limit: 20
});
```

### cURL示例

```bash
# 获取内容列表
curl -X GET "https://api.content-workflow.com/v1/contents" \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json"

# 创建内容
curl -X POST "https://api.content-workflow.com/v1/contents" \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "新文章",
    "content": "文章内容...",
    "status": "draft"
  }'
```

## 更新日志

### v1.2.0 (2024-01-15)
- 新增内容调度发布功能
- 支持批量操作API
- 优化文件上传性能

### v1.1.0 (2024-01-01)
- 新增Webhook支持
- 增加统计分析API
- 支持内容版本管理

### v1.0.0 (2023-12-01)
- 初始版本发布
- 基础内容管理功能
- 用户认证和授权

## 支持

如有问题或建议，请联系：

- 📧 Email: api-support@content-workflow.com
- 📚 文档: https://docs.content-workflow.com
- 🐛 问题反馈: https://github.com/content-workflow/issues