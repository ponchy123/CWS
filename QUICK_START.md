# 快速开始 / Quick Start

⚡ 5 分钟快速启动内容创作工作流系统

## 🚀 最快方式：Docker Compose

```bash
# 1. 克隆项目
git clone https://github.com/your-org/content-workflow-system.git
cd content-workflow-system/content-workflow-system

# 2. 启动所有服务（一键启动）
docker-compose -f docker-compose.dev.yml up -d

# 3. 访问应用
# 前端: http://localhost:5173
# 后端: http://localhost:3001
```

就这么简单！✨

## 📋 前置要求

- [Docker](https://www.docker.com/get-started) 20.x+
- [Docker Compose](https://docs.docker.com/compose/install/) 2.x+

## 🔧 本地开发方式

如果您需要进行代码开发：

```bash
# 1. 克隆项目
git clone https://github.com/your-org/content-workflow-system.git
cd content-workflow-system/content-workflow-system

# 2. 安装依赖
npm install
cd server && npm install && cd ..

# 3. 启动数据库
docker-compose -f docker-compose.dev.yml up -d postgres redis

# 4. 配置环境变量
cp .env.example .env
cp server/.env.example server/.env

# 5. 启动前端（终端 1）
npm run dev

# 6. 启动后端（终端 2）
cd server && npm run dev
```

## ✅ 验证安装

### 检查服务

```bash
# 检查所有容器状态
docker-compose ps

# 检查后端健康
curl http://localhost:3001/api/health

# 应返回: {"status":"ok"}
```

### 浏览应用

1. 打开浏览器访问 `http://localhost:5173`
2. 注册一个测试账号
3. 开始探索功能！

## 🆘 遇到问题？

### 常见问题快速修复

**端口冲突**
```bash
# 修改 .env 文件中的端口
VITE_PORT=5174
PORT=3002
```

**容器启动失败**
```bash
# 重启所有容器
docker-compose down
docker-compose up -d --build
```

**数据库连接失败**
```bash
# 查看数据库日志
docker-compose logs postgres

# 重启数据库
docker-compose restart postgres
```

## 📚 详细文档

- [完整设置指南](./docs/SETUP_GUIDE.md) - 详细的安装步骤
- [开发指南](./docs/DEVELOPMENT_GUIDE.md) - 开发流程和规范
- [架构文档](./docs/ARCHITECTURE.md) - 系统架构说明
- [文档中心](./docs/README.md) - 所有文档索引

## 🎯 下一步

成功启动后，您可以：

1. 🎓 浏览 [用户手册](./README.md#核心功能详解) 了解所有功能
2. 👨‍💻 阅读 [开发指南](./docs/DEVELOPMENT_GUIDE.md) 开始开发
3. 🤝 查看 [贡献指南](./CONTRIBUTING.md) 参与贡献
4. 💡 尝试使用各个功能模块

## 📞 需要帮助？

- 📖 查看 [常见问题](./docs/SETUP_GUIDE.md#常见问题)
- 💬 提交 [GitHub Issue](https://github.com/your-org/content-workflow-system/issues)
- 📧 发邮件至 support@example.com

---

**提示**: 首次启动可能需要几分钟下载 Docker 镜像，请耐心等待。

祝您使用愉快！🎉
