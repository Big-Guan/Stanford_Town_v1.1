import express from 'express'
import { chatWithCozeAssistant } from '../services/cozeService.js'

const router = express.Router()

/**
 * POST /api/assistant
 * AI助教问答
 */
router.post('/', async (req, res) => {
  try {
    const { message, conversationId, userId } = req.body

    if (!message) {
      return res.status(400).json({ error: '请输入问题' })
    }

    console.log(`[Assistant] 问题: ${message}`)

    const result = await chatWithCozeAssistant({
      message,
      conversationId,
      userId,
    })

    res.json({
      answer: result.answer,
      conversationId: result.conversationId,
    })
  } catch (error) {
    console.error('Assistant error:', error)

    const defaultAnswer = `这是一个关于 "${req.body.message}" 的回答。

在真实环境中，这里会连接Coze AI助教来提供专业的解答。

💡 提示：请确保配置了COZE_API_KEY和COZE_BOT_ASSISTANT。

如需帮助，请参考开发文档中的Coze集成章节。`

    res.json({
      answer: defaultAnswer,
      conversationId: req.body.conversationId || null,
    })
  }
})

export default router

