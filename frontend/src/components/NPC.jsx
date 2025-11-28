import { useGameStore } from '../store/gameStore'
import { CELL_SIZE } from '../config/levels'

function NPC({ npc }) {
  const { setActiveNPC, setChatInput, canInteractWithNPC, showToast, isNPCCompleted, toggleHelper } =
    useGameStore()

  const completed = isNPCCompleted(npc.id)
  
  // 支持两种位置格式：{ x, y } 或 { position: { x, y } }
  const npcX = npc.x ?? npc.position?.x ?? 0
  const npcY = npc.y ?? npc.position?.y ?? 0

  const handleClick = () => {
    if (canInteractWithNPC(npc.id)) {
      // 如果是助教类型，打开助教面板
      if (npc.type === 'assistant') {
        toggleHelper()
        return
      }
      // 否则打开NPC对话框
      setActiveNPC(npc)
      setChatInput('')
    } else {
      showToast('请先走到NPC旁边！', 'warning')
    }
  }

  // 根据类型显示不同的标签
  const getTypeLabel = () => {
    switch (npc.type) {
      case 'workflow':
        return '🔧'
      case 'bot':
        return '🤖'
      case 'assistant':
        return '❓'
      default:
        return ''
    }
  }

  return (
    <div
      className="absolute flex flex-col items-center justify-center transition-all duration-300 animate-float cursor-pointer z-10 hover:scale-110 group"
      style={{
        left: npcX * CELL_SIZE,
        top: npcY * CELL_SIZE,
        width: CELL_SIZE,
        height: CELL_SIZE,
      }}
      onClick={handleClick}
    >
      {/* 头像 */}
      <div className="text-4xl filter drop-shadow-md z-10">{npc.avatar}</div>

      {/* 名字标签 (悬浮在下方) */}
      <div
        className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] bg-black/80 px-2 py-0.5 rounded ${npc.color} whitespace-nowrap flex items-center gap-1 border border-white/10 z-20`}
      >
        {completed && npc.type !== 'assistant' && <span className="text-green-400 text-[10px]">✓</span>}
        {npc.name}
      </div>

      {/* 任务标记（助教类型不显示完成状态） */}
      {npc.type === 'assistant' ? (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white border border-black shadow-sm z-20">
          ?
        </div>
      ) : completed ? (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white border border-black shadow-sm z-20">
          ✓
        </div>
      ) : (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full animate-bounce flex items-center justify-center text-[10px] text-black font-bold border border-black shadow-sm z-20">
          !
        </div>
      )}

      {/* 悬浮提示 - 显示奖励 */}
      {npc.reward > 0 && !completed && npc.type !== 'assistant' && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[9px] bg-yellow-500/90 text-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
          +{npc.reward}分
        </div>
      )}
    </div>
  )
}

export default NPC
