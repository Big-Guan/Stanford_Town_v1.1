import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY

let supabase = null

// 初始化Supabase客户端
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  console.log('[Supabase] 已连接')
} else {
  console.warn('[Supabase] 未配置，数据将不会持久化')
}

/**
 * 保存用户进度
 * @param {string} userId - 用户ID
 * @param {Object} data - 用户数据
 */
export async function saveUserProgress(userId, data) {
  if (!supabase) {
    console.warn('[Supabase] 未初始化，跳过保存')
    return
  }

  try {
    const { error } = await supabase.from('user_progress').upsert({
      user_id: userId,
      score: data.score || 0,
      inventory: data.inventory || [],
      position: data.position || { x: 7, y: 6 },
      avatar: data.avatar || null,
      updated_at: new Date().toISOString(),
    })

    if (error) throw error
    console.log(`[Supabase] 用户 ${userId} 进度已保存`)
  } catch (error) {
    console.error('[Supabase] 保存失败:', error.message)
    throw error
  }
}

/**
 * 获取用户进度
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 用户数据
 */
export async function getUserProgress(userId) {
  if (!supabase) {
    console.warn('[Supabase] 未初始化，返回默认数据')
    return getDefaultProgress()
  }

  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 用户不存在，返回默认数据
        return getDefaultProgress()
      }
      throw error
    }

    console.log(`[Supabase] 用户 ${userId} 进度已加载`)
    return data
  } catch (error) {
    console.error('[Supabase] 读取失败:', error.message)
    return getDefaultProgress()
  }
}

/**
 * 获取默认用户进度
 */
function getDefaultProgress() {
  return {
    score: 0,
    inventory: [],
    position: { x: 7, y: 6 },
    avatar: null,
  }
}

/**
 * 记录任务完成记录
 * @param {Object} record - 完成记录
 */
export async function saveTaskCompletion(record) {
  if (!supabase) return

  try {
    const { error } = await supabase.from('task_completions').insert({
      user_id: record.userId,
      npc_id: record.npcId,
      task_type: record.taskType,
      submitted_content: record.content,
      ai_feedback: record.feedback,
      passed: record.passed,
      created_at: new Date().toISOString(),
    })

    if (error) throw error
    console.log(`[Supabase] 任务完成记录已保存`)
  } catch (error) {
    console.error('[Supabase] 记录保存失败:', error.message)
  }
}

