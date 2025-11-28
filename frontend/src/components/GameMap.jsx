import { useEffect, useRef, useState, useMemo } from 'react'
import { useGameStore } from '../store/gameStore'
import { CELL_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../config/levels'
import Player from './Player'
import NPC from './NPC'

function GameMap() {
  const {
    player,
    activeNPC,
    showHelper,
    showLevelSelect,
    currentLevel,
    updatePosition,
    updateDirection,
    canMoveTo,
  } = useGameStore()
  
  const containerRef = useRef(null)
  const [scale, setScale] = useState(1)

  // 从当前关卡获取地图和NPC
  const currentMap = currentLevel?.map || []
  const currentNPCs = currentLevel?.npcs || []
  
  // 计算地图尺寸（使用关卡配置或默认值）
  const mapWidth = currentMap[0]?.length || MAP_WIDTH
  const mapHeight = currentMap.length || MAP_HEIGHT

  // 生成装饰物缓存，避免重绘闪烁
  const decorations = useMemo(() => {
    const decos = {}
    currentMap.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 0) {
          const seed = (x * 123 + y * 456) % 100
          if (seed < 5) decos[`${x}-${y}`] = 'deco-flower'
          else if (seed < 15) decos[`${x}-${y}`] = 'deco-grass'
          else if (seed > 98) decos[`${x}-${y}`] = 'deco-stone'
        }
      })
    })
    return decos
  }, [currentMap])

  // 自适应缩放计算
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement
        if (parent) {
          const availableWidth = parent.clientWidth - 32
          const availableHeight = parent.clientHeight - 32
          
          const mapPixelWidth = mapWidth * CELL_SIZE
          const mapPixelHeight = mapHeight * CELL_SIZE
          
          const scaleX = availableWidth / mapPixelWidth
          const scaleY = availableHeight / mapPixelHeight
          
          setScale(Math.min(scaleX, scaleY, 1.5))
        }
      }
    }

    window.addEventListener('resize', handleResize)
    setTimeout(handleResize, 100)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [mapWidth, mapHeight])

  // 键盘移动控制
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 对话时或关卡选择时禁止移动
      if (activeNPC || showHelper || showLevelSelect) return

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
  }, [player, activeNPC, showHelper, showLevelSelect, canMoveTo, updatePosition, updateDirection])

  if (!currentLevel) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        加载关卡中...
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative glass-panel rounded-xl overflow-hidden shadow-2xl origin-center transition-transform duration-300 bg-[#0f172a]"
      style={{
        width: mapWidth * CELL_SIZE,
        height: mapHeight * CELL_SIZE,
        transform: `scale(${scale})`,
      }}
    >
      {/* 1. 渲染地图层 */}
      {currentMap.map((row, y) => (
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
      {currentNPCs.map((npc) => (
        <NPC key={npc.id} npc={npc} />
      ))}

      {/* 3. 渲染玩家 */}
      <Player />

      {/* 4. 关卡信息浮层 */}
      <div className="absolute top-2 left-2 bg-black/70 px-3 py-1.5 rounded-lg text-xs">
        <span className="text-yellow-400 font-bold">第 {currentLevel.id} 关</span>
        <span className="text-gray-300 ml-2">{currentLevel.name}</span>
      </div>
    </div>
  )
}

export default GameMap
