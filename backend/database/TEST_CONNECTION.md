# 数据库连接测试指南

## 快速测试

在 `backend/` 目录下运行：

```bash
npm run test:db
```

或者直接运行：

```bash
node test-db-connection.js
```

## 测试内容

脚本会执行以下测试：

1. **基本连接（无SSL）** - 测试最基础的TCP连接
2. **SSL连接** - 测试SSL加密连接
3. **严格SSL连接** - 测试带证书验证的SSL连接

## 常见错误及解决方法

### 1. 连接超时 (ETIMEDOUT)

**错误信息**:
```
Connection terminated due to connection timeout
```

**原因**:
- 网络不通
- IP未加入白名单
- 防火墙阻止

**解决方法**:
1. 登录阿里云控制台
2. 进入 RDS 实例 → 数据安全性 → 白名单设置
3. 添加你的服务器IP地址
4. 如果是本地开发，添加你的公网IP

**获取公网IP**:
```bash
# Windows
curl ifconfig.me

# Mac/Linux
curl ifconfig.me
```

### 2. 认证失败 (28P01)

**错误信息**:
```
password authentication failed for user
```

**解决方法**:
1. 检查 `.env` 中的 `DB_USER` 和 `DB_PASSWORD`
2. 确认用户名和密码正确
3. 在RDS控制台重置密码

### 3. 数据库不存在 (3D000)

**错误信息**:
```
database "ai_stanford_town_v1" does not exist
```

**解决方法**:
1. 在RDS控制台创建数据库
2. 或修改 `.env` 中的 `DB_NAME`

### 4. 连接被拒绝 (ECONNREFUSED)

**错误信息**:
```
Connection refused
```

**解决方法**:
1. 检查端口是否正确（3432）
2. 检查RDS实例状态
3. 检查安全组规则

## 测试输出示例

### 成功连接

```
============================================================
🔍 阿里云 PostgreSQL 连接测试
============================================================

📋 连接配置:
   主机: mr-nzat664jyb4r6lpzje.rwlb.rds.aliyuncs.com
   端口: 3432
   数据库: ai_stanford_town_v1
   用户名: your_user
   密码: ✅ 已配置

🧪 测试 1: 基本连接（无SSL）...
   尝试连接...
   ✅ 连接成功！ (耗时: 234ms)
   执行测试查询...
   ✅ 查询成功！
   📊 PostgreSQL 版本: PostgreSQL 15.4
   ⏰ 服务器时间: 2025-11-27T10:00:00.000Z
   💾 当前数据库: ai_stanford_town_v1
   检查表结构...
   ✅ 发现 3 个表:
      - task_completions
      - user_progress
      - users
   ✅ 测试通过！
```

### 连接失败

```
🧪 测试 1: 基本连接（无SSL）...
   尝试连接...
   ❌ 连接失败
   📝 错误信息: Connection terminated due to connection timeout
   🔍 错误代码: ETIMEDOUT

💡 诊断建议:
   ⚠️  连接超时，可能原因:
      1. 网络不通 - 检查是否在同一VPC或已配置白名单
      2. 防火墙阻止 - 检查安全组规则
      3. 地址错误 - 确认内网地址是否正确

   🔧 解决方法:
      1. 在阿里云RDS控制台 → 数据安全性 → 白名单设置
      2. 添加你的服务器IP地址到白名单
      3. 如果是本地开发，需要添加你的公网IP
```

## 手动测试（使用 psql）

如果安装了 PostgreSQL 客户端：

```bash
psql -h mr-nzat664jyb4r6lpzje.rwlb.rds.aliyuncs.com \
     -p 3432 \
     -U 你的用户名 \
     -d ai_stanford_town_v1
```

## 网络诊断

### 测试端口连通性

```bash
# Windows
telnet mr-nzat664jyb4r6lpzje.rwlb.rds.aliyuncs.com 3432

# Mac/Linux
nc -zv mr-nzat664jyb4r6lpzje.rwlb.rds.aliyuncs.com 3432
```

### 测试DNS解析

```bash
# Windows
nslookup mr-nzat664jyb4r6lpzje.rwlb.rds.aliyuncs.com

# Mac/Linux
dig mr-nzat664jyb4r6lpzje.rwlb.rds.aliyuncs.com
```

## 需要帮助？

如果测试仍然失败，请提供：
1. 完整的错误信息
2. 你的网络环境（本地/服务器/VPC）
3. 是否已配置白名单

