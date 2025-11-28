import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
    saveNPCResponse,
    getNPCLastResponse,
    player,  // 获取玩家信息
  } = useGameStore()
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState(null) // { message: string, passed: boolean, score?: number, markdown?: string }
  const [copySuccess, setCopySuccess] = useState(false)

  // 打开对话框时，加载上次的回复
  useEffect(() => {
    if (activeNPC && activeNPC.type !== 'assistant') {
      const lastResponse = getNPCLastResponse(activeNPC.id)
      if (lastResponse) {
        setFeedback({
          ...lastResponse,
          isHistory: true, // 标记为历史记录
        })
      } else {
        setFeedback(null)
      }
    }
  }, [activeNPC, getNPCLastResponse])

  const handleCopyMarkdown = async () => {
    if (!feedback?.markdown) return
    try {
      await navigator.clipboard.writeText(feedback.markdown)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 1500)
      showToast('已复制 AI 返回内容', 'success')
    } catch (err) {
      console.error('Copy markdown failed:', err)
      showToast('复制失败，请手动选择内容', 'error')
    }
  }

  if (!activeNPC) return null

  // 如果是 assistant 类型，不显示对话框（由 AIAssistant 组件处理）
  if (activeNPC.type === 'assistant') {
    return null
  }

  const alreadyCompleted = isNPCCompleted(activeNPC.id)
  const isMarkdownType = activeNPC.responseType === 'markdown'
  const isDynamicReward = activeNPC.rewardType === 'dynamic'
  const fixedReward = activeNPC.reward || 100

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
        responseType: activeNPC.responseType || 'score_reason',
        rewardType: activeNPC.rewardType || 'fixed',
      }

      // 调用API验证（传递上下文用于飞书记录）
      const result = await validateTask(npcConfig, chatInput, {
        playerName: player?.name || '',
        levelName: currentLevel?.name || '',
        npcName: activeNPC.name || '',
      })

      // 计算实际积分
      let actualReward = fixedReward
      if (result.dynamicReward && result.score !== undefined) {
        actualReward = result.score
      }

      const newFeedback = {
        message: result.feedback,
        passed: result.passed,
        score: actualReward,
        markdown: result.markdown,
        isDynamic: result.dynamicReward,
        aiScore: result.score,
        isHistory: false, // 新回复
      }

      setFeedback(newFeedback)
      
      // 保存到缓存（覆盖上次）
      saveNPCResponse(activeNPC.id, newFeedback)

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
          addScore(actualReward)

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

  // 格式化时间戳
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', { 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-[600px] p-6 rounded-xl relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
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
              {currentLevel?.name} | {activeNPC.title || (activeNPC.type === 'workflow' ? 'Workflow' : 'Bot')}
              {isDynamicReward && <span className="ml-2 text-yellow-400">⚡ 动态积分</span>}
              {isMarkdownType && <span className="ml-2 text-cyan-400">📄 Markdown</span>}
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
          placeholder={activeNPC.placeholder || '在此输入你的提示词作业...'}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          disabled={isLoading}
        ></textarea>

        {/* 反馈显示区域 */}
        {feedback && (
          <div className={`p-4 rounded text-xs border animate-fadeIn ${
            feedback.passed 
              ? 'bg-green-900/20 border-green-500/30 text-green-200' 
              : 'bg-red-900/20 border-red-500/30 text-red-200'
          }`}>
            <div className="font-bold mb-2 flex items-center gap-2 flex-wrap">
              <span className="text-lg">{feedback.passed ? '✅' : '❌'}</span>
              <span>{feedback.passed ? '任务完成！' : '验证失败'}</span>
              {feedback.isHistory && (
                <span className="px-2 py-0.5 bg-gray-600/50 text-gray-300 text-[10px] rounded-full border border-gray-500/30">
                  📜 上次回复 {formatTime(feedback.timestamp)}
                </span>
              )}
              {feedback.passed && !alreadyCompleted && !feedback.isHistory && (
                <span className="ml-auto text-yellow-400 font-bold text-sm">
                  +{feedback.score} 积分
                  {feedback.isDynamic && <span className="ml-1 text-xs text-yellow-300">(AI评分)</span>}
                </span>
              )}
            </div>
            
            {feedback.isDynamic && feedback.score !== undefined && (
              <div className="bg-black/40 border border-yellow-500/30 rounded px-3 py-2 mb-2 flex items-center justify-between text-base font-bold text-yellow-300">
                <span className="flex items-center gap-2 text-sm">
                  <span>🪄</span>
                  <span>{feedback.isHistory ? '上次 AI 打分' : '本次 AI 打分'}</span>
                </span>
                <span className="text-xl text-yellow-200">
                  {feedback.score}
                  <span className="text-base ml-1">分</span>
                </span>
              </div>
            )}
            
            {/* Markdown 内容展示 */}
            {feedback.markdown ? (
              <div className="bg-black/30 p-3 rounded mt-2 max-h-[300px] overflow-y-auto text-gray-200 relative">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>📄 AI 返回结果{feedback.isHistory ? '（历史）' : ''}：</span>
                  <button
                    onClick={handleCopyMarkdown}
                    className="px-2 py-1 bg-slate-800 text-gray-200 rounded border border-gray-600 text-[10px] hover:bg-slate-700 transition"
                  >
                    {copySuccess ? '已复制' : '复制内容'}
                  </button>
                </div>
                <div className="markdown-body prose prose-invert max-w-none text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{feedback.markdown}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="leading-relaxed whitespace-pre-wrap">
                {feedback.message}
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
              AI 处理中...
            </>
          ) : alreadyCompleted ? (
            <>
              <span>🔄</span> 再次练习
            </>
          ) : isDynamicReward ? (
            <>
              <span>🪄</span> 提交评分
            </>
          ) : isMarkdownType ? (
            <>
              <span>📝</span> 提交任务 (+{fixedReward}分)
            </>
          ) : (
            <>
              <span>✓</span> 提交作业 (+{fixedReward}分)
            </>
          )}
        </button>

        <div className="text-[10px] text-center text-gray-500">
          {alreadyCompleted
            ? '练习模式：不计分，但可以继续磨练技巧'
            : isDynamicReward
              ? '🪄 魔法评分：AI 返回的分数即为你的积分！'
              : `${DROP_RATE * 100}% 概率掉落神秘大奖`}
        </div>
      </div>
    </div>
  )
}

export default NPCDialog
