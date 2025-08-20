@echo off
echo 🚀 启动内容创作工作流系统...

cd content-workflow-system

echo 📦 安装依赖...
call npm install

echo 🔨 构建项目...
call npm run build

echo 🌐 启动服务...
call npm run preview

pause