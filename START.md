# 🚀 AI 进化小镇 - 快速启动指南

欢迎来到 AI 进化小镇！按照以下步骤，5分钟即可运行项目。

---

## ⚡ 一键启动（推荐）

### Windows 用户

1. 双击运行 `install.bat`（首次使用）
2. 双击运行 `start.bat`
3. 浏览器自动打开项目

### Mac/Linux 用户

```bash
# 首次使用
chmod +x install.sh start.sh
./install.sh

# 启动项目
./start.sh
```

---

## 📋 手动启动

### 步骤 1: 安装依赖

```bash
npm run install:all
```

### 步骤 2: 配置环境变量

```bash
cd backend
cp .env.example .env
# 编辑 .env，填写配置（可选，不填也能运行）
```

### 步骤 3: 启动项目

```bash
# 返回根目录
cd ..

# 启动开发服务器
npm run dev
```

### 步骤 4: 访问

打开浏览器：http://localhost:5173

---

## 🎮 如何游戏

1. **移动**: 使用 `WASD` 或 `↑↓←→` 方向键
2. **对话**: 走到 NPC 旁边，点击 NPC
3. **完成任务**: 输入符合要求的内容，点击"提交作业"
4. **查看进度**: 左侧面板显示积分和背包

---

## 🧪 测试答案

### 提示词大师（🧙‍♂️）
```
你是一个诗人，你的任务是写诗，要求五言绝句。
```

### 光影画师（🎨）
```
主体是一只猫，风格是赛博朋克。
```

### 视频导演（🎬）
```
推镜头特写，主体是城市夜景。
```

### Coze架构师（🤖）
```
人设、技能、知识库
```

---

## 📚 文档导航

- **完整开发文档**: [开发文档.md](./开发文档.md)
- **快速入门**: [docs/QUICK_START.md](./docs/QUICK_START.md)
- **Coze配置**: [docs/COZE_SETUP.md](./docs/COZE_SETUP.md)
- **部署指南**: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- **API文档**: [docs/API_REFERENCE.md](./docs/API_REFERENCE.md)

---

## 🔧 常见问题

### ❌ 启动错误：'concurrently' is not recognized

**原因**：根目录依赖未安装

**解决方法1**（推荐）：
```bash
# 重新安装根目录依赖
npm install
npm run dev
```

**解决方法2**：使用简单启动方式
```bash
# Windows
start-simple.bat

# Mac/Linux
chmod +x start-simple.sh
./start-simple.sh
```

**解决方法3**：手动分别启动
```bash
# 打开两个终端窗口

# 终端1：启动后端
cd backend
npm run dev

# 终端2：启动前端
cd frontend
npm run dev
```

### 端口被占用？

```bash
# 修改端口
# backend/.env -> PORT=3001
# frontend/.env -> VITE_API_URL=http://localhost:3001
```

### 依赖安装失败？

```bash
npm cache clean --force
npm run install:all
```

### 看不到NPC？

检查地图是否加载完成，刷新页面重试。

---

## 🌟 功能亮点

- ✅ 零配置即可运行（Coze可选）
- ✅ 纯CSS像素艺术（无外部图片）
- ✅ 本地数据持久化（localStorage）
- ✅ 实时排行榜动画
- ✅ 随机掉落系统

---

## 🚀 下一步

1. **配置Coze**: 获得真实AI验证 → [Coze配置指南](./docs/COZE_SETUP.md)
2. **连接数据库**: 数据云端同步 → [数据库配置](./backend/database/README.md)
3. **部署上线**: 分享给朋友 → [部署指南](./docs/DEPLOYMENT.md)

---

## 💡 技术栈

- **前端**: React 18 + Vite + Tailwind CSS
- **后端**: Node.js + Express
- **AI**: Coze API
- **数据库**: Supabase（可选）

---

## 🤝 需要帮助？

- 📖 查看 [完整文档](./开发文档.md)
- 🐛 提交 [Issue](../../issues)
- 💬 阅读 [常见问题](./开发文档.md#常见问题)

---

<div align="center">

**开始你的 AI 学习之旅！** 🎮

Made with ❤️

</div>

