/**
 * 数据库健康检查和自动迁移脚本
 * AI进化小镇 v2.0
 * 
 * 功能：
 * 1. 检查数据库连接
 * 2. 验证表结构完整性
 * 3. 自动执行必要的迁移
 * 4. 输出健康报告
 */

import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 确保从正确的路径加载 .env 文件
dotenv.config({ path: path.join(__dirname, '.env') })

const { Pool } = pg

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

// 定义期望的数据库结构
const EXPECTED_SCHEMA = {
  users: {
    columns: ['id', 'username', 'email', 'avatar_url', 'created_at', 'updated_at'],
    required: ['id', 'username', 'created_at', 'updated_at']
  },
  user_progress: {
    columns: ['user_id', 'score', 'inventory', 'position', 'avatar', 'completed_npcs', 'level_index', 'updated_at'],
    required: ['user_id', 'score', 'inventory', 'position', 'completed_npcs', 'level_index', 'updated_at']
  },
  task_completions: {
    columns: ['id', 'user_id', 'npc_id', 'task_type', 'submitted_content', 'ai_feedback', 'passed', 'created_at'],
    required: ['id', 'user_id', 'npc_id', 'task_type', 'submitted_content', 'passed', 'created_at']
  }
}

// 迁移脚本
const MIGRATIONS = [
  {
    name: 'add_level_index_to_user_progress',
    check: async () => {
      const result = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'user_progress' AND column_name = 'level_index'
      `)
      return result.rows.length > 0
    },
    up: async () => {
      await pool.query(`
        ALTER TABLE user_progress 
        ADD COLUMN level_index INTEGER DEFAULT 0
      `)
    },
    description: '添加 level_index 字段到 user_progress 表'
  },
  {
    name: 'add_avatar_to_user_progress',
    check: async () => {
      const result = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'user_progress' AND column_name = 'avatar'
      `)
      return result.rows.length > 0
    },
    up: async () => {
      await pool.query(`
        ALTER TABLE user_progress 
        ADD COLUMN avatar TEXT
      `)
    },
    description: '添加 avatar 字段到 user_progress 表'
  },
  {
    name: 'add_score_index',
    check: async () => {
      const result = await pool.query(`
        SELECT indexname FROM pg_indexes 
        WHERE tablename = 'user_progress' AND indexname = 'idx_user_progress_score'
      `)
      return result.rows.length > 0
    },
    up: async () => {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_user_progress_score 
        ON user_progress(score DESC)
      `)
    },
    description: '为 user_progress.score 创建索引（排行榜优化）'
  }
]

async function checkConnection() {
  console.log('\n🔌 检查数据库连接...')
  
  if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
    console.error('❌ 错误: DB_USER 或 DB_PASSWORD 未配置')
    console.error('   请在 backend/.env 中配置数据库凭证')
    return false
  }

  try {
    const result = await pool.query('SELECT NOW() as server_time, current_database() as db_name')
    console.log(`✅ 数据库连接成功`)
    console.log(`   📍 主机: ${process.env.DB_HOST}:${process.env.DB_PORT}`)
    console.log(`   📁 数据库: ${result.rows[0].db_name}`)
    console.log(`   ⏰ 服务器时间: ${result.rows[0].server_time}`)
    return true
  } catch (error) {
    console.error(`❌ 数据库连接失败: ${error.message}`)
    return false
  }
}

async function checkTables() {
  console.log('\n📋 检查数据表...')
  
  const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `)
  
  const existingTables = result.rows.map(r => r.table_name)
  const requiredTables = Object.keys(EXPECTED_SCHEMA)
  
  let allExist = true
  for (const table of requiredTables) {
    if (existingTables.includes(table)) {
      console.log(`   ✅ ${table}`)
    } else {
      console.log(`   ❌ ${table} (不存在)`)
      allExist = false
    }
  }
  
  return allExist
}

async function checkTableColumns(tableName) {
  const result = await pool.query(`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns 
    WHERE table_name = $1
    ORDER BY ordinal_position
  `, [tableName])
  
  return result.rows
}

