# 阿里云 PostgreSQL 数据库配置指南

## 数据库信息

| 配置项 | 值 |
|--------|-----|
| 内网地址 | `mr-nzat664jyb4r6lpzje.rwlb.rds.aliyuncs.com` |
| 端口 | `3432` |
| 数据库名 | `ai_stanford_town_v1` |

---

## 配置步骤

### 第一步：创建数据库表

1. 登录阿里云 RDS 控制台
2. 连接到数据库 `ai_stanford_town_v1`
3. 执行 `schema-aliyun.sql` 脚本创建表结构

**方法1：使用 DMS（数据管理服务）**
- 在阿里云控制台 → RDS → 点击"登录数据库"
- 打开 SQL 编辑器
- 复制 `schema-aliyun.sql` 内容并执行

**方法2：使用命令行**
```bash
psql -h mr-nzat664jyb4r6lpzje.rwlb.rds.aliyuncs.com -p 3432 -U 你的用户名 -d ai_stanford_town_v1 -f schema-aliyun.sql
```

### 第二步：配置后端环境变量

编辑 `backend/.env` 文件：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 阿里云 PostgreSQL 数据库配置
DB_HOST=mr-nzat664jyb4r6lpzje.rwlb.rds.aliyuncs.com
DB_PORT=3432
DB_NAME=ai_stanford_town_v1
DB_USER=你的数据库用户名
DB_PASSWORD=你的数据库密码
DB_SSL=false

# JWT密钥
JWT_SECRET=your_random_secret_key

# CORS配置
CORS_ORIGIN=http://localhost:5173
```

### 第三步：安装依赖并启动

```bash
# 安装新增的 pg 依赖
cd backend
npm install

# 启动后端
npm run dev
```

成功连接后会看到：
```
[Database] ✅ 阿里云 PostgreSQL 连接成功
[Database] 📍 mr-nzat664jyb4r6lpzje.rwlb.rds.aliyuncs.com:3432/ai_stanford_town_v1
[Database] ⏰ 服务器时间: 2025-11-27T10:00:00.000Z
[Server] 数据库服务已就绪
```

---

## 常见问题

### Q1: 连接超时？

**原因**: 网络不通或白名单未配置

**解决**:
1. 确认你的机器IP已加入阿里云RDS白名单
2. 如果是本地开发，需要添加本地公网IP
3. 如果是内网地址，确保在同一VPC内

### Q2: 认证失败？

**检查**:
1. 用户名是否正确
2. 密码是否正确（注意特殊字符转义）
3. 用户是否有该数据库的访问权限

### Q3: 数据库不存在？

**解决**:
在阿里云 RDS 控制台创建数据库：
1. 进入实例详情
2. 点击"数据库管理"
3. 创建数据库 `ai_stanford_town_v1`

### Q4: 表不存在？

**解决**:
执行 `schema-aliyun.sql` 脚本创建表结构。

---

## 验证连接

启动后端后，访问：

```bash
curl http://localhost:3000/health
```

应返回：
```json
{
  "status": "ok",
  "timestamp": "2025-11-27T10:00:00.000Z"
}
```

---

## 表结构说明

### users 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| username | VARCHAR(50) | 用户名 |
| email | VARCHAR(100) | 邮箱 |
| avatar_url | TEXT | 头像URL |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### user_progress 表
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | UUID | 外键 → users.id |
| score | INTEGER | 积分 |
| inventory | JSONB | 背包物品 |
| position | JSONB | 玩家坐标 |
| avatar | TEXT | 头像Base64 |
| updated_at | TIMESTAMP | 更新时间 |

### task_completions 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 外键 → users.id |
| npc_id | INTEGER | NPC ID |
| task_type | VARCHAR(20) | 任务类型 |
| submitted_content | TEXT | 提交内容 |
| ai_feedback | TEXT | AI反馈 |
| passed | BOOLEAN | 是否通过 |
| created_at | TIMESTAMP | 创建时间 |

---

## 安全建议

1. **不要**将 `.env` 文件提交到版本控制
2. 使用强密码
3. 定期更换密码
4. 配置 RDS 白名单，只允许必要的IP访问
5. 生产环境考虑启用 SSL 连接

---

## 相关文件

- `schema-aliyun.sql` - 数据库表结构脚本
- `backend/src/services/databaseService.js` - 数据库服务代码
- `backend/.env` - 环境变量配置


