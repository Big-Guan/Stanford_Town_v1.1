import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const COZE_API_BASE = process.env.COZE_API_BASE || 'https://api.coze.com/open_api/v2'
const COZE_WORKFLOW_API_BASE = process.env.COZE_WORKFLOW_API_BASE || 'https://api.coze.cn/v1'
const COZE_V3_API_BASE = process.env.COZE_V3_API_BASE || 'https://api.coze.cn/v3'
const COZE_API_KEY = process.env.COZE_API_KEY

// Bot ID 映射
const BOT_IDS = {
  prompt: process.env.COZE_BOT_PROMPT,
  image: process.env.COZE_BOT_IMAGE,
  video: process.env.COZE_BOT_VIDEO,
  coze: process.env.COZE_BOT_COZE,
  assistant: process.env.COZE_BOT_ASSISTANT,
}

// Workflow ID 映射（三板斧大师等）
const WORKFLOW_IDS = {
  prompt: process.env.COZE_WORKFLOW_PROMPT || '7577280462872297522', // 三板斧大师
  image: process.env.COZE_WORKFLOW_IMAGE || '7577292626379784218', // 光影画师
  coze: process.env.COZE_WORKFLOW_COZE || '7577293475155345443', // Coze 架构师
  video: process.env.COZE_WORKFLOW_VIDEO || '7577294262040690734', // 视频导演大师
}

/**
 * 调用Coze Workflow API（三板斧大师等）
 * @param {string} workflowId - Workflow ID
 * @param {string} input - 用户输入内容
 * @returns {Promise<{passed: boolean, feedback: string}>}
 */
async function validateWithWorkflow(workflowId, input) {
  if (!COZE_API_KEY) {
    throw new Error('Coze API Key未配置')
  }

  try {
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

    // 解析Workflow响应（流式SSE格式）
    // 响应格式：id: 0\nevent: Message\ndata: {...}\n\nid: 1\nevent: Done\ndata: {...}
    let responseText = ''
    
    // 处理响应数据（可能是字符串或对象）
    if (typeof response.data === 'string') {
      responseText = response.data
    } else {
      responseText = String(response.data)
    }
    
    console.log('[Coze Workflow] 原始响应长度:', responseText.length)
    
    // 解析SSE格式：查找所有data行，找到包含content的那一行
    const lines = responseText.split('\n')
    let messageData = null
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // 查找 data: 开头的行，且包含content字段
      if (line.startsWith('data: ') && line.includes('"content"')) {
        try {
          const dataJson = line.substring(6) // 去掉 "data: " 前缀
          messageData = JSON.parse(dataJson)
          
          // 确认包含content字段
          if (messageData.content) {
            break
          }
        } catch (e) {
          // 如果整行解析失败，可能是多行JSON，尝试拼接
          let jsonStr = line.substring(6)
          let j = i + 1
          // 尝试拼接后续行直到找到完整的JSON
          while (j < lines.length) {
            jsonStr += '\n' + lines[j]
            try {
              messageData = JSON.parse(jsonStr)
              if (messageData.content) {
                break
              }
            } catch (e2) {
              j++
              if (j - i > 10) break // 防止无限循环
            }
          }
          if (messageData && messageData.content) break
        }
      }
    }
    
    // 从messageData中提取content（content是JSON字符串，需要再次解析）
    let content = null
    if (messageData && messageData.content) {
      const contentData = messageData.content
      
      // content是JSON字符串，需要解析
      if (typeof contentData === 'string') {
        try {
          // 直接解析JSON字符串
          content = JSON.parse(contentData)
        } catch (e) {
          console.warn('[Coze Workflow] 解析content JSON失败:', e.message)
          console.warn('[Coze Workflow] content内容:', contentData.substring(0, 200))
        }
      } else if (typeof contentData === 'object') {
        // 如果已经是对象，直接使用
        content = contentData
      }
    }

    // 提取pass和reason
    if (content && typeof content === 'object') {
      const passed = content.pass === true || content.passed === true
      const reason = content.reason || content.feedback || content.message || '验证完成'

      console.log('[Coze Workflow] 验证结果:', { passed, reason })

      return {
        passed,
        feedback: reason,
      }
    }

    // 降级处理：如果无法解析，返回默认结果
    console.warn('[Coze Workflow] 无法解析响应内容')
    console.warn('[Coze Workflow] 响应前500字符:', responseText.substring(0, 500))
    return {
      passed: false,
      feedback: '验证服务响应格式异常，请稍后重试',
    }
  } catch (error) {
    console.error('[Coze Workflow] API调用失败:', error.message)
    if (error.response) {
      console.error('[Coze Workflow] 响应数据:', error.response.data)
    }
    throw error
  }
}

