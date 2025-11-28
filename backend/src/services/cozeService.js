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
 * @param {string} npcConfig.responseType - 响应类型：score_reason | markdown
 * @param {string} npcConfig.rewardType - 积分类型：fixed | dynamic
 * @param {string} content - 用户提交的内容
 * @returns {Promise<{passed: boolean, feedback: string, score?: number, markdown?: string}>}
 */
export async function validateWithCoze(npcConfig, content) {
  const { type, workflowId, botId, responseType = 'score_reason', rewardType = 'fixed' } = npcConfig

  if (!COZE_API_KEY) {
    console.error('[Coze] API Key 未配置')
    throw new Error('Coze API Key 未配置')
  }

  try {
    // 优先使用 workflowId（如果配置了）
    if (workflowId) {
      console.log(`[Coze] 调用 Workflow: ${workflowId} (type: ${type}, responseType: ${responseType})`)
      return await callWorkflow(workflowId, content, responseType, rewardType)
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
 * @param {string} responseType - 响应类型：score_reason | markdown
 * @param {string} rewardType - 积分类型：fixed | dynamic
 * @returns {Promise<{passed: boolean, feedback: string, score?: number, markdown?: string}>}
 */
async function callWorkflow(workflowId, input, responseType = 'score_reason', rewardType = 'fixed') {
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
      timeout: 180000, // 180s 超时，兼容复杂 Workflow
    }
  )

  // 解析 SSE 流式响应
  let responseText = typeof response.data === 'string' ? response.data : String(response.data)
  console.log('[Coze Workflow] 原始响应长度:', responseText.length)
  
  // 调试：打印原始响应前 500 字符
  console.log('[Coze Workflow] 原始响应预览:', responseText.substring(0, 500))

  const lines = responseText.split('\n')
  let messageData = null
  let allDataLines = [] // 收集所有 data 行用于调试

  // 查找包含有效 content 的 data 行（跳过空的 "{}"）
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line.startsWith('data: ')) {
      const dataJson = line.substring(6)
      allDataLines.push(dataJson)
      
      if (line.includes('"content"')) {
        try {
          const parsed = JSON.parse(dataJson)
          
          // 检查 content 是否有效（不是空的 "{}" 或空字符串）
          if (parsed.content && parsed.content !== '{}' && parsed.content.length > 5) {
            messageData = parsed
            console.log('[Coze Workflow] 找到有效 content 在第', i, '行')
            break
          }
        } catch (e) {
          // 尝试拼接多行 JSON
          let jsonStr = dataJson
          let j = i + 1
          while (j < lines.length) {
            jsonStr += '\n' + lines[j]
            try {
              const parsed = JSON.parse(jsonStr)
              if (parsed.content && parsed.content !== '{}' && parsed.content.length > 5) {
                messageData = parsed
                break
              }
            } catch (e2) {
              j++
              if (j - i > 10) break
            }
          }
          if (messageData && messageData.content) break
        }
      }
    }
  }
  
  // 调试：打印所有 data 行
  console.log('[Coze Workflow] 找到的 data 行数:', allDataLines.length)
  if (allDataLines.length > 0) {
    console.log('[Coze Workflow] 最后一个 data 行:', allDataLines[allDataLines.length - 1].substring(0, 200))
  }

  // 解析 content 字段
  let contentData = messageData?.content
  let content = null
  
  console.log('[Coze Workflow] messageData:', JSON.stringify(messageData)?.substring(0, 300))
  console.log('[Coze Workflow] contentData 类型:', typeof contentData)
  console.log('[Coze Workflow] contentData 值:', typeof contentData === 'string' ? contentData.substring(0, 200) : JSON.stringify(contentData)?.substring(0, 200))

  if (contentData) {
    // 尝试解析为 JSON
    if (typeof contentData === 'string') {
      try {
        const parsed = JSON.parse(contentData)
        // 如果解析出来是空对象 {}，保留原始字符串作为 markdown
        if (typeof parsed === 'object' && Object.keys(parsed).length === 0) {
          console.log('[Coze Workflow] 解析结果为空对象，使用原始字符串')
          content = { markdown: contentData }
        } else {
          content = parsed
        }
      } catch (e) {
        // 不是 JSON，可能是纯 Markdown 文本
        content = { markdown: contentData }
      }
    } else if (typeof contentData === 'object') {
      // 如果是空对象，尝试从其他字段获取
      if (Object.keys(contentData).length === 0) {
        console.log('[Coze Workflow] contentData 是空对象')
        // 尝试从 messageData 的其他字段获取
        const altContent = messageData?.output || messageData?.data || messageData?.result || messageData?.text
        if (altContent) {
          content = { markdown: typeof altContent === 'string' ? altContent : JSON.stringify(altContent) }
        }
      } else {
        content = contentData
      }
    }
  }
  
  // 如果 content 仍然为空，尝试从最后一个 data 行解析
  if (!content || (typeof content === 'object' && !content.markdown && Object.keys(content).length === 0)) {
    console.log('[Coze Workflow] content 为空，尝试从最后的 data 行解析')
    for (let i = allDataLines.length - 1; i >= 0; i--) {
      try {
        const lastData = JSON.parse(allDataLines[i])
        const possibleContent = lastData.content || lastData.output || lastData.data || lastData.result || lastData.text
        if (possibleContent && typeof possibleContent === 'string' && possibleContent.length > 10) {
          console.log('[Coze Workflow] 从第', i, '个 data 行找到内容')
          content = { markdown: possibleContent }
          break
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
  }

  // 根据 responseType 处理响应
  if (responseType === 'markdown') {
    // Markdown 响应：直接返回文本内容
    const markdownText = content?.markdown || content?.text || content?.output || (typeof contentData === 'string' ? contentData : '') || ''
    console.log('[Coze Workflow] 最终 Markdown 响应:', markdownText.substring(0, 200) + '...')
    
    // 如果内容为空，返回错误
    if (!markdownText || markdownText === '{}' || markdownText.trim() === '') {
      console.warn('[Coze Workflow] Markdown 内容为空')
      return {
        passed: false,
        feedback: 'AI 返回内容为空，请稍后重试或联系管理员检查工作流配置。',
      }
    }
    
    return {
      passed: true,  // Markdown 类型提交即通过
      feedback: '任务完成！',
      markdown: markdownText,
    }
  }

  // score_reason 响应：提取 score 和 reason
  if (content && typeof content === 'object') {
     const score = content.score !== undefined ? Number(content.score) : null
    const reason = content.reason || content.feedback || content.message || '验证完成'
    
    // 判断是否通过：
    // 1. 如果有 pass/passed 字段，使用该字段
    // 2. 如果是动态积分模式且有 score，score > 0 即通过
    // 3. 否则默认不通过
    let passed = content.pass === true || content.passed === true
    if (!passed && rewardType === 'dynamic' && score !== null && score > 0) {
      passed = true  // 动态积分模式：有分数就算通过
    }

    console.log('[Coze Workflow] 验证结果:', { passed, reason, score, rewardType })

    const result = {
      passed,
      feedback: reason,
    }

    // 动态积分：返回 AI 给的分数
    if (rewardType === 'dynamic' && score !== null) {
      result.score = score
      result.dynamicReward = true
    }

    return result
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
      timeout: 180000,
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
    let answerCount = 0

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
        // Coze V3 流式响应中，每个 answer 事件的 content 是完整回复
        // 我们只取最后一个（最完整的）
        let content = null
        if (eventData.type === 'answer' && eventData.content) {
          content = eventData.content
          answerCount++
        } else if (eventData.message?.type === 'answer' && eventData.message?.content) {
          content = eventData.message.content
          answerCount++
        }
        
        // 每次遇到 answer 类型，用新内容覆盖（取最后一个完整回复）
        if (content) {
          answer = content
        }
      } catch (e) {
        // 忽略解析失败的行
      }
    }
    
    console.log('[Coze] 助教响应中找到', answerCount, '个 answer 事件')

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
