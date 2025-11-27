# AI 进化小镇 (AI Training Town) v2.0

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Node](https://img.shields.io/badge/Node-18+-green)
![License](https://img.shields.io/badge/license-MIT-orange)

**🎮 基于 Web 的游戏化 AI 技能培训平台**

沉浸式 RPG 风格 | 像素艺术 | Coze AI 驱动

</div>

---

## 📖 项目简介

AI进化小镇是一个类似"斯坦福小镇"的2D像素风虚拟社区。学员通过控制角色在地图上自由探索，与不同的"AI技能大师(NPC)"对话，完成结构化的Prompt编写任务，沉浸式地掌握AI技能。

### ✨ 核心特性

- 🗺️ **自由探索** - 基于网格的2D地图系统，WASD移动控制
- 🤖 **AI验证** - 集成Coze API，智能评判作业质量
- 🎯 **游戏化激励** - 积分系统、随机掉落、实时排行榜
- 🎨 **赛博朋克风格** - 像素艺术 + 玻璃拟态 UI + CRT扫描线特效
- 💬 **AI助教** - 实时答疑，知识库支持
- 🏆 **社交竞争** - 多人排行榜，营造学习氛围

---

## 🏗️ 技术架构

```
ai-training-town/
├── frontend/          # React前端 (Vite + Tailwind CSS)
├── backend/           # Node.js后端 (Express + Coze API)
├── docs/              # 完整开发文档
└── package.json       # 工作区配置
```

### 技术栈

**前端**
- React 18 + Hooks
- Vite (构建工具)
- Tailwind CSS 3
- Axios (HTTP客户端)
- Zustand (状态管理)

**后端**
- Node.js 18+
- Express 4
- Coze Open API
- Supabase (数据库)
- JWT (认证)

---

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Coze API Key ([申请地址](https://www.coze.com))
- Supabase账号 (可选，用于数据持久化)

### 安装步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd ai-training-town

# 2. 安装所有依赖（重要！）
npm run install:all

# 3. 配置环境变量（可选）
# 复制 .env.example 到 .env 并填写配置
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 4. 启动开发服务器
npm run dev
```

访问 `http://localhost:5173` 查看应用

### ⚠️ 启动问题排查

如果遇到 `'concurrently' is not recognized` 错误：

**方法1：重新安装依赖**
```bash
npm install
npm run dev
```

**方法2：使用简单启动方式（推荐）**
```bash
# Windows
start-simple.bat

# Mac/Linux
chmod +x start-simple.sh
./start-simple.sh
```

**方法3：手动分别启动**
```bash
# 终端1：启动后端
cd backend
npm run dev

# 终端2：启动前端
cd frontend
npm run dev
```

---

## 📝 环境变量配置

### Backend (.env)

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# Coze API配置
COZE_API_KEY=your_coze_api_key
COZE_BOT_PROMPT=bot_xxx1      # 提示词大师Bot ID
COZE_BOT_IMAGE=bot_xxx2       # 光影画师Bot ID
COZE_BOT_VIDEO=bot_xxx3       # 视频导演Bot ID
COZE_BOT_COZE=bot_xxx4        # Coze架构师Bot ID

# Supabase配置
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# JWT密钥
JWT_SECRET=your_random_secret_key
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=AI进化小镇
```

---

## 📚 开发文档

详细文档请查看 [开发文档.md](./开发文档.md)

- [项目架构说明](./docs/architecture.md)
- [API接口文档](./docs/api.md)
- [组件开发指南](./docs/components.md)
- [Coze集成指南](./docs/coze-integration.md)
- [部署指南](./docs/deployment.md)

---

## 🎮 使用说明

1. **注册/登录** - 创建你的角色
2. **上传头像** - 点击左侧头像上传自定义图片
3. **移动探索** - 使用 `WASD` 或 `方向键` 在地图上移动
4. **对话NPC** - 走到NPC旁边，点击互动
5. **完成任务** - 在输入框中提交你的Prompt作业
6. **获得奖励** - 通过验证后获得积分和随机掉落

---

## 🗺️ 开发路线图

### ✅ Phase 1 - MVP (当前版本)
- [x] 基础地图和移动系统
- [x] NPC交互框架
- [x] Coze API集成
- [x] 简单验证逻辑
- [x] 排行榜系统

### 🚧 Phase 2 - 增强版 (开发中)
- [ ] 用户认证系统
- [ ] 数据持久化
- [ ] 更多NPC和任务
- [ ] 成就系统
- [ ] 社交分享

### 📅 Phase 3 - 社区版 (规划中)
- [ ] 多人实时在线
- [ ] 公会系统
- [ ] UGC任务创建
- [ ] 移动端适配

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 License

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 💬 联系方式

- 问题反馈: [GitHub Issues](../../issues)
- 技术文档: [开发文档.md](./开发文档.md)

---

<div align="center">
Made with ❤️ for AI Education
</div>

