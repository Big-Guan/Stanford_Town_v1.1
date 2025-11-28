import { useGameStore } from '../store/gameStore'
import { CELL_SIZE } from '../config/levels'

function Player() {
  const { player } = useGameStore()

  return (
    <div
      className="absolute transition-all duration-200 z-20 flex flex-col items-center"
      style={{
        left: player.position.x * CELL_SIZE,
        top: player.position.y * CELL_SIZE,
        width: CELL_SIZE,
        height: CELL_SIZE,
      }}
    >
      <div className="w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden bg-blue-600 relative">
        {player.avatar ? (
          <img
            src={player.avatar}
            className="w-full h-full object-cover"
            alt="Player Avatar"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">
            😎
          </div>
        )}
      </div>
      <div className="text-[8px] bg-blue-600 px-1 rounded text-white mt-[-4px]">
        Me
      </div>
    </div>
  )
}

export default Player

