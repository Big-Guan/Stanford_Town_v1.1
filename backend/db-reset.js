/**
 * 数据库重置脚本
 * AI进化小镇 v2.0
 * 
 * 功能：清空所有游戏数据，为新一批玩家准备干净的环境
 * 
 * 使用方法：
 *   node backend/db-reset.js              # 完全重置（清空所有数据）
 *   node backend/db-reset.js --progress   # 只重置进度（保留用户账号）
 *   node backend/db-reset.js --force      # 跳过确认直接重置
 */

import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '.env') })

const { Pool } = pg
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

// 解析命令行参数
const args = process.argv.slice(2)
const progressOnly = args.includes('--progress')
const forceMode = args.includes('--force')

/**
 * 获取用户确认
 */
async function confirmReset(message) {
  if (forceMode) {
    console.log('⚠️  强制模式：跳过确认')
    return true
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(`${message} 输入 "RESET" 确认: `, (answer) => {
      rl.close()
      resolve(answer.trim() === 'RESET')
    })
  })
}

/**
 * 获取数据统计
 */
async function getStats() {
  const result = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM users) as users,
      (SELECT COUNT(*) FROM user_progress) as progress,
      (SELECT COUNT(*) FROM task_completions) as tasks
  `)
  return result.rows[0]
}

/**
 * 完全重置：清空所有数据
 */
async function fullReset() {
  console.log('\n🔄 正在执行完全重置...')

  // 按顺序删除（考虑外键约束）
  const taskResult = await pool.query('DELETE FROM task_completions RETURNING *')
  console.log(`   ✅ 任务记录已清空 (删除 ${taskResult.rowCount} 条)`)
  
  const progressResult = await pool.query('DELETE FROM user_progress RETURNING *')
  console.log(`   ✅ 用户进度已清空 (删除 ${progressResult.rowCount} 条)`)
  
  const userResult = await pool.query('DELETE FROM users RETURNING *')
  console.log(`   ✅ 用户数据已清空 (删除 ${userResult.rowCount} 条)`)

  return {
    tasks: taskResult.rowCount,
    progress: progressResult.rowCount,
    users: userResult.rowCount
  }
}

/**
 * 进度重置：保留用户，只重置游戏进度
 */
async function progressReset() {
  console.log('\n🔄 正在重置游戏进度（保留用户账号）...')

  // 清空任务记录
  const taskResult = await pool.query('DELETE FROM task_completions RETURNING *')
  console.log(`   ✅ 任务记录已清空 (删除 ${taskResult.rowCount} 条)`)
  
  // 重置用户进度
  const progressResult = await pool.query(`
    UPDATE user_progress SET 
      score = 0,
      inventory = '[]'::jsonb,
      position = '{"x": 7, "y": 6}'::jsonb,
      completed_npcs = '[]'::jsonb,
      level_index = 0,
      updated_at = NOW()
    RETURNING *
  `)
  console.log(`   ✅ 用户进度已重置 (更新 ${progressResult.rowCount} 条)`)

  return {
    tasks: taskResult.rowCount,
    progress: progressResult.rowCount,
    users: 0
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('       AI进化小镇 数据库重置工具')
  console.log('═══════════════════════════════════════════════════════')
  
  // 检查数据库连接
  if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
    console.error('\n❌ 错误: 数据库凭证未配置')
    console.error('   请在 backend/.env 中配置 DB_USER 和 DB_PASSWORD')
    process.exit(1)
  }

  try {
    // 测试连接
    await pool.query('SELECT 1')
    console.log(`\n✅ 数据库连接成功: ${process.env.DB_HOST}/${process.env.DB_NAME}`)
  } catch (error) {
    console.error('\n❌ 数据库连接失败:', error.message)
    process.exit(1)
  }

  // 显示当前模式
  console.log(`\n📋 重置模式: ${progressOnly ? '进度重置（保留用户）' : '完全重置（清空所有）'}`)
  
  // 获取当前数据统计
  const stats = await getStats()
  console.log('\n📊 当前数据统计:')
  console.log(`   - 用户数: ${stats.users}`)
  console.log(`   - 进度记录: ${stats.progress}`)
  console.log(`   - 任务记录: ${stats.tasks}`)

  if (stats.users === '0' && stats.progress === '0' && stats.tasks === '0') {
    console.log('\n✅ 数据库已经是空的，无需重置')
    await pool.end()
    return
  }

  // 确认操作
  const confirmMessage = progressOnly 
    ? '\n⚠️  确认要重置所有玩家的游戏进度吗？（用户账号将保留）'
    : '\n⚠️  确认要清空所有游戏数据吗？（包括所有用户账号）'

  const confirmed = await confirmReset(confirmMessage)
  
  if (!confirmed) {
    console.log('\n❌ 操作已取消')
    await pool.end()
    return
  }

  // 执行重置
  try {
    const result = progressOnly ? await progressReset() : await fullReset()

    console.log('\n═══════════════════════════════════════════════════════')
    console.log('                     重置完成报告')
    console.log('═══════════════════════════════════════════════════════')
    console.log(`   📝 任务记录: 删除 ${result.tasks} 条`)
    console.log(`   📈 进度记录: ${progressOnly ? '重置' : '删除'} ${result.progress} 条`)
    if (!progressOnly) {
      console.log(`   👤 用户账号: 删除 ${result.users} 条`)
    }
    console.log('═══════════════════════════════════════════════════════')
    console.log('\n✅ 数据库重置完成！新一批玩家可以开始游戏了。\n')
  } catch (error) {
    console.error('\n❌ 重置失败:', error.message)
    process.exit(1)
  }

  await pool.end()
}

// 运行主函数
main().catch(error => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})

