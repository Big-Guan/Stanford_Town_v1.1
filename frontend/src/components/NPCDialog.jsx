import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { validateTask } from '../services/api'
import { DROP_RATE, PRIZE_POOL } from '../config/levels'

function NPCDialog() {
  const {
    activeNPC,
    chatInput,
    setChatInput,
    setActiveNPC,
    addScore,
    addInventory,
    showToast,
    isNPCCompleted,
    markNPCCompleted,
    currentLevel,
  } = useGameStore()
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState(null) // { message: string, passed: boolean }

  if (!activeNPC) return null

  // 如果是 assistant 类型，不显示对话框（由 AIAssistant 组件处理）
  if (activeNPC.type === 'assistant') {
    return null
  }

  const alreadyCompleted = isNPCCompleted(activeNPC.id)
  const reward = activeNPC.reward || 100

  const handleClose = () => {
    setActiveNPC(null)
    setFeedback(null)
    setChatInput('')
  }

  const handleSubmit = async () => {
    if (!chatInput.trim()) {
      showToast('请输入你的作业内容！', 'warning')
      return
    }

    setIsLoading(true)
    setFeedback(null)

    try {
      // 构建 NPC 配置对象传递给后端
      const npcConfig = {
        type: activeNPC.type,  // 'workflow' | 'bot'
        workflowId: activeNPC.workflowId,
        botId: activeNPC.botId,
      }

      // 调用API验证
      const result = await validateTask(npcConfig, chatInput)

      setFeedback({
        message: result.feedback,
        passed: result.passed
      })

      if (result.passed) {
        // 记录通关（会同步到后端）
        await markNPCCompleted(
          activeNPC.id,
          activeNPC.type,
          chatInput,
          result.feedback,
          true
        )

        if (!alreadyCompleted) {
          // 首次通关，给予积分
          addScore(reward)

          // 随机掉落
          if (Math.random() < DROP_RATE) {
            const prize = PRIZE_POOL[Math.floor(Math.random() * PRIZE_POOL.length)]
            addInventory(prize)
            showToast(`🎉 运气爆棚！获得稀有物品：${prize}`, 'success', 5000)
          }
        }
      } else {
        // 验证失败
        await markNPCCompleted(
          activeNPC.id,
          activeNPC.type,
          chatInput,
          result.feedback,
          false
        )
      }
    } catch (error) {
      console.error('Validation error:', error)
      showToast('验证服务暂时不可用，请稍后重试。', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-[500px] p-6 rounded-xl relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
          disabled={isLoading}
        >
          ✕
        </button>

        <div className="flex gap-4 items-center border-b border-white/10 pb-4">
          <div className="text-4xl">{activeNPC.avatar}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className={`text-lg ${activeNPC.color}`}>{activeNPC.name}</h2>
              {alreadyCompleted && (
                <span className="px-2 py-0.5 bg-green-600/30 text-green-400 text-[10px] rounded-full border border-green-500/30">
                  ✓ 已通关
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {currentLevel?.name} | {activeNPC.type === 'workflow' ? 'Workflow' : 'Bot'} 验证
            </p>
          </div>
        </div>

        {/* 已通关提示 */}
        {alreadyCompleted && !feedback && (
          <div className="bg-green-900/20 border border-green-500/30 p-3 rounded text-xs text-green-300 flex items-center gap-2">
            <span>🎓</span>
            <span>你已通关此任务！可以继续练习，但不会重复获得积分。</span>
          </div>
        )}

        <div className="bg-black/30 p-4 rounded text-sm text-gray-200 border border-white/5">
          <span className="text-yellow-400 font-bold">任务目标：</span>
          {activeNPC.task || activeNPC.desc}
        </div>

        <textarea
          className="w-full h-32 bg-slate-800 p-3 rounded text-xs text-white border border-gray-600 focus:border-blue-500 outline-none resize-none font-mono"
          placeholder="在此输入你的提示词作业..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          disabled={isLoading}
        ></textarea>

        {/* 反馈显示区域 */}
        {feedback && (
          <div className={`p-3 rounded text-xs border animate-fadeIn ${
            feedback.passed 
              ? 'bg-green-900/20 border-green-500/30 text-green-200' 
              : 'bg-red-900/20 border-red-500/30 text-red-200'
          }`}>
            <div className="font-bold mb-1 flex items-center gap-2">
              <span className="text-lg">{feedback.passed ? '✅' : '❌'}</span>
              <span>AI 评价：</span>
            </div>
            <div className="leading-relaxed whitespace-pre-wrap">
              {feedback.message}
            </div>
            {feedback.passed && !alreadyCompleted && (
              <div className="mt-2 text-yellow-400 font-bold">
                积分 +{reward}
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={`w-full py-3 text-white rounded font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            alreadyCompleted
              ? 'bg-gray-600 hover:bg-gray-500'
              : 'bg-blue-600 hover:bg-blue-500'
          }`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              AI 验证中...
            </>
          ) : alreadyCompleted ? (
            <>
              <span>🔄</span> 再次练习
            </>
          ) : (
            <>
              <span>✓</span> 提交作业
            </>
          )}
        </button>

        <div className="text-[10px] text-center text-gray-500">
          {alreadyCompleted
            ? '练习模式：不计分，但可以继续磨练技巧'
            : `${DROP_RATE * 100}% 概率掉落神秘大奖`}
        </div>
      </div>
    </div>
  )
}

export default NPCDialog
