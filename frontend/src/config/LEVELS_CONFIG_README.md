# 关卡配置文件说明

## 📁 配置文件位置

`frontend/src/config/levels.json`

## 🎮 如何添加新关卡

### 1. 编辑 `levels.json`

在 `levels` 数组中添加新的关卡对象：

```json
{
  "id": 2,
  "name": "进阶学院",
  "description": "更高级的 AI 技能训练",
  "map": [
    [9, 9, 9, 9, 9, 9],
    [9, 0, 1, 1, 0, 9],
    [9, 0, 1, 0, 0, 9],
    [9, 9, 9, 9, 9, 9]
  ],
  "startPosition": {
    "x": 2,
    "y": 2
  },
  "npcs": [
    {
      "id": "new_master",
      "name": "新大师",
      "title": "大师称号",
      "avatar": "🧠",
      "x": 3,
      "y": 2,
      "color": "text-orange-400",
      "type": "custom",
      "workflowId": "你的Workflow ID",
      "task": "任务描述",
      "desc": "详细描述",
      "keywords": ["关键词1", "关键词2"],
      "reward": 150
    }
  ],
  "passCondition": {
    "type": "complete_all_npcs"
  }
}
```

### 2. 地图配置

- `0` = 草地（可通行）
- `1` = 道路（可通行）
- `9` = 墙/障碍（不可通行）

### 3. NPC 配置字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | NPC 唯一标识 |
| `name` | string | ✅ | NPC 显示名称 |
| `title` | string | ❌ | NPC 副标题 |
| `avatar` | string | ✅ | NPC 头像（emoji） |
| `x` | number | ✅ | NPC X 坐标 |
| `y` | number | ✅ | NPC Y 坐标 |
| `color` | string | ✅ | 文字颜色（Tailwind CSS 类名） |
| `type` | string | ✅ | NPC 类型（用于标识，不影响 API 调用） |
| `workflowId` | string | ⚠️ | Coze Workflow ID（与 botId 二选一） |
| `botId` | string | ⚠️ | Coze Bot ID（与 workflowId 二选一） |
| `task` | string | ✅ | 任务描述（显示在对话框中） |
| `desc` | string | ❌ | 详细描述（备用） |
| `keywords` | string[] | ❌ | 关键词列表（用于降级验证） |
| `reward` | number | ✅ | 通关奖励积分 |

### 4. API 调用方式

- **如果配置了 `workflowId`**：自动调用 Coze Workflow API
- **如果配置了 `botId`**：自动调用 Coze Bot API
- **如果都没配置**：会报错

### 5. 通关条件

目前支持：
- `complete_all_npcs`：完成所有 NPC 任务即可通关

## 🔄 热更新

修改 `levels.json` 后，需要**刷新浏览器**才能生效（Vite 开发模式下会自动检测文件变化）。

## 📝 示例：添加第二关

```json
{
  "id": 2,
  "name": "进阶学院",
  "description": "挑战更复杂的 AI 任务",
  "map": [
    [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
    [9, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 9],
    [9, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 9],
    [9, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 9],
    [9, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 9],
    [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9]
  ],
  "startPosition": { "x": 5, "y": 3 },
  "npcs": [
    {
      "id": "advanced_master_1",
      "name": "高级大师1",
      "avatar": "🧠",
      "x": 5,
      "y": 2,
      "color": "text-orange-400",
      "type": "advanced",
      "workflowId": "你的Workflow ID",
      "task": "完成高级任务",
      "reward": 200
    }
  ],
  "passCondition": {
    "type": "complete_all_npcs"
  }
}
```

## ⚠️ 注意事项

1. **JSON 格式**：确保 JSON 格式正确，可以使用在线 JSON 验证工具
2. **ID 唯一性**：每个关卡和 NPC 的 `id` 必须唯一
3. **坐标范围**：NPC 的 `x`、`y` 坐标必须在地图范围内，且不能是墙（9）
4. **Workflow/Bot ID**：确保配置的 ID 在 Coze 平台存在且可用

