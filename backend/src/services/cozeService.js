import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

// API 基础配置
const COZE_API_BASE = process.env.COZE_API_BASE || 'https://api.coze.com/open_api/v2'
const COZE_WORKFLOW_API_BASE = process.env.COZE_WORKFLOW_API_BASE || 'https://api.coze.cn/v1'
const COZE_V3_API_BASE = process.env.COZE_V3_API_BASE || 'https://api.coze.cn/v3'
const COZE_API_KEY = process.env.COZE_API_KEY

// 助教 Bot ID（从环境变量读取）
const ASSISTANT_BOT_ID = process.env.COZE_BOT_ASSISTANT

// ============================================================
// 统一验证入口
// ============================================================

/**
 * 统一验证入口 - 根据 NPC 配置自动选择调用方式
 * @param {Object} npcConfig - NPC 配置
 * @param {string} npcConfig.type - NPC类型（prompt/image/video/coze 等）
 * @param {string} npcConfig.workflowId - Workflow ID（优先使用）
 * @param {string} npcConfig.botId - Bot ID（备选）
 * @param {string} content - 用户提交的内容
 * @returns {Promise<{passed: boolean, feedback: string}>}
 */
export async function validateWithCoze(npcConfig, content) {
  const { type, workflowId, botId } = npcConfig

  if (!COZE_API_KEY) {
    console.error('[Coze] API Key 未配置')
    throw new Error('Coze API Key 未配置')
  }

  try {
    // 优先使用 workflowId（如果配置了）
    if (workflowId) {
      console.log(`[Coze] 调用 Workflow: ${workflowId} (type: ${type})`)
      return await callWorkflow(workflowId, content)
    }

    // 其次使用 botId（如果配置了）
    if (botId) {
      console.log(`[Coze] 调用 Bot: ${botId} (type: ${type})`)
      return await callBot(botId, content)
    }

    // 都没配置则报错
    throw new Error(`NPC 配置错误 (type: ${type})：缺少 workflowId 或 botId`)
  } catch (error) {
    console.error('[Coze] 验证失败:', error.message)
    throw error
  }
}

// ============================================================
// Workflow API 调用
// ============================================================

/**
 * 调用 Coze Workflow API（流式响应）
 * @param {string} workflowId - Workflow ID
 * @param {string} input - 用户输入内容
 * @returns {Promise<{passed: boolean, feedback: string}>}
 */
