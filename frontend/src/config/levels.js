/**
 * 关卡配置模块
 * 
 * 从 levels.json 读取配置，提供统一的配置接口
 * 
 * 使用说明：
 * 1. 修改关卡配置：直接编辑 frontend/src/config/levels.json
 * 2. NPC 的 workflowId 或 botId 决定调用方式：
 *    - 配置了 workflowId 的会调用 Coze Workflow API
 *    - 配置了 botId 的会调用 Coze Bot API
 *    - type='assistant' 特殊类型，打开AI助教对话框
 * 3. 地图数字含义：0=草地, 1=路, 9=墙/障碍
 */

import levelsConfig from './levels.json'

// 从配置文件读取
export const CELL_SIZE = levelsConfig.cellSize || 48
export const MAP_WIDTH = levelsConfig.mapWidth || 24
export const MAP_HEIGHT = levelsConfig.mapHeight || 16
export const DROP_RATE = levelsConfig.dropRate || 0.01
export const PRIZE_POOL = levelsConfig.prizePool || [
  '✨ NVIDIA RTX 4090 (虚拟版)',
  '🎁 ChatGPT Plus 会员月卡',
  '💎 Midjourney Pro 订阅',
  '🚀 Coze 企业版权限',
  '🏆 AI 训练大师称号',
  '📚 AI 秘籍全集',
]

// 关卡列表
export const LEVELS = levelsConfig.levels || []

// ============================================================
// 辅助函数
// ============================================================

/**
 * 获取关卡配置
 * @param {number} levelIndex - 关卡索引（从0开始）
 * @returns {Object|null} 关卡配置
 */
export function getLevelConfig(levelIndex) {
  return LEVELS[levelIndex] || null
}

/**
 * 获取关卡地图尺寸
 * @param {Object} level - 关卡配置
 * @returns {{ width: number, height: number }}
 */
export function getMapSize(level) {
  if (!level || !level.map) return { width: MAP_WIDTH, height: MAP_HEIGHT }
  return {
    width: level.map[0]?.length || MAP_WIDTH,
    height: level.map.length || MAP_HEIGHT,
  }
}

/**
 * 获取关卡内所有需要完成的NPC ID列表
 * @param {Object} level - 关卡配置
 * @returns {string[]}
 */
export function getRequiredNPCIds(level) {
  if (!level || !level.npcs) return []
  // 排除 assistant 类型的 NPC（助教不需要通关）
  return level.npcs
    .filter(npc => npc.type !== 'assistant')
    .map(npc => npc.id)
}

/**
 * 检查关卡是否通关
 * @param {Object} level - 关卡配置
 * @param {string[]} completedNPCs - 已完成的NPC ID列表
 * @returns {boolean}
 */
export function isLevelCompleted(level, completedNPCs) {
  const requiredIds = getRequiredNPCIds(level)
  return requiredIds.every(id => completedNPCs.includes(id))
}

// 总关卡数
export const TOTAL_LEVELS = LEVELS.length

// 开发环境下的配置验证
if (import.meta.env.DEV) {
  console.log(`[Levels Config] 已加载 ${TOTAL_LEVELS} 个关卡`)
  LEVELS.forEach((level, index) => {
    const npcCount = level.npcs?.length || 0
    console.log(`[Levels Config] 关卡 ${level.id}: ${level.name} (${npcCount} 个NPC)`)
  })
}
