-- ========================================
-- AI进化小镇 数据库迁移 v2.0
-- 添加 completed_npcs 字段
-- ========================================

-- 添加 completed_npcs 列（如果不存在）
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_progress' 
        AND column_name = 'completed_npcs'
    ) THEN
        ALTER TABLE user_progress 
        ADD COLUMN completed_npcs JSONB DEFAULT '[]'::jsonb;
        
        RAISE NOTICE 'Column completed_npcs added successfully';
    ELSE
        RAISE NOTICE 'Column completed_npcs already exists';
    END IF;
END $$;

-- 验证
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_progress';

