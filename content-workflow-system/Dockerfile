FROM node:20-alpine

WORKDIR /app

# 安装必要的系统依赖
RUN apk add --no-cache python3 make g++

# 复制package文件
COPY package*.json ./

# 清理npm缓存并安装依赖
RUN npm cache clean --force && npm install

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3005

# 启动应用
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3005"]