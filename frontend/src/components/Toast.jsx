import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

function Toast() {
  const { toast, hideToast } = useGameStore()

  useEffect(() => {
    if (toast.visible && toast.duration > 0) {
      const timer = setTimeout(() => {
        hideToast()
      }, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast, hideToast])

  if (!toast.visible) return null

  // 根据类型设置颜色
  const bgColors = {
    success: 'bg-green-500/90 border-green-400 text-white',
    error: 'bg-red-500/90 border-red-400 text-white',
    info: 'bg-blue-500/90 border-blue-400 text-white',
    warning: 'bg-yellow-500/90 border-yellow-400 text-black',
  }

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  }

  return (
    <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[100] animate-bounce-in">
      <div
        className={`
          ${bgColors[toast.type] || bgColors.info}
          px-6 py-3 rounded-lg shadow-2xl border-2 backdrop-blur-sm
          flex items-center gap-3 min-w-[300px] max-w-[80vw]
        `}
      >
        <span className="text-xl">{icons[toast.type]}</span>
        <div className="flex flex-col">
          <span className="font-pixel text-sm whitespace-pre-wrap leading-relaxed">
            {toast.message}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Toast

