# 使用官方的 Node.js 镜像作为基础镜像
FROM node:18-bullseye

# 设置工作目录
WORKDIR /app

# 将 package.json 和 package-lock.json 复制到容器中
COPY package*.json ./

# 复制项目所有文件到工作目录
COPY . .

# 安装依赖
RUN npm install
RUN npm rebuild node-nim --build-from-source

# 运行 Next.js 应用需要的端口
EXPOSE 9250 8080



# 设置环境变量
ENV NODE_ENV=development

# 启动应用
CMD ["npm", "run","dev"]
