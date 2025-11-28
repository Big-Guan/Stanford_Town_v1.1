-- ========================================
-- AI进化小镇 数据库结构 v2.0
-- 适用于 阿里云 PostgreSQL
-- 数据库: ai_stanford_town_v1
-- ========================================

-- 注意：使用 VARCHAR(36) 存储 UUID，由应用层生成
-- 如果需要数据库自动生成，需要先启用 pgcrypto 或 uuid-ossp 扩展

-- ========================================
-- 1. 用户表
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户名唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ========================================
-- 2. 用户进度表
-- ========================================
CREATE TABLE IF NOT EXISTS user_progress (
    user_id VARCHAR(36) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    inventory JSONB DEFAULT '[]'::jsonb,
    position JSONB DEFAULT '{"x": 7, "y": 6}'::jsonb,
    avatar TEXT,
    completed_npcs JSONB DEFAULT '[]'::jsonb,  -- 已完成的NPC列表
    level_index INTEGER DEFAULT 0,              -- 当前关卡索引 (v3新增)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 积分索引（用于排行榜）
CREATE INDEX IF NOT EXISTS idx_user_progress_score ON user_progress(score DESC);

-- ========================================
-- 3. 任务完成记录表
-- ========================================
CREATE TABLE IF NOT EXISTS task_completions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    npc_id INTEGER NOT NULL,
    task_type VARCHAR(20) NOT NULL,
    submitted_content TEXT NOT NULL,
    ai_feedback TEXT,
    passed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_task_completions_user_id ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_created_at ON task_completions(created_at DESC);

-- ========================================
-- 4. 排行榜视图
-- ========================================
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    u.id,
    u.username,
    up.score,
    u.avatar_url,
    up.updated_at
FROM users u
JOIN user_progress up ON u.id = up.user_id
WHERE up.score > 0
ORDER BY up.score DESC
LIMIT 100;

-- ========================================
-- 5. 自动更新 updated_at 触发器
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 用户表触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 用户进度表触发器
DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 验证表创建
-- ========================================
SELECT 'users' as table_name, count(*) as row_count FROM users
UNION ALL
SELECT 'user_progress', count(*) FROM user_progress
UNION ALL
SELECT 'task_completions', count(*) FROM task_completions;

-- ========================================
-- 完成
-- ========================================
-- 执行此脚本后，数据库结构创建完成
-- 请在 backend/.env 中配置数据库连接信息
