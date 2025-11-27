import { useGameStore } from '../store/gameStore'
import { CELL_SIZE } from '../config/gameConfig'

function NPC({ npc }) {
  const { setActiveNPC, setChatInput, canInteractWithNPC, showToast, isNPCCompleted } =
    useGameStore()

  const completed = isNPCCompleted(npc.id)

  const handleClick = () => {
    if (canInteractWithNPC(npc.id)) {
      setActiveNPC(npc)
      setChatInput('')
    } else {
      showToast('请先走到NPC旁边！', 'warning')
    }
  }

  return (
    <div
      className="absolute flex flex-col items-center justify-center transition-all duration-300 animate-float cursor-pointer z-10 hover:scale-110 group"
      style={{
        left: npc.x * CELL_SIZE,
        top: npc.y * CELL_SIZE,
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
        {completed && <span className="text-green-400 text-[10px]">✓</span>}
        {npc.name}
      </div>

      {/* 任务标记 */}
      {completed ? (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white border border-black shadow-sm z-20">
          ✓
        </div>
      ) : (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full animate-bounce flex items-center justify-center text-[10px] text-black font-bold border border-black shadow-sm z-20">
          !
        </div>
      )}
    </div>
  )
}

export default NPC
