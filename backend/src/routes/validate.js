import express from 'express'
import { validateWithCoze } from '../services/cozeService.js'

const router = express.Router()

/**
 * POST /api/validate
 * 验证用户提交的任务
 */
router.post('/', async (req, res) => {
  try {
    const { npcType, content, keywords } = req.body

    // 参数验证
    if (!npcType || !content) {
      return res.status(400).json({
        error: '缺少必要参数',
        passed: false,
      })
    }

    console.log(`[Validate] NPC类型: ${npcType}, 内容长度: ${content.length}`)

    // 调用Coze API验证
    const result = await validateWithCoze(npcType, content, keywords)

    res.json(result)
  } catch (error) {
    console.error('Validation error:', error)
    
    // 降级到本地验证
    const localResult = localValidate(req.body)
    res.json(localResult)
  }
})

/**
 * 本地验证逻辑（降级方案）
 */
function localValidate({ content, keywords = [] }) {
  if (!keywords || keywords.length === 0) {
    return {
      passed: true,
      feedback: '基本验证通过！（本地验证模式）',
    }
  }

  const lowerContent = content.toLowerCase()
  const missingKeywords = keywords.filter(
    (keyword) =>
      !content.includes(keyword) && !lowerContent.includes(keyword.toLowerCase())
  )

  if (missingKeywords.length === 0) {
    return {
      passed: true,
      feedback: `包含了所有关键要素：${keywords.join('、')}！做得很好！（本地验证模式）`,
    }
  } else {
    return {
      passed: false,
      feedback: `缺少关键要素：${missingKeywords.join('、')}。请补充完整。`,
    }
  }
}

export default router

