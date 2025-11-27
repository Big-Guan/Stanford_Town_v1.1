# API 接口参考文档

## 基础信息

- **Base URL**: `http://localhost:3000` (开发环境)
- **Content-Type**: `application/json`
- **超时时间**: 30秒

---

## 接口列表

### 1. 健康检查

#### `GET /health`

检查服务器状态

**请求**:
```bash
curl http://localhost:3000/health
```

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-27T10:00:00.000Z"
}
```

---

### 2. 任务验证

#### `POST /api/validate`

验证用户提交的Prompt作业

**请求体**:
```json
{
  "npcType": "prompt",
  "content": "你是一个诗人，你的任务是写诗，要求五言绝句",
  "keywords": ["角色", "任务", "要求"]
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| npcType | string | 是 | NPC类型: `prompt` / `image` / `video` / `coze` |
| content | string | 是 | 用户提交的内容 |
| keywords | array | 否 | 验证关键词列表（用于降级验证） |

**响应 - 成功**:
```json
{
  "passed": true,
  "feedback": "完美的结构化提示词！逻辑清晰！"
}
```

**响应 - 失败**:
```json
{
  "passed": false,
  "feedback": "缺少核心要素。请确保包含'角色'、'任务'和'要求'。"
}
```

**错误码**:
- `400`: 缺少必要参数
- `500`: 服务器内部错误

**示例代码**:

```javascript
// JavaScript/React
const result = await fetch('http://localhost:3000/api/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    npcType: 'prompt',
    content: userInput,
    keywords: ['角色', '任务', '要求']
  })
})
const data = await result.json()
```

```bash
# cURL
curl -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "npcType": "prompt",
    "content": "你是诗人，任务是写诗，要求五言",
    "keywords": ["角色","任务","要求"]
  }'
```

---

### 3. AI助教问答

#### `POST /api/assistant`

向AI助教提问

**请求体**:
```json
{
  "question": "什么是结构化提示词？"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| question | string | 是 | 用户的问题 |

**响应**:
```json
{
  "answer": "结构化提示词是指包含角色、任务、要求三要素的提示词。例如：你是一个[角色]，你的[任务]是..., [要求]..."
}
```

**错误码**:
- `400`: 未提供问题
- `500`: 服务器错误（会返回默认回复）

**示例代码**:

```javascript
// React Hook
const askQuestion = async (question) => {
  const response = await axios.post('/api/assistant', { question })
  return response.data.answer
}
```

---

### 4. 获取用户进度

#### `GET /api/user/:userId`

获取指定用户的游戏进度

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| userId | string | 用户UUID |

**响应**:
```json
{
  "user_id": "uuid-string",
  "score": 500,
  "inventory": [
    "✨ NVIDIA RTX 4090 (虚拟版)",
    "🎁 ChatGPT Plus 会员月卡"
  ],
  "position": {
    "x": 7,
    "y": 6
  },
  "avatar": "data:image/png;base64,...",
  "updated_at": "2025-11-27T10:00:00.000Z"
}
```

**错误码**:
- `404`: 用户不存在（返回默认数据）
- `500`: 服务器错误

---

### 5. 保存用户进度

#### `POST /api/user/save`

保存用户的游戏进度到云端

**请求体**:
```json
{
  "userId": "uuid-string",
  "data": {
    "score": 500,
    "inventory": ["item1", "item2"],
    "position": { "x": 10, "y": 5 },
    "avatar": "data:image/png;base64,..."
  }
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 用户UUID |
| data.score | number | 是 | 当前积分 |
| data.inventory | array | 是 | 背包物品列表 |
| data.position | object | 是 | 角色坐标 {x, y} |
| data.avatar | string | 否 | Base64编码的头像 |

**响应**:
```json
{
  "success": true,
  "message": "保存成功"
}
```

**错误码**:
- `400`: 缺少必要参数
- `500`: 保存失败

---

## 错误处理

### 标准错误响应

```json
{
  "error": "错误描述信息"
}
```

### 常见错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁（限流） |
| 500 | 服务器内部错误 |

---

## 速率限制

- **窗口期**: 15分钟
- **最大请求数**: 100次/IP
- **超出限制**: 返回 429 错误

```json
{
  "error": "请求过于频繁，请稍后再试"
}
```

---

## 数据模型

### NPC类型

```typescript
type NPCType = 'prompt' | 'image' | 'video' | 'coze'
```

### 用户进度

```typescript
interface UserProgress {
  user_id: string
  score: number
  inventory: string[]
  position: { x: number; y: number }
  avatar: string | null
  updated_at: string
}
```

### 验证结果

```typescript
interface ValidationResult {
  passed: boolean
  feedback: string
}
```

---

## WebSocket (未来支持)

### 实时排行榜更新

```javascript
// 计划中的功能
const socket = io('http://localhost:3000')
socket.on('leaderboardUpdate', (data) => {
  console.log('排行榜更新:', data)
})
```

---

## 认证 (未来支持)

### JWT Token

```http
Authorization: Bearer <your_jwt_token>
```

---

## 测试工具

### Postman Collection

导入以下JSON到Postman:

```json
{
  "info": { "name": "AI进化小镇 API" },
  "item": [
    {
      "name": "验证任务",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/validate",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"npcType\": \"prompt\",\n  \"content\": \"测试内容\",\n  \"keywords\": []\n}"
        }
      }
    }
  ],
  "variable": [
    { "key": "baseUrl", "value": "http://localhost:3000" }
  ]
}
```

---

## 常见问题

**Q: API返回CORS错误？**
A: 确保后端 `.env` 中的 `CORS_ORIGIN` 包含前端地址。

**Q: 超时怎么办？**
A: 检查网络连接，Coze API调用可能较慢。

**Q: 如何调试API？**
A: 查看后端日志：`cd backend && npm run dev`

---

## 更新日志

- **v2.0.0** (2025-11-27): 初始版本
  - 任务验证API
  - AI助教API
  - 用户进度API

---

## 支持

- 📖 [完整开发文档](../开发文档.md)
- 🐛 [GitHub Issues](../../issues)

