# 部署指南

本文档提供多种部署方案，适合不同的使用场景。

---

## 方案一：Vercel + Railway（推荐）

### 特点
- ✅ 完全免费
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ 适合个人项目和小团队

### 步骤

#### 1. 部署前端到 Vercel

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 进入前端目录
cd frontend

# 3. 部署
vercel

# 按照提示操作：
# - 登录 Vercel 账号
# - 选择项目
# - 设置环境变量（VITE_API_URL）
```

或者通过 Vercel 网页部署：
1. 登录 [Vercel](https://vercel.com)
2. 点击 **Import Project**
3. 连接 GitHub 仓库
4. 设置：
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Environment Variables**:
     - `VITE_API_URL`: 你的后端URL（Railway提供）

#### 2. 部署后端到 Railway

1. 登录 [Railway](https://railway.app)
2. 点击 **New Project > Deploy from GitHub**
3. 选择仓库，设置：
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`
4. 添加环境变量：
   - `PORT`: 3000
   - `NODE_ENV`: production
   - `COZE_API_KEY`: 你的Coze密钥
   - `COZE_BOT_*`: 各个Bot ID
   - `SUPABASE_URL`: Supabase URL
   - `SUPABASE_ANON_KEY`: Supabase密钥
   - `JWT_SECRET`: 随机字符串
   - `CORS_ORIGIN`: Vercel前端URL
5. 部署完成后，复制后端URL，更新Vercel的 `VITE_API_URL`

---

## 方案二：单服务器部署（适合自建）

### 前置要求
- Ubuntu 20.04+ / CentOS 7+
- Node.js 18+
- Nginx
- 域名（可选）

### 步骤

#### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 Nginx
sudo apt install -y nginx

# 安装 PM2（进程管理）
sudo npm install -g pm2
```

#### 2. 上传代码

```bash
# 方法1：Git Clone
cd /var/www
sudo git clone <your-repo-url> ai-town
cd ai-town

# 方法2：SCP上传
# 本地执行：
scp -r . user@your-server:/var/www/ai-town
```

#### 3. 安装依赖

```bash
cd /var/www/ai-town

# 安装根依赖
npm install

# 安装前后端依赖
npm run install:all
```

#### 4. 配置环境变量

```bash
# 后端配置
cd backend
cp .env.example .env
nano .env  # 填写真实配置

# 前端配置
cd ../frontend
echo "VITE_API_URL=http://your-domain.com/api" > .env
```

#### 5. 构建前端

```bash
cd frontend
npm run build
# 构建产物在 dist/ 目录
```

#### 6. 配置 Nginx

```bash
sudo nano /etc/nginx/sites-available/ai-town
```

粘贴以下配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 修改为你的域名

    # 前端静态文件
    location / {
        root /var/www/ai-town/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/ai-town /etc/nginx/sites-enabled/
sudo nginx -t  # 测试配置
sudo systemctl restart nginx
```

#### 7. 启动后端

```bash
cd /var/www/ai-town/backend
pm2 start src/server.js --name ai-town-backend
pm2 save  # 保存进程列表
pm2 startup  # 设置开机自启
```

#### 8. 配置 HTTPS（推荐）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取免费 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 方案三：Docker 部署

### 创建 Dockerfile

#### 前端 Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 后端 Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://backend:3000

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    env_file:
      - backend/.env
    restart: unless-stopped

  # 可选：添加 PostgreSQL
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ai_town
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 启动

```bash
docker-compose up -d
```

---

## 方案四：云平台一键部署

### AWS Amplify + Lambda

适合 AWS 用户，支持自动扩容。

### Google Cloud Run

适合 Google Cloud 用户，按需付费。

### 阿里云 / 腾讯云

使用云函数 + CDN 部署。

---

## 部署检查清单

- [ ] 环境变量已正确配置
- [ ] Coze API Key 有效
- [ ] Supabase 数据库已创建
- [ ] CORS 配置正确
- [ ] HTTPS 已启用（生产环境）
- [ ] 日志监控已配置
- [ ] 备份策略已设置

---

## 监控和维护

### PM2 常用命令

```bash
pm2 list              # 查看所有进程
pm2 logs ai-town-backend  # 查看日志
pm2 restart ai-town-backend  # 重启
pm2 stop ai-town-backend     # 停止
pm2 monit             # 实时监控
```

### 日志查看

```bash
# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 后端日志（PM2）
pm2 logs ai-town-backend
```

### 性能优化

1. **启用 Gzip 压缩**（Nginx）
2. **配置 CDN**（静态资源）
3. **数据库索引优化**
4. **API 响应缓存**

---

## 故障排查

### 前端无法连接后端

1. 检查 `VITE_API_URL` 是否正确
2. 检查 CORS 配置
3. 查看浏览器控制台错误

### Coze API 调用失败

1. 检查 API Key 是否正确
2. 检查网络连接
3. 查看后端日志

### 数据库连接失败

1. 检查 Supabase 配置
2. 确认数据库表已创建
3. 检查防火墙规则

---

## 回滚策略

```bash
# Git 回滚
git checkout <previous-commit>
npm run install:all
npm run build

# PM2 回滚（如果有历史版本）
pm2 reload ecosystem.config.js --update-env
```

---

## 联系支持

遇到问题？
- 查看 [GitHub Issues](../../issues)
- 阅读 [开发文档](../开发文档.md)

