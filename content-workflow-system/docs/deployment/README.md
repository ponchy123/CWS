# 部署文档

## 概述

本文档介绍了内容创作工作流系统的部署方法，包括开发环境、测试环境和生产环境的配置。

## 目录

- [环境要求](#环境要求)
- [开发环境部署](#开发环境部署)
- [生产环境部署](#生产环境部署)
- [Docker部署](#docker部署)
- [环境变量配置](#环境变量配置)
- [监控和日志](#监控和日志)
- [故障排除](#故障排除)

## 环境要求

### 基础要求

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0 或 **yarn**: >= 1.22.0
- **Docker**: >= 20.10.0 (可选)
- **Docker Compose**: >= 2.0.0 (可选)

### 系统要求

- **内存**: 最少 2GB，推荐 4GB+
- **存储**: 最少 10GB 可用空间
- **网络**: 稳定的互联网连接

## 开发环境部署

### 1. 克隆项目

```bash
git clone https://github.com/your-org/content-workflow-system.git
cd content-workflow-system
```

### 2. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
```

### 3. 环境配置

复制环境变量模板：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件：

```env
# 应用配置
VITE_APP_TITLE=内容创作工作流系统
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development

# API配置
VITE_API_BASE_URL=http://localhost:3001/api
VITE_API_TIMEOUT=10000

# 认证配置
VITE_AUTH_SECRET=your-auth-secret-key
VITE_JWT_EXPIRES_IN=7d

# 第三方服务
VITE_SENTRY_DSN=your-sentry-dsn
VITE_ANALYTICS_ID=your-analytics-id
```

### 4. 启动开发服务器

```bash
# 启动前端开发服务器
npm run dev

# 启动时指定端口
npm run dev -- --port 3000
```

### 5. 运行测试

```bash
# 运行所有测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

## 生产环境部署

### 1. 构建生产版本

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 2. 静态文件部署

构建完成后，`dist` 目录包含所有静态文件，可以部署到任何静态文件服务器。

#### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/content-workflow-system/dist;
    index index.html;
    
    # 启用 gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Apache 配置示例

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/content-workflow-system/dist
    
    # 启用压缩
    LoadModule deflate_module modules/mod_deflate.so
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \
            \.(?:gif|jpe?g|png)$ no-gzip dont-vary
        SetEnvIfNoCase Request_URI \
            \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
    </Location>
    
    # 缓存控制
    <FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </FilesMatch>
    
    # SPA 路由支持
    <Directory "/var/www/content-workflow-system/dist">
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

## Docker部署

### 1. 使用预构建镜像

```bash
# 拉取镜像
docker pull content-workflow-system:latest

# 运行容器
docker run -d \
  --name content-workflow-system \
  -p 80:80 \
  -e VITE_API_BASE_URL=https://api.your-domain.com \
  content-workflow-system:latest
```

### 2. 使用 Docker Compose

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=http://api:3001/api
      - VITE_APP_ENV=production
    depends_on:
      - api
    restart: unless-stopped
    
  api:
    image: content-workflow-api:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/content_workflow
    depends_on:
      - db
    restart: unless-stopped
    
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=content_workflow
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    
volumes:
  postgres_data:
```

启动服务：

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app
```

### 3. 生产环境 Docker 配置

`Dockerfile.prod`:

```dockerfile
# 多阶段构建
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产镜像
FROM nginx:alpine

# 复制构建结果
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

`nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
    
    # 基础配置
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    server {
        listen 80;
        server_name _;
        
        root /usr/share/nginx/html;
        index index.html;
        
        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        
        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # SPA 路由
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # 健康检查
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

## 环境变量配置

### 开发环境 (.env.local)

```env
# 应用基础配置
VITE_APP_TITLE=内容创作工作流系统
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development
VITE_APP_DEBUG=true

# API 配置
VITE_API_BASE_URL=http://localhost:3001/api
VITE_API_TIMEOUT=10000
VITE_API_RETRY_TIMES=3

# 认证配置
VITE_AUTH_SECRET=dev-secret-key
VITE_JWT_EXPIRES_IN=7d
VITE_REFRESH_TOKEN_EXPIRES_IN=30d

# 存储配置
VITE_STORAGE_PREFIX=content_workflow_dev
VITE_STORAGE_ENCRYPT=false

# 第三方服务
VITE_SENTRY_DSN=
VITE_ANALYTICS_ID=
VITE_HOTJAR_ID=

# 功能开关
VITE_FEATURE_ANALYTICS=false
VITE_FEATURE_ERROR_TRACKING=false
VITE_FEATURE_PERFORMANCE_MONITORING=false
```

### 生产环境 (.env.production)

```env
# 应用基础配置
VITE_APP_TITLE=内容创作工作流系统
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
VITE_APP_DEBUG=false

# API 配置
VITE_API_BASE_URL=https://api.your-domain.com/api
VITE_API_TIMEOUT=30000
VITE_API_RETRY_TIMES=3

# 认证配置
VITE_AUTH_SECRET=your-production-secret-key
VITE_JWT_EXPIRES_IN=24h
VITE_REFRESH_TOKEN_EXPIRES_IN=7d

# 存储配置
VITE_STORAGE_PREFIX=content_workflow
VITE_STORAGE_ENCRYPT=true

# 第三方服务
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_ANALYTICS_ID=GA-XXXXXXXXX
VITE_HOTJAR_ID=your-hotjar-id

# 功能开关
VITE_FEATURE_ANALYTICS=true
VITE_FEATURE_ERROR_TRACKING=true
VITE_FEATURE_PERFORMANCE_MONITORING=true

# CDN 配置
VITE_CDN_URL=https://cdn.your-domain.com
VITE_ASSETS_URL=https://assets.your-domain.com
```

## 监控和日志

### 1. 应用监控

#### Sentry 错误监控

```typescript
// src/lib/monitoring.ts
import * as Sentry from '@sentry/react';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_APP_ENV,
    tracesSampleRate: 1.0,
    integrations: [
      new Sentry.BrowserTracing(),
    ],
  });
}
```

#### 性能监控

```typescript
// src/lib/performance.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const sendToAnalytics = (metric: any) => {
  // 发送到分析服务
  if (import.meta.env.VITE_ANALYTICS_ID) {
    gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
    });
  }
};

// 监控核心 Web 指标
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### 2. 服务器监控

#### Docker 健康检查

```yaml
# docker-compose.yml
services:
  app:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

#### 日志收集

```yaml
# docker-compose.yml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 3. 监控仪表板

使用内置的监控仪表板：

```typescript
// 访问监控页面
http://your-domain.com/monitoring
```

## 故障排除

### 常见问题

#### 1. 构建失败

**问题**: `npm run build` 失败

**解决方案**:
```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install

# 检查 Node.js 版本
node --version  # 应该 >= 18.0.0
```

#### 2. 环境变量不生效

**问题**: 环境变量在生产环境中不生效

**解决方案**:
- 确保环境变量以 `VITE_` 开头
- 检查 `.env` 文件是否正确加载
- 在构建时确保环境变量可用

```bash
# 检查环境变量
echo $VITE_API_BASE_URL

# 构建时指定环境变量
VITE_API_BASE_URL=https://api.example.com npm run build
```

#### 3. 路由 404 错误

**问题**: 刷新页面时出现 404 错误

**解决方案**:
- 配置服务器支持 SPA 路由
- 确保所有路由都回退到 `index.html`

#### 4. API 请求失败

**问题**: 前端无法连接到 API

**解决方案**:
```bash
# 检查 API 服务状态
curl -f http://localhost:3001/api/health

# 检查网络连接
ping api.your-domain.com

# 检查防火墙设置
sudo ufw status
```

#### 5. Docker 容器启动失败

**问题**: Docker 容器无法启动

**解决方案**:
```bash
# 查看容器日志
docker logs content-workflow-system

# 检查容器状态
docker ps -a

# 重新构建镜像
docker build -t content-workflow-system .

# 清理 Docker 缓存
docker system prune -a
```

### 性能问题

#### 1. 页面加载慢

**诊断**:
```bash
# 分析构建包大小
npm run build -- --analyze

# 检查网络请求
# 使用浏览器开发者工具的 Network 面板
```

**优化**:
- 启用 gzip 压缩
- 配置 CDN
- 优化图片资源
- 代码分割

#### 2. 内存使用过高

**诊断**:
```bash
# 监控容器资源使用
docker stats content-workflow-system

# 检查内存泄漏
# 使用浏览器开发者工具的 Memory 面板
```

**优化**:
- 检查组件是否正确卸载
- 避免创建过多的事件监听器
- 使用 React.memo 优化渲染

### 安全问题

#### 1. HTTPS 配置

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

#### 2. 内容安全策略 (CSP)

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; 
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
               font-src 'self' https://fonts.gstatic.com; 
               img-src 'self' data: https:; 
               connect-src 'self' https://api.your-domain.com;">
```

## 部署检查清单

### 部署前检查

- [ ] 代码已通过所有测试
- [ ] 构建成功无错误
- [ ] 环境变量配置正确
- [ ] 依赖版本兼容
- [ ] 安全配置已更新
- [ ] 备份现有数据

### 部署后验证

- [ ] 应用正常启动
- [ ] 所有页面可访问
- [ ] API 接口正常
- [ ] 用户认证功能正常
- [ ] 文件上传功能正常
- [ ] 监控和日志正常
- [ ] 性能指标正常

### 回滚计划

- [ ] 备份当前版本
- [ ] 准备回滚脚本
- [ ] 测试回滚流程
- [ ] 通知相关人员

## 支持

如需部署支持，请联系：

- 📧 Email: devops@content-workflow.com
- 📚 文档: https://docs.content-workflow.com/deployment
- 🐛 问题反馈: https://github.com/content-workflow/system/issues
- 💬 技术支持: https://support.content-workflow.com