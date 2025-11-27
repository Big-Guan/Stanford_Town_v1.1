import { create } from 'zustand'
import { INITIAL_MAP, NPCS } from '../config/gameConfig'
import { loginUser, saveUserProgress, getLeaderboard, completeNPC } from '../services/api'

export const useGameStore = create((set, get) => ({
  // ========================================
  // 认证状态
  // ========================================
  isLoggedIn: false,
  isLoading: false,

  // ========================================
  // 玩家状态
  // ========================================
  player: {
    id: null,
    name: '',
    position: { x: 7, y: 6 },
    direction: 'down',
    score: 0,
    inventory: [],
    avatar: null,
    completedNPCs: [], // 已完成的NPC列表
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
  // 用户认证
  // ========================================
  login: async (username) => {
    set({ isLoading: true })

    try {
      const result = await loginUser(username)

      if (result.success) {
        const user = result.user

        set({
          isLoggedIn: true,
          isLoading: false,
          player: {
            id: user.id,
            name: user.username,
            position: user.position || { x: 7, y: 6 },
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
    set({
      isLoggedIn: false,
      player: {
        id: null,
        name: '',
        position: { x: 7, y: 6 },
        direction: 'down',
        score: 0,
        inventory: [],
        avatar: null,
        completedNPCs: [],
      },
      chatHistory: [],
      assistantConversationId: null,
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
  // 碰撞检测
  // ========================================
  canInteractWithNPC: (npcId) => {
    const state = get()
    const npc = NPCS.find((n) => n.id === npcId)
    if (!npc) return false

    const distance =
      Math.abs(npc.x - state.player.position.x) +
      Math.abs(npc.y - state.player.position.y)
    return distance <= 1.5
  },

  canMoveTo: (x, y) => {
    if (y < 0 || y >= INITIAL_MAP.length) return false
    if (x < 0 || x >= INITIAL_MAP[0].length) return false
    return INITIAL_MAP[y][x] !== 9
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
