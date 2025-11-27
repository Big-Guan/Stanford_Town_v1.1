/**
 * 阿里云 PostgreSQL 数据库服务
 * AI进化小镇 v2.0
 */

import pg from 'pg'
import dotenv from 'dotenv'
import { randomUUID } from 'crypto'

dotenv.config()

const { Pool } = pg

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'mr-nzat664jyb4r6lpzje.rwlb.rds.aliyuncs.com',
  port: parseInt(process.env.DB_PORT) || 3432,
  database: process.env.DB_NAME || 'ai_stanford_town_v1',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // 连接池配置
  max: 20,                    // 最大连接数
  idleTimeoutMillis: 30000,   // 空闲超时
  connectionTimeoutMillis: 10000, // 连接超时
  // SSL配置（阿里云可能需要）
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
}

let pool = null

/**
 * 初始化数据库连接池
 */
export async function initDatabase() {
  if (!dbConfig.user || !dbConfig.password) {
    console.warn('[Database] ⚠️ 数据库用户名或密码未配置，跳过数据库连接')
    console.warn('[Database] 请在 backend/.env 中配置 DB_USER 和 DB_PASSWORD')
    return false
  }

  try {
    pool = new Pool(dbConfig)
    
    // 测试连接
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    client.release()
    
    console.log('[Database] ✅ 阿里云 PostgreSQL 连接成功')
    console.log(`[Database] 📍 ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`)
    console.log(`[Database] ⏰ 服务器时间: ${result.rows[0].now}`)
    
    return true
  } catch (error) {
    console.error('[Database] ❌ 连接失败:', error.message)
    pool = null
    return false
  }
}

/**
 * 检查数据库是否已连接
 */
export function isConnected() {
  return pool !== null
}

/**
 * 执行 SQL 查询
 */
export async function query(text, params) {
  if (!pool) {
    throw new Error('数据库未连接')
  }
  const start = Date.now()
  const result = await pool.query(text, params)
  const duration = Date.now() - start
  console.log(`[Database] 执行查询 (${duration}ms): ${text.substring(0, 50)}...`)
  return result
}

// ========================================
// 用户认证相关
// ========================================

/**
 * 根据用户名获取用户
 */
export async function getUserByUsername(username) {
  if (!pool) {
    return null
  }

  try {
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    )
    return result.rows.length > 0 ? result.rows[0] : null
  } catch (error) {
    console.error('[Database] 查询用户失败:', error.message)
    return null
  }
}

/**
 * 创建新用户
 */
export async function createUser(username) {
  if (!pool) {
    throw new Error('数据库未连接')
  }

  const userId = randomUUID()

  try {
    // 创建用户
    await query(
      `INSERT INTO users (id, username, created_at, updated_at) 
       VALUES ($1, $2, NOW(), NOW())`,
      [userId, username]
    )

    // 创建初始进度
    await query(
      `INSERT INTO user_progress (user_id, score, inventory, position, completed_npcs, updated_at)
       VALUES ($1, 0, $2, $3, $4, NOW())`,
      [userId, JSON.stringify([]), JSON.stringify({ x: 7, y: 6 }), JSON.stringify([])]
    )

    console.log(`[Database] ✅ 新用户创建成功: ${username} (${userId})`)
    
    return { id: userId, username }
  } catch (error) {
    console.error('[Database] 创建用户失败:', error.message)
    throw error
  }
}

// ========================================
// 用户进度相关
// ========================================

/**
 * 获取用户进度
 */
export async function getUserProgress(userId) {
  if (!pool) {
    console.warn('[Database] 未连接，返回默认数据')
    return getDefaultProgress()
  }

  try {
    const result = await query(
      'SELECT * FROM user_progress WHERE user_id = $1',
      [userId]
    )

    if (result.rows.length === 0) {
      console.log(`[Database] 用户 ${userId} 进度不存在`)
      return getDefaultProgress()
    }

    console.log(`[Database] 用户 ${userId} 进度已加载`)
    const row = result.rows[0]
    return {
      user_id: row.user_id,
      score: row.score || 0,
      inventory: row.inventory || [],
      position: row.position || { x: 7, y: 6 },
      avatar: row.avatar,
      completed_npcs: row.completed_npcs || [],
      updated_at: row.updated_at,
    }
  } catch (error) {
    console.error('[Database] 读取进度失败:', error.message)
    return getDefaultProgress()
  }
}

/**
 * 创建用户进度记录（内部使用）
 */
