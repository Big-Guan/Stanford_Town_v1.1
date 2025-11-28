import { create } from 'zustand'
import { LEVELS, getLevelConfig, getMapSize, isLevelCompleted, getRequiredNPCIds } from '../config/levels'
import { loginUser, saveUserProgress, getLeaderboard, completeNPC } from '../services/api'

export const useGameStore = create((set, get) => ({
  // ========================================
  // 认证状态
  // ========================================
  isLoggedIn: false,
  isLoading: false,

  // ========================================
  // 关卡状态
  // ========================================
  currentLevelIndex: 0,
  currentLevel: LEVELS[0] || null,
  
  // ========================================
  // 玩家状态
  // ========================================
  player: {
    id: null,
    name: '',
    position: LEVELS[0]?.startPosition || { x: 1, y: 1 },
    direction: 'down',
    score: 0,
    inventory: [],
    avatar: null,
    completedNPCs: [], // 已完成的NPC列表（跨关卡累计）
  },

  // ========================================
  // 游戏状态
  // ========================================
  activeNPC: null,
  showHelper: false,
  chatInput: '',
  chatHistory: [],
  leaderboard: [],
  saveTimer: null,
  isSaving: false,
  assistantConversationId: null,
  showLevelSelect: false, // 是否显示关卡选择界面

  // ========================================
  // Toast 状态
  // ========================================
  toast: {
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
  },

  showToast: (message, type = 'info', duration = 3000) => {
    set({
      toast: { visible: true, message, type, duration },
    })
  },

  hideToast: () => {
    set((state) => ({
      toast: { ...state.toast, visible: false },
    }))
  },

  // ========================================
  // 关卡系统
  // ========================================
  
  /**
   * 切换到指定关卡
   */
  loadLevel: (levelIndex) => {
    const level = getLevelConfig(levelIndex)
    if (!level) {
      get().showToast('关卡不存在', 'error')
      return false
    }

    set((state) => ({
      currentLevelIndex: levelIndex,
      currentLevel: level,
      player: {
        ...state.player,
        position: level.startPosition || { x: 1, y: 1 },
      },
      showLevelSelect: false,
    }))

    get().showToast(`进入关卡 ${level.id}: ${level.name}`, 'info')
    get().scheduleSaveProgress()
    return true
  },

  /**
   * 检查当前关卡是否完成
   */
  checkLevelCompletion: () => {
    const { currentLevel, currentLevelIndex, player } = get()
    if (!currentLevel) return false

    const completed = isLevelCompleted(currentLevel, player.completedNPCs)
    
    if (completed) {
      const nextLevelIndex = currentLevelIndex + 1
      
      if (nextLevelIndex < LEVELS.length) {
        // 还有下一关
        get().showToast(
          `🎉 恭喜通过【${currentLevel.name}】！\n3秒后进入下一关...`,
          'success',
          3000
        )
        setTimeout(() => {
          get().loadLevel(nextLevelIndex)
        }, 3000)
      } else {
        // 全部通关
        get().showToast(
          `🏆 恭喜！你已通关所有关卡！\n你是真正的 AI 大师！`,
          'success',
          5000
        )
      }
    }
    
    return completed
  },

  /**
   * 获取关卡进度
   */
  getLevelProgress: (levelIndex) => {
    const level = getLevelConfig(levelIndex)
    if (!level) return { completed: 0, total: 0, percent: 0 }

    const requiredIds = getRequiredNPCIds(level)
    const completedCount = requiredIds.filter(id => 
      get().player.completedNPCs.includes(id)
    ).length

    return {
      completed: completedCount,
      total: requiredIds.length,
      percent: requiredIds.length > 0 ? Math.round((completedCount / requiredIds.length) * 100) : 0,
    }
  },

  /**
   * 切换关卡选择界面
   */
  toggleLevelSelect: () => {
    set((state) => ({ showLevelSelect: !state.showLevelSelect }))
  },

  // ========================================
  // 用户认证
  // ========================================
  login: async (username) => {
    set({ isLoading: true })

    try {
      const result = await loginUser(username)

      if (result.success) {
        const user = result.user
        
        // 恢复关卡进度
        const savedLevelIndex = user.level_index || 0
        const level = getLevelConfig(savedLevelIndex)

        set({
          isLoggedIn: true,
          isLoading: false,
          currentLevelIndex: savedLevelIndex,
          currentLevel: level || LEVELS[0],
          player: {
            id: user.id,
            name: user.username,
            position: user.position || level?.startPosition || { x: 1, y: 1 },
            direction: 'down',
            score: user.score || 0,
            inventory: user.inventory || [],
            avatar: user.avatar_url || user.avatar || null,
            completedNPCs: user.completed_npcs || [],
          },
        })

        // 保存到localStorage
        localStorage.setItem('ai-town-user', JSON.stringify({
          id: user.id,
          username: user.username,
        }))

        // 获取排行榜
        get().fetchLeaderboard()

        if (result.isNewUser) {
          get().showToast(`欢迎新学员 ${username}！开始你的AI学习之旅吧！`, 'success')
        } else {
          get().showToast(`欢迎回来，${username}！`, 'info')
        }

        return true
      } else {
        set({ isLoading: false })
        get().showToast(result.error || '登录失败', 'error')
        return false
      }
    } catch (error) {
      set({ isLoading: false })
      console.error('Login error:', error)
      get().showToast('登录失败，请稍后重试', 'error')
      return false
    }
  },

  logout: async () => {
    await get().saveProgressNow(true)
    localStorage.removeItem('ai-town-user')
    
    const firstLevel = LEVELS[0]
    set({
      isLoggedIn: false,
      currentLevelIndex: 0,
      currentLevel: firstLevel,
      player: {
        id: null,
        name: '',
        position: firstLevel?.startPosition || { x: 1, y: 1 },
        direction: 'down',
        score: 0,
        inventory: [],
        avatar: null,
        completedNPCs: [],
      },
      chatHistory: [],
      assistantConversationId: null,
      showLevelSelect: false,
    })
    get().showToast('已退出登录', 'info')
  },

  // 尝试自动登录
  tryAutoLogin: async () => {
    const saved = localStorage.getItem('ai-town-user')
    if (saved) {
      try {
        const { username } = JSON.parse(saved)
        if (username) {
          await get().login(username)
        }
      } catch (error) {
        console.error('Auto login failed:', error)
        localStorage.removeItem('ai-town-user')
      }
    }
  },

  // ========================================
  // 游戏初始化
  // ========================================
  initializeGame: () => {
    get().tryAutoLogin()
    return () => {}
  },

  // ========================================
  // 排行榜
  // ========================================
  fetchLeaderboard: async () => {
    try {
      const data = await getLeaderboard(10)
      set({ leaderboard: data })
    } catch (error) {
      console.error('Fetch leaderboard error:', error)
    }
  },

  // ========================================
  // 玩家移动
  // ========================================
  updatePosition: (newPos) => {
    set((state) => ({
      player: { ...state.player, position: newPos },
    }))
  },

  updateDirection: (direction) => {
    set((state) => ({
      player: { ...state.player, direction },
    }))
  },

  // ========================================
  // 积分系统
  // ========================================
  addScore: async (points) => {
    set((state) => ({
      player: { ...state.player, score: state.player.score + points },
    }))
    await get().saveProgressNow(true)
    get().fetchLeaderboard()
  },

  // ========================================
  // 背包系统
  // ========================================
  addInventory: (item) => {
    set((state) => {
      if (!state.player.inventory.includes(item)) {
        return {
          player: { ...state.player, inventory: [...state.player.inventory, item] },
        }
      }
      return state
    })
    get().scheduleSaveProgress()
  },

  // ========================================
  // 头像
  // ========================================
  uploadAvatar: (avatarData) => {
    set((state) => ({
      player: { ...state.player, avatar: avatarData },
    }))
    get().scheduleSaveProgress()
  },

  setPlayerAvatar: (avatarUrl) => {
    set((state) => ({
      player: { ...state.player, avatar: avatarUrl },
    }))
    get().scheduleSaveProgress()
  },

  // ========================================
  // NPC 通关系统
  // ========================================
  isNPCCompleted: (npcId) => {
    return get().player.completedNPCs.includes(npcId)
  },

  markNPCCompleted: async (npcId, npcType, content, feedback, passed) => {
    const state = get()

    // 记录到后端
    try {
      await completeNPC({
        userId: state.player.id,
        npcId,
        npcType,
        content,
        feedback,
        passed,
      })
    } catch (error) {
      console.error('Mark NPC completed error:', error)
    }

    // 更新本地状态
    if (passed && !state.player.completedNPCs.includes(npcId)) {
      set((state) => ({
        player: {
          ...state.player,
          completedNPCs: [...state.player.completedNPCs, npcId],
        },
      }))
      get().scheduleSaveProgress()
      
      // 检查关卡是否完成
      setTimeout(() => {
        get().checkLevelCompletion()
      }, 1000)
    }
  },

  // ========================================
  // NPC 对话
  // ========================================
  setActiveNPC: (npc) => {
    set({ activeNPC: npc })
  },

  setChatInput: (input) => {
    set({ chatInput: input })
  },

  addChatMessage: (role, text) => {
    set((state) => ({
      chatHistory: [...state.chatHistory, { role, text }],
    }))
  },

  setAssistantConversationId: (conversationId) => {
    set({ assistantConversationId: conversationId })
  },

  resetAssistantChat: () => {
    set({ chatHistory: [], assistantConversationId: null })
  },

  // ========================================
  // AI 助教
  // ========================================
  toggleHelper: () => {
    set((state) => ({ showHelper: !state.showHelper }))
  },

  // ========================================
  // 碰撞检测（使用当前关卡数据）
  // ========================================
  canInteractWithNPC: (npcId) => {
    const state = get()
    const { currentLevel, player } = state
    if (!currentLevel) return false

    const npc = currentLevel.npcs.find((n) => n.id === npcId)
    if (!npc) return false

    // 支持两种位置格式：{ x, y } 或 { position: { x, y } }
    const npcX = npc.x ?? npc.position?.x ?? 0
    const npcY = npc.y ?? npc.position?.y ?? 0

    const distance =
      Math.abs(npcX - player.position.x) +
      Math.abs(npcY - player.position.y)
    return distance <= 1.5
  },

  canMoveTo: (x, y) => {
    const { currentLevel } = get()
    if (!currentLevel || !currentLevel.map) return false

    const map = currentLevel.map
    if (y < 0 || y >= map.length) return false
    if (x < 0 || x >= map[0].length) return false
    return map[y][x] !== 9
  },

  // ========================================
  // 数据持久化
  // ========================================
  scheduleSaveProgress: () => {
    const { saveTimer } = get()
    if (saveTimer) return
    const timer = setTimeout(() => {
      get().saveProgressNow()
    }, 2000)
    set({ saveTimer: timer })
  },

  saveProgressNow: async (force = false) => {
    const state = get()
    if (!state.isLoggedIn || !state.player.id) return

    if (state.saveTimer) {
      clearTimeout(state.saveTimer)
      set({ saveTimer: null })
    }

    if (state.isSaving && !force) return

    set({ isSaving: true })

    try {
      await saveUserProgress(
        state.player.id,
        {
          score: state.player.score,
          inventory: state.player.inventory,
          position: state.player.position,
          avatar: state.player.avatar,
          completed_npcs: state.player.completedNPCs,
          level_index: state.currentLevelIndex, // 保存当前关卡
        },
        { forceSave: force }
      )
    } catch (error) {
      console.error('Save progress error:', error)
    } finally {
      set({ isSaving: false })
    }
  },
}))
