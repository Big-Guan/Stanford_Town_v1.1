import express from 'express'
import { validateWithCoze } from '../services/cozeService.js'
import { addRecordToBitable, isFeishuConfigured } from '../services/feishuService.js'

const router = express.Router()

/**
 * POST /api/validate
 * 验证用户提交的任务
 * 
 * 请求体格式:
 * {
 *   npcConfig: {
 *     type: 'workflow' | 'bot',
 *     workflowId?: string,  // type='workflow' 时必填
 *     botId?: string,       // type='bot' 时必填
 *   },
 *   content: string,  // 用户提交的内容
 *   // 以下为飞书记录用（可选）
 *   playerName?: string,
 *   levelName?: string,
 *   npcName?: string,
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { npcConfig, content, playerName, levelName, npcName } = req.body

    // 参数验证
    if (!content) {
      return res.status(400).json({
        error: '缺少必要参数: content',
        passed: false,
      })
    }

    if (!npcConfig) {
      return res.status(400).json({
        error: '缺少必要参数: npcConfig',
        passed: false,
      })
    }

    // 验证至少有一个 ID
    if (!npcConfig.workflowId && !npcConfig.botId) {
      return res.status(400).json({
        error: 'NPC 配置需要提供 workflowId 或 botId',
        passed: false,
      })
    }

    console.log(`[Validate] 类型: ${npcConfig.type}, ID: ${npcConfig.workflowId || npcConfig.botId}, 内容长度: ${content.length}`)

    // 调用Coze API验证
    const result = await validateWithCoze(npcConfig, content)

    // 异步写入飞书多维表格（不阻塞响应）
    if (isFeishuConfigured() && playerName) {
      setImmediate(async () => {
        try {
          await addRecordToBitable({
            playerName,
            levelName: levelName || '',
            npcName: npcName || '',
            playerInput: content,
            aiResponse: result.markdown || result.feedback || '',
            score: result.score || 0,
            passed: result.passed,
          })
        } catch (err) {
          console.error('[Feishu] 异步写入失败:', err.message)
        }
      })
    }

    res.json(result)
  } catch (error) {
    console.error('Validation error:', error)
    
    // 返回错误信息
    res.status(500).json({
      passed: false,
      feedback: '验证服务暂时不可用，请稍后重试',
    })
  }
})

export default router
