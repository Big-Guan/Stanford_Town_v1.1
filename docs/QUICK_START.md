# 🚀 快速开始指南

5分钟上手 AI 进化小镇开发！

---

## ⚡ 超快速启动（本地开发）

### 步骤 1: 安装依赖

```bash
# 进入项目目录
cd ai-training-town

# 一键安装所有依赖
npm run install:all
```

### 步骤 2: 配置环境变量

```bash
# 后端配置（必须）
cd backend
cp .env.example .env
```

编辑 `backend/.env`，**最少配置**：

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# 暂时不配置 Coze 也能运行（会使用本地验证）
# COZE_API_KEY=
```

### 步骤 3: 启动项目

```bash
# 回到根目录
cd ..

# 同时启动前后端
npm run dev
```

### 步骤 4: 访问应用

打开浏览器：`http://localhost:5173`

✅ **恭喜！你已经成功运行了项目！**

---

## 🎮 开始游戏

1. **移动角色**: 使用 `WASD` 或 `方向键`
2. **与NPC互动**: 走到NPC旁边，点击NPC
3. **完成任务**: 输入包含关键词的内容，点击"提交作业"
4. **查看积分**: 左侧面板显示你的积分和背包

### 测试任务示例

**提示词大师**（紫色巫师）：
```
你是一个诗人，你的任务是写一首诗，要求五言绝句。
```
✅ 包含"角色"、"任务"、"要求"，验证通过！

**光影画师**（粉色调色板）：
```
主体是一只猫，风格是赛博朋克，霓虹灯光效果。
```
✅ 包含"主体"、"风格"，验证通过！

---

## 🔧 进阶配置

### 配置 Coze API（可选但推荐）

1. 访问 [Coze官网](https://www.coze.com) 注册
2. 创建Bot（参考 `docs/COZE_SETUP.md`）
3. 获取API Key
4. 填入 `backend/.env`:

```env
COZE_API_KEY=pat_your_key_here
COZE_BOT_PROMPT=bot_xxx1
COZE_BOT_IMAGE=bot_xxx2
COZE_BOT_VIDEO=bot_xxx3
COZE_BOT_COZE=bot_xxx4
COZE_BOT_ASSISTANT=bot_xxx5
```

5. 重启后端：
```bash
cd backend
npm run dev
```

### 配置 Supabase 数据库（可选）

1. 访问 [Supabase](https://supabase.com) 创建项目
2. 运行 `backend/database/schema.sql`
3. 获取URL和Key
4. 填入 `backend/.env`:

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

---

## 📂 项目结构速览

```
ai-training-town/
├── frontend/          # React前端
│   ├── src/
│   │   ├── components/   # UI组件
│   │   ├── store/        # 状态管理
│   │   └── config/       # 配置
│   └── package.json
│
├── backend/           # Node.js后端
│   ├── src/
│   │   ├── routes/       # API路由
│   │   └── services/     # 业务逻辑
│   └── package.json
│
└── docs/              # 文档
    ├── COZE_SETUP.md     # Coze配置
    └── DEPLOYMENT.md     # 部署指南
```

---

## 🛠️ 常用命令

```bash
# 开发模式（热更新）
npm run dev

# 仅启动前端
npm run dev:frontend

# 仅启动后端
npm run dev:backend

# 构建生产版本
npm run build

# 安装依赖
npm run install:all
```

---

## 🐛 遇到问题？

### 端口被占用

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill
```

### 依赖安装失败

```bash
# 清除缓存
npm cache clean --force
rm -rf node_modules frontend/node_modules backend/node_modules
npm run install:all
```

### 前端无法访问后端

1. 检查后端是否启动：访问 `http://localhost:3000/health`
2. 查看浏览器控制台是否有CORS错误
3. 确认 `backend/.env` 的 `CORS_ORIGIN=http://localhost:5173`

---

## 📚 下一步

- 📖 阅读 [完整开发文档](../开发文档.md)
- 🤖 配置 [Coze AI验证](COZE_SETUP.md)
- 🚀 学习 [部署到生产环境](DEPLOYMENT.md)
- 🎨 自定义样式和地图

---

## 💡 提示

- **不配置Coze**: 使用本地关键词验证
- **不配置Supabase**: 数据存储在localStorage
- **最小配置**: 只需要Node.js即可运行

开始你的AI学习之旅吧！🎮