async function callWorkflow(workflowId, input) {
  const response = await axios.post(
    `${COZE_WORKFLOW_API_BASE}/workflow/stream_run`,
    {
      workflow_id: workflowId,
      parameters: {
        input: input,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${COZE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  )

  // 解析 SSE 流式响应
  let responseText = typeof response.data === 'string' ? response.data : String(response.data)
  console.log('[Coze Workflow] 原始响应长度:', responseText.length)

  const lines = responseText.split('\n')
  let messageData = null

  // 查找包含 content 的 data 行
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line.startsWith('data: ') && line.includes('"content"')) {
      try {
        const dataJson = line.substring(6)
        messageData = JSON.parse(dataJson)

        if (messageData.content) {
          break
        }
      } catch (e) {
        // 尝试拼接多行 JSON
        let jsonStr = line.substring(6)
        let j = i + 1
        while (j < lines.length) {
          jsonStr += '\n' + lines[j]
          try {
            messageData = JSON.parse(jsonStr)
            if (messageData.content) break
          } catch (e2) {
            j++
            if (j - i > 10) break
          }
        }
        if (messageData && messageData.content) break
      }
    }
  }

  // 解析 content 字段（可能是 JSON 字符串）
  let content = null
  if (messageData && messageData.content) {
    const contentData = messageData.content

    if (typeof contentData === 'string') {
      try {
        content = JSON.parse(contentData)
      } catch (e) {
        console.warn('[Coze Workflow] 解析 content JSON 失败:', e.message)
      }
    } else if (typeof contentData === 'object') {
      content = contentData
    }
  }

  // 提取 pass 和 reason
  if (content && typeof content === 'object') {
    const passed = content.pass === true || content.passed === true
    const reason = content.reason || content.feedback || content.message || '验证完成'

    console.log('[Coze Workflow] 验证结果:', { passed, reason })

    return {
      passed,
      feedback: reason,
    }
  }

  // 降级处理
  console.warn('[Coze Workflow] 无法解析响应内容')
  return {
    passed: false,
    feedback: '验证服务响应格式异常，请稍后重试',
  }
}

// ============================================================
// Bot API 调用
// ============================================================

/**
 * 调用 Coze Bot API（V2 接口）
 * @param {string} botId - Bot ID
 * @param {string} query - 用户问题
 * @returns {Promise<{passed: boolean, feedback: string}>}
 */
async function callBot(botId, query) {
  const response = await axios.post(
    `${COZE_API_BASE}/chat`,
    {
      bot_id: botId,
      user: 'user_' + Date.now(),
      query,
      stream: false,
    },
    {
      headers: {
        Authorization: `Bearer ${COZE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  )

  const messages = response.data.messages || []
  const botReply = messages.find(msg => msg.role === 'assistant')?.content || ''

  console.log('[Coze Bot] 回复:', botReply.substring(0, 100))

  // 判断是否通过
  const passed = botReply.includes('通过') || botReply.includes('正确') || botReply.includes('完美')

  return {
    passed,
    feedback: botReply || '验证完成',
  }
}

// ============================================================
// AI 助教 API（V3 流式接口）
// ============================================================

/**
 * 调用 Coze 助教 Bot（V3 流式接口，支持连续对话）
 * @param {Object} params - 参数
 * @param {string} params.message - 用户问题
 * @param {string} params.conversationId - 会话ID（可选）
 * @param {string} params.userId - 用户ID（可选）
 * @returns {Promise<{answer: string, conversationId: string}>}
 */
export async function chatWithCozeAssistant({ message, conversationId, userId }) {
  if (!COZE_API_KEY || !ASSISTANT_BOT_ID) {
    console.warn('[Coze] 助教 API 未配置, COZE_API_KEY:', !!COZE_API_KEY, 'botId:', ASSISTANT_BOT_ID)
    throw new Error('Coze 助教 API 未配置')
  }

  const payload = {
    bot_id: ASSISTANT_BOT_ID,
    user_id: userId || `user_${Date.now()}`,
    stream: true,
    additional_messages: [
      {
        role: 'user',
        type: 'question',
        content_type: 'text',
        content: message,
      },
    ],
    parameters: {},
  }

  if (conversationId) {
    payload.conversation_id = conversationId
  }

  console.log('[Coze] 调用助教 API, bot_id:', ASSISTANT_BOT_ID)

  try {
    const response = await axios.post(`${COZE_V3_API_BASE}/chat`, payload, {
      headers: {
        Authorization: `Bearer ${COZE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
      responseType: 'text',
    })

    const rawText = response.data || ''
    console.log('[Coze] 助教 API 响应长度:', rawText.length)

    // 解析 SSE 流式响应
    let newConversationId = conversationId || null
    let answer = ''

    const lines = rawText.split('\n')
    for (const line of lines) {
      if (!line.startsWith('data:')) continue

      const jsonStr = line.substring(5).trim()
      if (!jsonStr || jsonStr === '[DONE]') continue

      try {
        const eventData = JSON.parse(jsonStr)

        // 提取 conversation_id
        if (eventData.conversation_id) {
          newConversationId = eventData.conversation_id
        }

        // 提取回复内容 (type=answer 的消息)
        if (eventData.type === 'answer' && eventData.content) {
          answer += eventData.content
        }

        // 兼容其他格式
        if (eventData.message?.type === 'answer' && eventData.message?.content) {
          answer += eventData.message.content
        }
      } catch (e) {
        // 忽略解析失败的行
      }
    }

    if (!answer) {
      console.warn('[Coze] 未能从响应中提取到回答')
      answer = '抱歉，我暂时无法回答这个问题。'
    }

    console.log('[Coze] 助教回复:', answer.substring(0, 100) + (answer.length > 100 ? '...' : ''))

    return {
      answer,
      conversationId: newConversationId,
    }
  } catch (error) {
    console.error('[Coze] 助教 API 调用失败:', error.response?.data || error.message)
    throw error
  }
}

/**
 * 简化版助教调用（不保持会话）
 */
export async function askCozeAssistant(question) {
  const result = await chatWithCozeAssistant({ message: question })
  return result.answer
}
