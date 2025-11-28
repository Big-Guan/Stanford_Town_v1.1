import { useGameStore } from '../store/gameStore'
import { LEVELS } from '../config/levels'

function LevelCompleteModal() {
  const {
    showLevelCompleteModal,
    currentLevel,
    nextLevelIndex,
    confirmNextLevel,
    stayCurrentLevel,
  } = useGameStore()

  if (!showLevelCompleteModal) return null

  const nextLevel = nextLevelIndex !== null ? LEVELS[nextLevelIndex] : null

  return (
    <div className="absolute inset-0 bg-black/70 z-[100] flex items-center justify-center backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-[450px] p-8 rounded-xl relative flex flex-col items-center gap-6 text-center">
        {/* 庆祝动画 */}
        <div className="text-6xl animate-bounce">🎉</div>
        
        {/* 标题 */}
        <h2 className="text-2xl font-bold text-yellow-400">
          恭喜通关！
        </h2>
        
        {/* 当前关卡信息 */}
        <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 w-full">
          <div className="text-green-400 text-sm mb-1">✅ 已完成</div>
          <div className="text-xl text-white font-bold">{currentLevel?.name}</div>
          <div className="text-xs text-gray-400 mt-1">{currentLevel?.description}</div>
        </div>
        
        {/* 下一关预览 */}
        {nextLevel && (
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 w-full">
            <div className="text-blue-400 text-sm mb-1">🚀 下一关</div>
            <div className="text-xl text-white font-bold">{nextLevel.name}</div>
            <div className="text-xs text-gray-400 mt-1">{nextLevel.description}</div>
            <div className="text-xs text-cyan-400 mt-2">
              共 {nextLevel.npcs?.length || 0} 个任务等你挑战
            </div>
          </div>
        )}
        
        {/* 按钮组 */}
        <div className="flex gap-4 w-full">
          <button
            onClick={stayCurrentLevel}
            className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-bold transition-all active:scale-95"
          >
            留在当前关卡
          </button>
          <button
            onClick={confirmNextLevel}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-bold transition-all active:scale-95 shadow-lg"
          >
            进入下一关 →
          </button>
        </div>
        
        <div className="text-[10px] text-gray-500">
          你可以随时在左侧面板切换关卡
        </div>
      </div>
    </div>
  )
}

export default LevelCompleteModal

