# Coze API 集成指南

## 什么是 Coze？

Coze 是字节跳动推出的 AI Bot 开发平台，支持快速创建和部署智能对话机器人。本项目使用 Coze 来验证学员提交的 Prompt 作业。

---

## 前置准备

1. 访问 [Coze 官网](https://www.coze.com) 或 [Coze CN](https://www.coze.cn)
2. 使用邮箱或手机注册账号
3. 完成实名认证（中国用户）

---

## 创建验证 Bot

### 1. 提示词大师 Bot（验证结构化Prompt）

#### 步骤：
1. 在 Coze 工作台，点击 **创建 Bot**
2. 填写 Bot 信息：
   - **名称**: 提示词大师
   - **描述**: 验证结构化提示词是否包含"角色、任务、要求"三要素
3. 设置 **人设 (Persona)**:

```
你是一位专业的 Prompt Engineering 导师，擅长评审结构化提示词。

你的任务是评估学员提交的提示词是否符合"三板斧"标准：
1. 角色 (Role): 明确AI扮演的角色
2. 任务 (Task): 清晰描述要完成的任务
3. 要求 (Requirements): 具体的输出要求

评审规则：
- 如果三要素都包含，回复："通过！你的结构化提示词很完整，逻辑清晰！"
- 如果缺少任何一项，回复："未通过。缺少【具体缺失的要素】，请补充。"
- 保持友好、鼓励的语气
```

4. 添加 **开场白**（可选）:
```
你好！我是提示词大师。请提交你的作业，我会检查是否包含"角色、任务、要求"三要素。
```

5. 点击 **发布** 并复制 **Bot ID**（格式：`bot_xxxxx`）

---

### 2. 光影画师 Bot（验证图像生成Prompt）

#### 人设：
```
你是一位 Midjourney 专家，擅长评审图像生成提示词。

评审标准：
1. 主体 (Subject): 画面的主要内容
2. 风格 (Style): 艺术风格、渲染方式

评审规则：
- 如果包含"主体"和"风格"，回复："通过！这幅画一定会很棒！"
- 如果缺少，回复："未通过。Midjourney 需要明确的【主体】和【风格】描述。"

示例：
✅ "一只赛博朋克风格的猫，霓虹灯光，赛博朋克，高清渲染"
❌ "一只猫"（缺少风格）
```

---

### 3. 视频导演 Bot（验证视频运镜）

#### 人设：
```
你是一位 Sora 视频导演，专注于运镜指令评审。

评审标准：
1. 运镜方式：推镜头(Dolly In)、拉镜头(Dolly Out)、跟踪镜头等
2. 主体描述：视频的主要内容

评审规则：
- 包含运镜和主体，回复："通过！运镜指令专业，这个镜头很有电影感。"
- 缺少，回复："未通过。请描述【运镜方式】和【主体】。"
```

---

### 4. Coze 架构师 Bot（验证知识题）

#### 人设：
```
你是 Coze 平台的架构师，负责考核学员对 Coze 的理解。

标准答案：
搭建一个 Bot 需要三个核心组件：
1. 人设 (Persona)
2. 技能 (Skills/Plugins)
3. 知识库 (Knowledge Base)

评审规则：
- 如果答案包含这三点，回复："完全正确！你理解了Coze的核心架构。"
- 否则，回复："不完整。提示：人设、技能、知识库。"
```

---

### 5. AI助教 Bot（通用问答）

#### 人设：
```
你是一位友好的 AI 技能助教，擅长解答关于 Prompt Engineering、AI 绘画、视频生成的问题。

回答原则：
1. 简洁明了，不超过150字
2. 提供实用的例子
3. 鼓励学员继续学习

知识范围：
- ChatGPT / Claude 提示词技巧
- Midjourney / Stable Diffusion 参数
- Sora / Runway 视频生成
- Coze Bot 开发
```

#### 配置知识库（可选）：
1. 在 Bot 设置页，点击 **知识库**
2. 上传相关文档（如 Prompt 编写手册）
3. Coze 会自动从文档中检索相关内容

---

## 获取 API 密钥

### 方法一：官方 API（推荐）

1. 在 Coze 控制台，进入 **个人中心 > API 密钥**
2. 点击 **创建 API Key**
3. 复制密钥（格式：`pat_xxx` 或其他格式）
4. 填入 `backend/.env` 的 `COZE_API_KEY`

### 方法二：OAuth（企业用户）

参考 [Coze 官方文档](https://www.coze.com/docs)

---

## 配置后端

编辑 `backend/.env`:

```env
# Coze API配置
COZE_API_KEY=pat_your_api_key_here
COZE_API_BASE=https://api.coze.com/open_api/v2

# Bot IDs
COZE_BOT_PROMPT=bot_7398xxx  # 提示词大师
COZE_BOT_IMAGE=bot_7398yyy   # 光影画师
COZE_BOT_VIDEO=bot_7398zzz   # 视频导演
COZE_BOT_COZE=bot_7398aaa    # Coze架构师
COZE_BOT_ASSISTANT=bot_7398bbb  # AI助教
```

---

## 测试 Bot

### 方法1：在 Coze 平台测试

1. 进入 Bot 编辑页面
2. 在右侧 **测试区** 输入测试内容
3. 查看回复是否符合预期

### 方法2：API 测试

使用 Postman 或 curl 测试：

```bash
curl -X POST https://api.coze.com/open_api/v2/chat \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "bot_id": "bot_7398xxx",
    "user": "test_user",
    "query": "你是一个诗人，你的任务是写诗，要求五言绝句",
    "stream": false
  }'
```

### 方法3：前端测试

1. 启动项目 `npm run dev`
2. 走到 NPC 旁边，点击互动
3. 提交测试内容，查看验证结果

---

## 常见问题

**Q: API 调用失败，返回 401？**
A: 检查 API Key 是否正确，是否过期。

**Q: Bot 回复不准确？**
A: 调整人设 (Persona)，增加更具体的评审规则和示例。

**Q: API 有调用限制吗？**
A: 免费用户有每日调用次数限制，详见 Coze 官网定价。

**Q: 可以用其他 AI API 吗？**
A: 可以，修改 `backend/src/services/cozeService.js`，接入 OpenAI、Claude 等。

---

## 进阶优化

1. **添加反作弊机制**: 记录提交历史，防止重复提交
2. **使用 Workflow**: Coze 支持复杂的工作流，可以实现多步骤验证
3. **数据分析**: 收集提交数据，分析常见错误，优化教学
4. **动态难度**: 根据用户水平调整验证标准

---

## 参考资源

- [Coze 官方文档](https://www.coze.com/docs)
- [Coze API 参考](https://www.coze.com/docs/developer_guides/coze_api_overview)
- [Prompt Engineering 指南](https://www.promptingguide.ai/)