/**
 * 调用Coze API进行验证
 * @param {string} npcType - NPC类型
 * @param {string} content - 用户提交的内容
 * @param {Array} keywords - 关键词列表（用于降级）
 * @returns {Promise<{passed: boolean, feedback: string}>}
 */
export async function validateWithCoze(npcType, content, keywords = []) {
  // 如果该 NPC 配置了 Workflow，则优先使用
  const workflowId = WORKFLOW_IDS[npcType]
  if (workflowId && COZE_API_KEY) {
    try {
      console.log(`[Coze] 使用Workflow API验证 (${npcType})`)
      return await validateWithWorkflow(workflowId, content)
    } catch (error) {
      console.warn(`[Coze] Workflow API失败 (${npcType})，降级到Bot API:`, error.message)
      // 降级到Bot API
    }
  }

  // 使用传统的Bot API
  const botId = BOT_IDS[npcType]

  if (!COZE_API_KEY || !botId) {
    console.warn('[Coze] API未配置，使用本地验证')
    throw new Error('Coze API未配置')
  }

  try {
    const response = await axios.post(
      `${COZE_API_BASE}/chat`,
      {
        bot_id: botId,
        user: 'user_' + Date.now(),
        query: content,
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

    // 解析Coze响应
    const messages = response.data.messages || []
    const botReply = messages.find((msg) => msg.role === 'assistant')?.content || ''

    console.log('[Coze] Bot回复:', botReply)

    // 判断是否通过（根据回复内容）
    const passed = botReply.includes('通过') || botReply.includes('正确') || botReply.includes('完美')

    return {
      passed,
      feedback: botReply || '验证完成',
    }
  } catch (error) {
    console.error('[Coze] API调用失败:', error.message)
    throw error
  }
}

/**
 * 调用Coze助教Bot (V3 流式接口)
 * @param {Object} params - 参数
 * @param {string} params.message - 用户问题
 * @param {string} params.conversationId - 会话ID（可选）
 * @param {string} params.userId - 用户ID（可选）
 * @returns {Promise<{answer: string, conversationId: string}>}
 */
export async function chatWithCozeAssistant({ message, conversationId, userId }) {
  const botId = BOT_IDS.assistant

  if (!COZE_API_KEY || !botId) {
    console.warn('[Coze] 助教API未配置, COZE_API_KEY:', !!COZE_API_KEY, 'botId:', botId)
    throw new Error('Coze助教API未配置')
  }

  const payload = {
    bot_id: botId,
    user_id: userId || `user_${Date.now()}`,
    stream: true, // 必须用流式才能直接拿到回复
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

  console.log('[Coze] 调用助教API, bot_id:', botId)

  try {
    const response = await axios.post(`${COZE_V3_API_BASE}/chat`, payload, {
      headers: {
        Authorization: `Bearer ${COZE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
      responseType: 'text', // 流式返回文本
    })

    const rawText = response.data || ''
    console.log('[Coze] 助教API响应长度:', rawText.length)

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
    console.error('[Coze] 助教API调用失败:', error.response?.data || error.message)
    throw error
  }
}

export async function askCozeAssistant(question) {
  const result = await chatWithCozeAssistant({ message: question })
  return result.answer
}

function extractAssistantAnswer(data) {
  if (!data) return ''

  if (Array.isArray(data.messages)) {
    const assistantMessage = [...data.messages]
      .reverse()
      .find((msg) => msg.role === 'assistant' || msg.role === 'bot')

    if (assistantMessage) {
      if (typeof assistantMessage.content === 'string') {
        return assistantMessage.content
      }

      if (Array.isArray(assistantMessage.content)) {
        const textBlock = assistantMessage.content.find((block) => block.type === 'text')
        if (textBlock?.text) return textBlock.text
      }
    }
  }

  if (Array.isArray(data.extra_contents)) {
    const textBlock = data.extra_contents.find((item) => item.type === 'text')
    if (textBlock?.text) return textBlock.text
  }

  if (typeof data.output_text === 'string') {
    return data.output_text
  }

  if (data.data?.answer) {
    return data.data.answer
  }

  return ''
}

