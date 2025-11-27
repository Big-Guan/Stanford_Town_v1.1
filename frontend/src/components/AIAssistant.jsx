import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { askAssistant } from '../services/api'

function AIAssistant() {
  const {
    showHelper,
    toggleHelper,
    chatHistory,
    addChatMessage,
    assistantConversationId,
    setAssistantConversationId,
  } = useGameStore()
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAsk = async () => {
    if (!input.trim()) return

    const question = input
    setInput('')
    addChatMessage('user', question)
    setIsLoading(true)

    try {
      const result = await askAssistant({
        message: question,
        conversationId: assistantConversationId,
      })

      if (result.conversationId) {
        setAssistantConversationId(result.conversationId)
      }

      addChatMessage('ai', result.answer)
    } catch (error) {
      console.error('Assistant error:', error)
      addChatMessage('ai', '抱歉，我暂时无法回答。请稍后再试。')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {showHelper && (
        <div className="glass-panel w-[400px] h-[500px] p-4 rounded-xl flex flex-col gap-3 mb-2 animate-slideUp shadow-2xl border-2 border-white/20">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <span className="text-sm font-bold text-green-400">AI 助教</span>
            </div>
            <button
              onClick={toggleHelper}
              className="text-sm text-gray-400 hover:text-white px-2 hover:bg-white/10 rounded"
            >
              收起
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 text-xs">
            {chatHistory.length === 0 && (
              <div className="bg-white/10 p-3 rounded-lg self-start leading-relaxed">
                👋 你好！我是你的智能助教。<br />
                遇到不会的题目、想了解AI知识，或者对代码有疑问，都可以问我哦！
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg max-w-[90%] leading-relaxed break-words ${
                  msg.role === 'user'
                    ? 'bg-blue-600 ml-auto text-right text-white'
                    : 'bg-white/10 text-gray-100'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="bg-white/10 p-3 rounded-lg animate-pulse w-fit">
                <span className="flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t border-white/10">
            <input
              type="text"
              className="flex-1 bg-black/50 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
              placeholder="输入问题... (Enter发送)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              onClick={handleAsk}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              发送
            </button>
          </div>
        </div>
      )}

      <button
        onClick={toggleHelper}
        className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:scale-110 transition-transform border-2 border-white z-50"
        title="打开AI助教"
      >
        <span className="text-3xl">{showHelper ? '×' : '?'}</span>
      </button>
    </div>
  )
}

export default AIAssistant
