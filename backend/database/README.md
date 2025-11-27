# 数据库配置指南

## Supabase 配置步骤

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并登录
2. 点击 "New Project" 创建新项目
3. 填写项目信息：
   - Name: `ai-training-town`
   - Database Password: 设置强密码（记住它！）
   - Region: 选择离你最近的区域

### 2. 运行数据库脚本

1. 在 Supabase 控制台，进入 **SQL Editor**
2. 创建新查询，粘贴 `schema.sql` 的内容
3. 点击 **Run** 执行脚本
4. 确认所有表创建成功

### 3. 获取 API 密钥

1. 在 Supabase 控制台，进入 **Settings > API**
2. 复制以下信息到 `.env` 文件：
   - **Project URL**: 填入 `SUPABASE_URL`
   - **anon public**: 填入 `SUPABASE_ANON_KEY`
   - **service_role**: 填入 `SUPABASE_SERVICE_KEY`（仅后端使用，保密！）

### 4. 配置行级安全策略 (RLS)

如果需要用户认证：
1. 在 Supabase 控制台，进入 **Authentication**
2. 启用邮箱登录或社交登录
3. 根据需要调整 RLS 策略

---

## 本地开发（不使用 Supabase）

如果暂时不想配置数据库，可以：

1. 不填写 `.env` 中的 `SUPABASE_*` 变量
2. 应用会自动使用 localStorage 存储数据（仅前端）
3. 数据不会在多设备间同步

---

## 数据表说明

### users
存储用户基本信息
- `id`: UUID 主键
- `username`: 用户名
- `email`: 邮箱
- `avatar_url`: 头像URL

### user_progress
存储用户游戏进度
- `user_id`: 关联users表
- `score`: 积分
- `inventory`: 背包物品（JSON数组）
- `position`: 玩家坐标（JSON对象）

### task_completions
存储任务完成记录（用于数据分析）
- `user_id`: 关联users表
- `npc_id`: NPC ID
- `task_type`: 任务类型
- `submitted_content`: 提交内容
- `ai_feedback`: AI反馈
- `passed`: 是否通过

---

## 常见问题

**Q: Supabase免费吗？**
A: 是的，免费层提供：
- 500MB 数据库空间
- 5GB 文件存储
- 50,000 月活用户
- 充足个人项目使用

**Q: 数据会丢失吗？**
A: Supabase 免费层数据不会丢失，但如果项目长期不活跃（>60天）可能会被暂停。

**Q: 可以用其他数据库吗？**
A: 可以，代码支持任何 PostgreSQL 数据库，只需修改连接配置。