async function checkSchema() {
  console.log('\n🔍 检查表结构...')
  
  const issues = []
  
  for (const [tableName, schema] of Object.entries(EXPECTED_SCHEMA)) {
    const columns = await checkTableColumns(tableName)
    const columnNames = columns.map(c => c.column_name)
    
    console.log(`\n   📊 ${tableName}:`)
    
    for (const requiredCol of schema.required) {
      if (columnNames.includes(requiredCol)) {
        const col = columns.find(c => c.column_name === requiredCol)
        console.log(`      ✅ ${requiredCol} (${col.data_type})`)
      } else {
        console.log(`      ❌ ${requiredCol} (缺失)`)
        issues.push({ table: tableName, column: requiredCol, issue: 'missing' })
      }
    }
    
    // 检查可选字段
    for (const optionalCol of schema.columns.filter(c => !schema.required.includes(c))) {
      if (columnNames.includes(optionalCol)) {
        const col = columns.find(c => c.column_name === optionalCol)
        console.log(`      ✅ ${optionalCol} (${col.data_type}) [可选]`)
      } else {
        console.log(`      ⚠️  ${optionalCol} (可选字段缺失)`)
      }
    }
  }
  
  return issues
}

async function runMigrations() {
  console.log('\n🔄 检查并执行迁移...')
  
  let migrationsRun = 0
  
  for (const migration of MIGRATIONS) {
    const alreadyApplied = await migration.check()
    
    if (alreadyApplied) {
      console.log(`   ✅ ${migration.name} (已存在)`)
    } else {
      console.log(`   🔧 执行: ${migration.name}`)
      console.log(`      描述: ${migration.description}`)
      
      try {
        await migration.up()
        console.log(`      ✅ 完成`)
        migrationsRun++
      } catch (error) {
        console.log(`      ❌ 失败: ${error.message}`)
      }
    }
  }
  
  return migrationsRun
}

async function checkIndexes() {
  console.log('\n📇 检查索引...')
  
  const result = await pool.query(`
    SELECT indexname, tablename 
    FROM pg_indexes 
    WHERE schemaname = 'public'
  `)
  
  const expectedIndexes = [
    { name: 'idx_users_username', table: 'users' },
    { name: 'idx_user_progress_score', table: 'user_progress' },
    { name: 'idx_task_completions_user_id', table: 'task_completions' },
    { name: 'idx_task_completions_created_at', table: 'task_completions' },
  ]
  
  for (const idx of expectedIndexes) {
    const exists = result.rows.some(r => r.indexname === idx.name)
    if (exists) {
      console.log(`   ✅ ${idx.name} on ${idx.table}`)
    } else {
      console.log(`   ⚠️  ${idx.name} on ${idx.table} (缺失)`)
    }
  }
}

async function getTableStats() {
  console.log('\n📈 数据统计...')
  
  const tables = ['users', 'user_progress', 'task_completions']
  
  for (const table of tables) {
    try {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`)
      console.log(`   📊 ${table}: ${result.rows[0].count} 条记录`)
    } catch (error) {
      console.log(`   ❌ ${table}: 查询失败`)
    }
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('       AI进化小镇 数据库健康检查与自动迁移')
  console.log('═══════════════════════════════════════════════════════')
  
  // 1. 检查连接
  const connected = await checkConnection()
  if (!connected) {
    await pool.end()
    process.exit(1)
  }
  
  // 2. 检查表
  const tablesOk = await checkTables()
  if (!tablesOk) {
    console.log('\n⚠️  警告: 部分表不存在，请先运行 schema-aliyun.sql 初始化数据库')
    await pool.end()
    process.exit(1)
  }
  
  // 3. 检查并执行迁移
  const migrationsRun = await runMigrations()
  
  // 4. 检查表结构
  const issues = await checkSchema()
  
  // 5. 检查索引
  await checkIndexes()
  
  // 6. 数据统计
  await getTableStats()
  
  // 7. 总结报告
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('                     健康检查报告')
  console.log('═══════════════════════════════════════════════════════')
  
  if (issues.length === 0 && migrationsRun >= 0) {
    console.log('✅ 数据库状态: 健康')
    console.log(`📊 执行迁移数: ${migrationsRun}`)
    console.log('🚀 可以安全上线！')
  } else {
    console.log('⚠️  数据库状态: 需要注意')
    console.log(`❌ 发现问题: ${issues.length} 个`)
    for (const issue of issues) {
      console.log(`   - ${issue.table}.${issue.column}: ${issue.issue}`)
    }
  }
  
  console.log('═══════════════════════════════════════════════════════\n')
  
  await pool.end()
}

main().catch(error => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})