export async function createUserProgress(userId) {
  if (!pool) return

  try {
    // 首先确保用户存在
    await query(
      `INSERT INTO users (id, username) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
      [userId, `学员_${userId.slice(0, 8)}`]
    )

    // 创建进度记录
    await query(
      `INSERT INTO user_progress (user_id, score, inventory, position, completed_npcs) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, 0, JSON.stringify([]), JSON.stringify({ x: 7, y: 6 }), JSON.stringify([])]
    )

    console.log(`[Database] 用户 ${userId} 进度已创建`)
  } catch (error) {
    console.error('[Database] 创建用户失败:', error.message)
  }
}

/**
 * 保存用户进度
 */
export async function saveUserProgress(userId, data) {
  if (!pool) {
    console.warn('[Database] 未连接，跳过保存')
    return
  }

  try {
    const result = await query(
      `INSERT INTO user_progress (user_id, score, inventory, position, avatar, completed_npcs, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         score = EXCLUDED.score,
         inventory = EXCLUDED.inventory,
         position = EXCLUDED.position,
         avatar = EXCLUDED.avatar,
         completed_npcs = EXCLUDED.completed_npcs,
         updated_at = NOW()
       RETURNING *`,
      [
        userId,
        data.score || 0,
        JSON.stringify(data.inventory || []),
        JSON.stringify(data.position || { x: 7, y: 6 }),
        data.avatar || null,
        JSON.stringify(data.completed_npcs || []),
      ]
    )

    console.log(`[Database] 用户 ${userId} 进度已保存，积分: ${data.score || 0}`)
    return result.rows[0]
  } catch (error) {
    console.error('[Database] 保存进度失败:', error.message)
    throw error
  }
}

/**
 * 添加已完成的NPC
 */
export async function addCompletedNPC(userId, npcId) {
  if (!pool) return

  try {
    // 使用JSONB操作符添加NPC到数组（如果不存在）
    await query(
      `UPDATE user_progress 
       SET completed_npcs = 
         CASE 
           WHEN NOT (completed_npcs @> $2::jsonb) 
           THEN completed_npcs || $2::jsonb 
           ELSE completed_npcs 
         END,
         updated_at = NOW()
       WHERE user_id = $1`,
      [userId, JSON.stringify([npcId])]
    )

    console.log(`[Database] 用户 ${userId} 完成NPC ${npcId}`)
  } catch (error) {
    console.error('[Database] 添加完成NPC失败:', error.message)
  }
}

/**
 * 检查NPC是否已完成
 */
export async function isNPCCompleted(userId, npcId) {
  if (!pool) return false

  try {
    const result = await query(
      `SELECT 1 FROM user_progress 
       WHERE user_id = $1 AND completed_npcs @> $2::jsonb`,
      [userId, JSON.stringify([npcId])]
    )
    return result.rows.length > 0
  } catch (error) {
    console.error('[Database] 检查NPC完成状态失败:', error.message)
    return false
  }
}

// ========================================
// 任务记录相关
// ========================================

/**
 * 记录任务完成
 */
export async function saveTaskCompletion(record) {
  if (!pool) return

  try {
    // 生成UUID（使用Node.js内置crypto模块）
    const taskId = randomUUID()
    
    await query(
      `INSERT INTO task_completions 
       (id, user_id, npc_id, task_type, submitted_content, ai_feedback, passed, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        taskId,
        record.userId,
        record.npcId,
        record.taskType,
        record.content,
        record.feedback,
        record.passed,
      ]
    )

    console.log(`[Database] 任务完成记录已保存`)
  } catch (error) {
    console.error('[Database] 记录任务失败:', error.message)
  }
}

// ========================================
// 排行榜相关
// ========================================

/**
 * 获取排行榜
 */
export async function getLeaderboard(limit = 10) {
  if (!pool) {
    return []
  }

  try {
    const result = await query(
      `SELECT u.username as name, up.score, up.updated_at
       FROM user_progress up
       JOIN users u ON up.user_id = u.id
       WHERE up.score > 0
       ORDER BY up.score DESC
       LIMIT $1`,
      [limit]
    )

    return result.rows
  } catch (error) {
    console.error('[Database] 获取排行榜失败:', error.message)
    return []
  }
}

// ========================================
// 工具函数
// ========================================

/**
 * 获取默认用户进度
 */
function getDefaultProgress() {
  return {
    score: 0,
    inventory: [],
    position: { x: 7, y: 6 },
    avatar: null,
    completed_npcs: [],
  }
}

/**
 * 关闭数据库连接
 */
export async function closeDatabase() {
  if (pool) {
    await pool.end()
    console.log('[Database] 连接已关闭')
  }
}

export default {
  initDatabase,
  isConnected,
  query,
  getUserByUsername,
  createUser,
  getUserProgress,
  saveUserProgress,
  createUserProgress,
  addCompletedNPC,
  isNPCCompleted,
  saveTaskCompletion,
  getLeaderboard,
  closeDatabase,
}
