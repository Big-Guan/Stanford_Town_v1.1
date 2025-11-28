import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { LEVELS, getRequiredNPCIds } from '../config/levels'
import { uploadAvatarFile } from '../services/api'

function PlayerPanel() {
  const {
    player,
    leaderboard,
    uploadAvatar,
    logout,
    fetchLeaderboard,
    showToast,
    currentLevelIndex,
    currentLevel,
    toggleLevelSelect,
    getLevelProgress,
  } = useGameStore()
  const [isUploading, setIsUploading] = useState(false)

  // 计算当前关卡进度
  const levelProgress = getLevelProgress(currentLevelIndex)
  
  // 计算总体进度
  const totalNPCs = LEVELS.reduce((sum, level) => sum + getRequiredNPCIds(level).length, 0)
  const completedCount = player.completedNPCs?.length || 0
  const totalProgressPercent = totalNPCs > 0 ? Math.round((completedCount / totalNPCs) * 100) : 0

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('图片大小不能超过2MB', 'warning')
        return
      }
      try {
        setIsUploading(true)
        showToast('头像上传中...', 'info')
        const result = await uploadAvatarFile(file)
        uploadAvatar(result.url)
        showToast('头像已更新', 'success')
      } catch (error) {
        console.error('Avatar upload error:', error)
        showToast('头像上传失败，请稍后重试', 'error')
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleRefreshLeaderboard = () => {
    fetchLeaderboard()
    showToast('排行榜已刷新', 'info')
  }

  return (
    <div className="w-full h-full glass-panel rounded-xl p-4 flex flex-col gap-4">
      {/* 个人信息 */}
      <div className="flex flex-col items-center border-b border-white/10 pb-4">
        <label className={`relative cursor-pointer group ${isUploading ? 'opacity-60 cursor-wait' : ''}`}>
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-yellow-400 bg-slate-700">
            {player.avatar ? (
              <img
                src={player.avatar}
                className="w-full h-full object-cover"
                alt="Player Avatar"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                👤
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 text-[8px] transition-opacity">
            {isUploading ? '上传中...' : '上传头像'}
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleAvatarUpload}
            disabled={isUploading}
          />
        </label>
        <h2 className="mt-2 text-yellow-400 text-sm font-bold">{player.name}</h2>
        <div className="text-xs text-gray-400">积分: {player.score}</div>

        {/* 退出按钮 */}
        <button
          onClick={logout}
          className="mt-2 text-[10px] text-gray-500 hover:text-red-400 transition-colors"
        >
          退出登录
        </button>
      </div>

      {/* 关卡信息 */}
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs text-purple-400">🎮 当前关卡</h3>
          <button
            onClick={toggleLevelSelect}
            className="text-[10px] text-gray-400 hover:text-white px-2 py-0.5 rounded border border-gray-600 hover:border-white/50 transition-colors"
          >
            选择关卡
          </button>
        </div>
        
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold text-yellow-400">第 {currentLevel?.id || 1} 关</span>
            <span className="text-xs text-gray-300">{currentLevel?.name}</span>
          </div>
          <p className="text-[10px] text-gray-400 mb-2">{currentLevel?.description}</p>
          
          {/* 当前关卡进度 */}
          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span>关卡进度</span>
            <span>{levelProgress.completed}/{levelProgress.total} ({levelProgress.percent}%)</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                levelProgress.percent === 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${levelProgress.percent}%` }}
            />
          </div>
        </div>

        {/* 总体进度 */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span>总体进度</span>
            <span>{completedCount}/{totalNPCs} ({totalProgressPercent}%)</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
              style={{ width: `${totalProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 物品栏 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <h3 className="text-xs text-blue-400 mb-2 border-b border-blue-400/30 pb-1">
          🎒 背包
        </h3>
        {player.inventory.length === 0 ? (
          <div className="text-[10px] text-gray-600 italic">暂无战利品</div>
        ) : (
          player.inventory.map((item, i) => (
            <div
              key={i}
              className="text-[10px] bg-white/5 p-1 mb-1 rounded text-yellow-200 border border-yellow-500/30"
            >
              {item}
            </div>
          ))
        )}
      </div>

      {/* 实时排行榜 */}
      <div className="flex-1 min-h-0">
        <div className="flex items-center justify-between mb-2 border-b border-red-400/30 pb-1">
          <h3 className="text-xs text-red-400">🏆 实时榜单</h3>
          <button
            onClick={handleRefreshLeaderboard}
            className="text-[10px] text-gray-500 hover:text-white transition-colors"
            title="刷新排行榜"
          >
            🔄
          </button>
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto max-h-32">
          {leaderboard.length === 0 ? (
            <div className="text-[10px] text-gray-600 italic">暂无数据</div>
          ) : (
            leaderboard.map((u, i) => (
              <div key={i} className="flex justify-between text-[10px]">
                <span
                  className={
                    i === 0
                      ? 'text-yellow-400'
                      : i === 1
                        ? 'text-gray-300'
                        : i === 2
                          ? 'text-amber-600'
                          : 'text-gray-400'
                  }
                >
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}{' '}
                  {u.name}
                  {u.name === player.name && (
                    <span className="text-cyan-400 ml-1">(你)</span>
                  )}
                </span>
                <span className="text-gray-500">{u.score}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default PlayerPanel
