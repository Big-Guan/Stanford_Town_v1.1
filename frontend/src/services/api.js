import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ========================================
// 用户认证 API
// ========================================

/**
 * 用户登录/注册
 * @param {string} username - 用户名
 * @returns {Promise<Object>} { success, isNewUser, user }
 */
export const loginUser = async (username) => {
  try {
    const response = await api.post('/api/user/login', { username })
    return response.data
  } catch (error) {
    console.error('Login API error:', error)
    throw error
  }
}

/**
 * 获取用户数据
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 用户进度数据
 */
export const getUserProgress = async (userId) => {
  try {
    const response = await api.get(`/api/user/${userId}`)
    return response.data
  } catch (error) {
    console.error('Get user progress error:', error)
    throw error
  }
}

/**
 * 保存用户进度
 * @param {string} userId - 用户ID
 * @param {Object} data - 用户数据
 * @returns {Promise<Object>}
 */
export const saveUserProgress = async (userId, data, options = {}) => {
  try {
    const response = await api.post('/api/user/save', {
      userId,
      data,
      forceSave: options.forceSave || false,
    })
    return response.data
  } catch (error) {
    console.error('Save progress error:', error)
    throw error
  }
}

/**
 * 上传头像文件到OSS
 * @param {File} file
 * @returns {Promise<{url: string}>}
 */
export const uploadAvatarFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await api.post('/api/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    console.error('Upload avatar error:', error)
    throw error
  }
}

/**
 * 记录NPC通关
 * @param {Object} data - { userId, npcId, npcType, content, feedback, passed }
 * @returns {Promise<Object>}
 */
export const completeNPC = async (data) => {
  try {
    const response = await api.post('/api/user/complete-npc', data)
    return response.data
  } catch (error) {
    console.error('Complete NPC error:', error)
    throw error
  }
}

// ========================================
// 排行榜 API
// ========================================

/**
 * 获取排行榜
 * @param {number} limit - 返回条数
 * @returns {Promise<Array>}
 */
export const getLeaderboard = async (limit = 10) => {
  try {
    const response = await api.get('/api/user/leaderboard/top', { params: { limit } })
    return response.data
  } catch (error) {
    console.error('Get leaderboard error:', error)
    return []
  }
}

// ========================================
// 任务验证 API
// ========================================

/**
 * 验证任务提交
 * @param {Object} npcConfig - NPC 配置 { type, workflowId?, botId? }
 * @param {string} content - 用户提交的内容
 * @returns {Promise<Object>} { passed, feedback }
 */
export const validateTask = async (npcConfig, content) => {
  try {
    const response = await api.post('/api/validate', {
      npcConfig,
      content,
    })
    return response.data
  } catch (error) {
    console.error('Validation API error:', error)
    // 降级返回
    return {
      passed: false,
      feedback: '验证服务暂时不可用，请稍后重试',
    }
  }
}

/**
 * 询问AI助教
 * @param {object} payload
 * @param {string} payload.message - 用户问题
 * @param {string} [payload.conversationId] - 会话ID
 * @returns {Promise<{answer: string, conversationId: string | null}>}
 */
export const askAssistant = async ({ message, conversationId }) => {
  try {
    const response = await api.post('/api/assistant', {
      message,
      conversationId,
    })
    return response.data
  } catch (error) {
    console.error('Assistant API error:', error)
    return {
      answer:
        '这是一个模拟的 AI 助教回复。在真实版本中，这里会连接 Coze API 来解答你关于 AI 的问题。',
      conversationId,
    }
  }
}

export default api
