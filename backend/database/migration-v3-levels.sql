-- 数据库迁移脚本 v3
-- 添加 user_progress.level_index 字段（关卡进度）

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_progress' AND column_name='level_index') THEN
        ALTER TABLE user_progress ADD COLUMN level_index INTEGER DEFAULT 0;
        RAISE NOTICE 'Added column level_index to user_progress table.';
    ELSE
        RAISE NOTICE 'Column level_index already exists in user_progress table.';
    END IF;
END
$$;

