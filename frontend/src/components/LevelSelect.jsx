import { useGameStore } from '../store/gameStore'
import { LEVELS } from '../config/levels'

function LevelSelect() {
  const {
    showLevelSelect,
    toggleLevelSelect,
    currentLevelIndex,
    loadLevel,
    getLevelProgress,
    player,
  } = useGameStore()

  if (!showLevelSelect) return null

  return (
    <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-[600px] max-h-[80vh] p-6 rounded-xl relative flex flex-col gap-4 overflow-hidden">
        {/* 标题 */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <h2 className="text-xl text-yellow-400 font-bold">🗺️ 关卡选择</h2>
            <p className="text-xs text-gray-400 mt-1">
              当前积分: {player.score} | 已完成 {player.completedNPCs.length} 个任务
            </p>
          </div>
          <button
            onClick={toggleLevelSelect}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* 关卡列表 */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {LEVELS.map((level, index) => {
            const progress = getLevelProgress(index)
            const isUnlocked = index === 0 || getLevelProgress(index - 1).percent === 100
            const isCurrent = index === currentLevelIndex
            const isCompleted = progress.percent === 100

            return (
              <div
                key={level.id}
                className={`
                  p-4 rounded-lg border transition-all cursor-pointer
                  ${isCurrent 
                    ? 'border-yellow-500 bg-yellow-500/10' 
                    : isCompleted
                      ? 'border-green-500/50 bg-green-500/5'
                      : isUnlocked
                        ? 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                        : 'border-gray-700 bg-gray-900/50 opacity-50 cursor-not-allowed'
                  }
                `}
                onClick={() => {
                  if (isUnlocked) {
                    loadLevel(index)
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  {/* 关卡编号 */}
                  <div className={`
                    w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold
                    ${isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isCurrent
                        ? 'bg-yellow-500 text-black'
                        : isUnlocked
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-500'
                    }
                  `}>
                    {isCompleted ? '✓' : level.id}
                  </div>

                  {/* 关卡信息 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                        {level.name}
                      </h3>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-yellow-500 text-black text-[10px] rounded-full">
                          当前
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-2 py-0.5 bg-green-500/30 text-green-400 text-[10px] rounded-full border border-green-500/30">
                          已通关
                        </span>
                      )}
                      {!isUnlocked && (
                        <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-[10px] rounded-full">
                          🔒 未解锁
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{level.description}</p>
                    
                    {/* NPC 列表 */}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {level.npcs.map(npc => {
                        const npcCompleted = player.completedNPCs.includes(npc.id)
                        return (
                          <div
                            key={npc.id}
                            className={`
                              flex items-center gap-1 px-2 py-1 rounded text-[10px]
                              ${npcCompleted 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-white/5 text-gray-400 border border-white/10'
                              }
                            `}
                          >
                            <span>{npc.avatar}</span>
                            <span>{npc.name}</span>
                            {npcCompleted && <span>✓</span>}
                          </div>
                        )
                      })}
                    </div>

                    {/* 进度条 */}
                    {isUnlocked && (
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>进度</span>
                          <span>{progress.completed}/{progress.total} ({progress.percent}%)</span>
                        </div>
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              progress.percent === 100 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 底部提示 */}
        <div className="text-center text-[10px] text-gray-500 border-t border-white/10 pt-3">
          完成当前关卡的所有任务后，下一关将自动解锁
        </div>
      </div>
    </div>
  )
}

export default LevelSelect

