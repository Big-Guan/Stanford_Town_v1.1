-- AI进化小镇 数据库结构
-- 适用于 Supabase / PostgreSQL

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户进度表
CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  inventory JSONB DEFAULT '[]'::jsonb,
  position JSONB DEFAULT '{"x": 7, "y": 6}'::jsonb,
  avatar TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 任务完成记录表
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  npc_id INTEGER NOT NULL,
  task_type VARCHAR(20) NOT NULL,
  submitted_content TEXT NOT NULL,
  ai_feedback TEXT,
  passed BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 排行榜视图 (实时计算)
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  u.username,
  up.score,
  u.avatar_url,
  up.updated_at
FROM users u
JOIN user_progress up ON u.id = up.user_id
ORDER BY up.score DESC
LIMIT 100;

-- 索引
CREATE INDEX IF NOT EXISTS idx_task_completions_user_id ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_created_at ON task_completions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_score ON user_progress(score DESC);

-- 自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 插入测试数据 (可选)
INSERT INTO users (username, email) VALUES 
  ('张伟', 'zhangwei@example.com'),
  ('Emily', 'emily@example.com'),
  ('Li Hua', 'lihua@example.com')
ON CONFLICT (username) DO NOTHING;

-- 初始化进度数据
INSERT INTO user_progress (user_id, score)
SELECT id, FLOOR(RANDOM() * 3000)
FROM users
ON CONFLICT (user_id) DO NOTHING;

-- 权限设置 (Supabase RLS)
-- 注意：根据实际需求调整权限策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- 允许所有用户读取排行榜
CREATE POLICY "允许所有人读取排行榜" ON user_progress
  FOR SELECT USING (true);

-- 用户只能修改自己的数据
CREATE POLICY "用户只能更新自己的进度" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能查看自己的任务记录" ON task_completions
  FOR SELECT USING (auth.uid() = user_id);

