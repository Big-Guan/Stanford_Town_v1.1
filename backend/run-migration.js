/**
 * 数据库迁移脚本
 * 添加 completed_npcs 字段
 */

import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function migrate() {
  console.log('🚀 开始数据库迁移...')
  
  try {
    // 添加 completed_npcs 列
    await pool.query(`
      ALTER TABLE user_progress 
      ADD COLUMN IF NOT EXISTS completed_npcs JSONB DEFAULT '[]'::jsonb
    `)
    console.log('✅ completed_npcs 列已添加/确认存在')
    
    // 查看当前表结构
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_progress'
      ORDER BY ordinal_position
    `)
    
    console.log('\n📋 当前 user_progress 表结构:')
    result.rows.forEach(r => {
      console.log(`  - ${r.column_name}: ${r.data_type}`)
    })
    
    console.log('\n✅ 迁移完成!')
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ completed_npcs 列已存在，无需迁移')
    } else {
      console.error('❌ 迁移失败:', error.message)
    }
  } finally {
    await pool.end()
  }
}

migrate()

