import { useState } from 'react'
import { useGameStore } from '../store/gameStore'

function LoginScreen() {
  const [username, setUsername] = useState('')
  const { login, isLoading } = useGameStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (username.trim().length < 2) {
      return
    }
    await login(username.trim())
  }

  return (
    <div className="w-full h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 overflow-hidden">
      {/* 背景动画粒子 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* 扫描线 */}
      <div className="scanlines opacity-30"></div>

      {/* 主登录卡片 */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* 发光边框效果 */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>

        <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
          {/* Logo区域 */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 animate-bounce">🏘️</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI 进化小镇
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              探索 AI 世界，完成挑战，成为大师
            </p>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                输入你的名字开始冒险
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  👤
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="至少2个字符..."
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                           text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 
                           focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 名字是你的唯一标识，首次输入会自动注册
              </p>
            </div>

            <button
              type="submit"
              disabled={username.trim().length < 2 || isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 
                       hover:from-cyan-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700
                       text-white font-semibold rounded-xl transition-all duration-300
                       transform hover:scale-[1.02] active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  正在进入...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  🚀 进入小镇
                </span>
              )}
            </button>
          </form>

          {/* 分隔线 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-black/80 text-gray-500">小镇特色</span>
            </div>
          </div>

          {/* 特色介绍 */}
          <div className="grid grid-cols-2 gap-3 text-center text-xs">
            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
              <div className="text-2xl mb-1">🧙‍♂️</div>
              <div className="text-gray-400">Prompt 大师</div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
              <div className="text-2xl mb-1">🎨</div>
              <div className="text-gray-400">AI 绘画</div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
              <div className="text-2xl mb-1">🎬</div>
              <div className="text-gray-400">视频生成</div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
              <div className="text-2xl mb-1">🤖</div>
              <div className="text-gray-400">Coze 搭建</div>
            </div>
          </div>
        </div>

        {/* 底部版本信息 */}
        <p className="text-center text-gray-600 text-xs mt-4">
          v2.0 · 支持数据持久化与实时排行榜
        </p>
      </div>
    </div>
  )
}

export default LoginScreen

