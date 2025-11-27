import express from 'express'
import * as db from '../services/databaseService.js'

const router = express.Router()

const saveThrottleMap = new Map()
const SAVE_THROTTLE_MS = 2000

const leaderboardCache = {
  data: [],
  timestamp: 0,
  limit: 0,
}

/**
 * POST /api/user/login
 * 用户登录/注册（唯一名称即可）
 */
router.post('/login', async (req, res) => {
  try {
    const { username } = req.body

    if (!username || username.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: '用户名至少需要2个字符' 
      })
    }

    const trimmedName = username.trim()

    // 检查用户是否存在
    const existingUser = await db.getUserByUsername(trimmedName)

    if (existingUser) {
      // 用户存在，返回用户数据
      const progress = await db.getUserProgress(existingUser.id)
      return res.json({
        success: true,
        isNewUser: false,
        user: {
          id: existingUser.id,
          username: existingUser.username,
          avatar_url: existingUser.avatar_url,
          ...progress,
        },
      })
    }

    // 用户不存在，创建新用户
    const newUser = await db.createUser(trimmedName)
    
    return res.json({
      success: true,
      isNewUser: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        avatar_url: null,
        score: 0,
        inventory: [],
        position: { x: 7, y: 6 },
        completed_npcs: [],
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, error: '登录失败，请稍后重试' })
  }
})

/**
 * GET /api/user/:userId
 * 获取用户进度
 */
router.get('/leaderboard/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10
    const now = Date.now()

    if (
      leaderboardCache.data.length > 0 &&
      leaderboardCache.limit === limit &&
      now - leaderboardCache.timestamp < 5000
    ) {
      return res.json(leaderboardCache.data)
    }

    const leaderboard = await db.getLeaderboard(limit)
    leaderboardCache.data = leaderboard
    leaderboardCache.timestamp = now
    leaderboardCache.limit = limit

    res.json(leaderboard)
  } catch (error) {
    console.error('Get leaderboard error:', error)
    res.status(500).json({ error: '获取排行榜失败' })
  }
})

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const progress = await db.getUserProgress(userId)
    res.json(progress)
  } catch (error) {
    console.error('Get user progress error:', error)
    res.status(500).json({ error: '获取用户数据失败' })
  }
})

router.post('/save', async (req, res) => {
  try {
    const { userId, data, forceSave = false } = req.body
    
    if (!userId || !data) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    const now = Date.now()
    const last = saveThrottleMap.get(userId) || 0

    if (!forceSave && now - last < SAVE_THROTTLE_MS) {
      return res.json({ success: true, message: '跳过频繁保存' })
    }

    saveThrottleMap.set(userId, now)

    await db.saveUserProgress(userId, data)
    res.json({ success: true, message: '保存成功' })
  } catch (error) {
    console.error('Save user progress error:', error)
    res.status(500).json({ error: '保存用户数据失败' })
  }
})

router.post('/complete-npc', async (req, res) => {
  try {
    const { userId, npcId, npcType, content, feedback, passed } = req.body

    if (!userId || !npcId) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    await db.saveTaskCompletion({
      userId,
      npcId,
      taskType: npcType,
      content,
      feedback,
      passed,
    })

    if (passed) {
      await db.addCompletedNPC(userId, npcId)
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Complete NPC error:', error)
    res.status(500).json({ error: '保存通关记录失败' })
  }
})

export default router
