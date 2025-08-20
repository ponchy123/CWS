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

# 暴露端口
EXPOSE 3001

# 启动应用
CMD ["node", "src/index.js"]