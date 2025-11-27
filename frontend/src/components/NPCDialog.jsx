import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { validateTask } from '../services/api'
import { DROP_RATE, PRIZE_POOL } from '../config/gameConfig'

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
  } = useGameStore()
  const [isLoading, setIsLoading] = useState(false)

  if (!activeNPC) return null

  const alreadyCompleted = isNPCCompleted(activeNPC.id)

  const handleSubmit = async () => {
    if (!chatInput.trim()) {
      showToast('请输入你的作业内容！', 'warning')
      return
    }

    setIsLoading(true)

    try {
      // 调用API验证
      const result = await validateTask({
        npcType: activeNPC.type,
        content: chatInput,
        keywords: activeNPC.keywords,
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
          addScore(100)

          // 随机掉落
          if (Math.random() < DROP_RATE) {
            const prize = PRIZE_POOL[Math.floor(Math.random() * PRIZE_POOL.length)]
            addInventory(prize)
            showToast(`🎉 运气爆棚！获得稀有物品：${prize}`, 'success', 5000)
          }

          showToast(
            `✅ 首次通关成功！\nAI 评价：${result.feedback}\n积分 +100`,
            'success',
            5000
          )
        } else {
          // 重复通关，不给积分
          showToast(
            `✅ 练习成功！\nAI 评价：${result.feedback}\n（已通关，不重复计分）`,
            'info',
            5000
          )
        }

        setActiveNPC(null)
        setChatInput('')
      } else {
        // 验证失败
        await markNPCCompleted(
          activeNPC.id,
          activeNPC.type,
          chatInput,
          result.feedback,
          false
        )
        showToast(`❌ 验证失败\nAI 评价：${result.feedback}\n请重试！`, 'error', 5000)
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
      <div className="glass-panel w-[500px] p-6 rounded-xl relative flex flex-col gap-4">
        <button
          onClick={() => setActiveNPC(null)}
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
              {activeNPC.title} | Coze 智能体支持
            </p>
          </div>
        </div>

        {/* 已通关提示 */}
        {alreadyCompleted && (
          <div className="bg-green-900/20 border border-green-500/30 p-3 rounded text-xs text-green-300 flex items-center gap-2">
            <span>🎓</span>
            <span>你已通关此任务！可以继续练习，但不会重复获得积分。</span>
          </div>
        )}

        <div className="bg-black/30 p-4 rounded text-sm text-gray-200 border border-white/5">
          <span className="text-yellow-400 font-bold">任务目标：</span>
          {activeNPC.desc}
        </div>

        <textarea
          className="w-full h-32 bg-slate-800 p-3 rounded text-xs text-white border border-gray-600 focus:border-blue-500 outline-none resize-none font-mono"
          placeholder="在此输入你的提示词作业..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          disabled={isLoading}
        ></textarea>

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
              智能体思考中...
            </>
          ) : alreadyCompleted ? (
            <>
              <span>🔄</span> 再次练习
            </>
          ) : (
            <>
              <span>✓</span> 提交作业 (验证)
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
