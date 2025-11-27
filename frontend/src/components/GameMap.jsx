import { useEffect, useRef, useState, useMemo } from 'react'
import { useGameStore } from '../store/gameStore'
import { INITIAL_MAP, NPCS, CELL_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../config/gameConfig'
import Player from './Player'
import NPC from './NPC'

function GameMap() {
  const {
    player,
    activeNPC,
    showHelper,
    updatePosition,
    updateDirection,
    canMoveTo,
  } = useGameStore()
  const containerRef = useRef(null)
  const [scale, setScale] = useState(1)

  // 生成装饰物缓存，避免重绘闪烁
  // 0: 无, 1: 花, 2: 草, 3: 石头
  const decorations = useMemo(() => {
    const decos = {}
    INITIAL_MAP.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 0) {
          // 简单的伪随机
          const seed = (x * 123 + y * 456) % 100
          if (seed < 5) decos[`${x}-${y}`] = 'deco-flower'
          else if (seed < 15) decos[`${x}-${y}`] = 'deco-grass'
          else if (seed > 98) decos[`${x}-${y}`] = 'deco-stone'
        }
      })
    })
    return decos
  }, [])

  // 自适应缩放计算
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement
        if (parent) {
          const availableWidth = parent.clientWidth - 32
          const availableHeight = parent.clientHeight - 32
          
          const mapPixelWidth = MAP_WIDTH * CELL_SIZE
          const mapPixelHeight = MAP_HEIGHT * CELL_SIZE
          
          const scaleX = availableWidth / mapPixelWidth
          const scaleY = availableHeight / mapPixelHeight
          
          setScale(Math.min(scaleX, scaleY, 1.5))
        }
      }
    }

    window.addEventListener('resize', handleResize)
    setTimeout(handleResize, 100)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 键盘移动控制
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeNPC || showHelper) return

      let dx = 0,
        dy = 0
      let newDir = player.direction

      if (['w', 'W', 'ArrowUp'].includes(e.key)) {
        dy = -1
        newDir = 'up'
      } else if (['s', 'S', 'ArrowDown'].includes(e.key)) {
        dy = 1
        newDir = 'down'
      } else if (['a', 'A', 'ArrowLeft'].includes(e.key)) {
        dx = -1
        newDir = 'left'
      } else if (['d', 'D', 'ArrowRight'].includes(e.key)) {
        dx = 1
        newDir = 'right'
      } else return

      const newX = player.position.x + dx
      const newY = player.position.y + dy

      if (canMoveTo(newX, newY)) {
        updatePosition({ x: newX, y: newY })
      }
      updateDirection(newDir)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [player, activeNPC, showHelper, canMoveTo, updatePosition, updateDirection])

  return (
    <div
      ref={containerRef}
      className="relative glass-panel rounded-xl overflow-hidden shadow-2xl origin-center transition-transform duration-300 bg-[#0f172a]"
      style={{
        width: MAP_WIDTH * CELL_SIZE,
        height: MAP_HEIGHT * CELL_SIZE,
        transform: `scale(${scale})`,
      }}
    >
      {/* 1. 渲染地图层 */}
      {INITIAL_MAP.map((row, y) => (
        <div key={y} className="flex">
          {row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className={`
                relative w-[48px] h-[48px]
                ${cell === 0 ? 'tile-grass' : ''}
                ${cell === 1 ? 'tile-path' : ''}
                ${cell === 9 ? 'tile-wall' : ''}
                ${decorations[`${x}-${y}`] || ''}
              `}
            />
          ))}
        </div>
      ))}

      {/* 2. 渲染 NPC */}
      {NPCS.map((npc) => (
        <NPC key={npc.id} npc={npc} />
      ))}

      {/* 3. 渲染玩家 */}
      <Player />
    </div>
  )
}

export default GameMap
