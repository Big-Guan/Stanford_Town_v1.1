import { useEffect } from 'react'
import GameMap from './components/GameMap'
import PlayerPanel from './components/PlayerPanel'
import NPCDialog from './components/NPCDialog'
import AIAssistant from './components/AIAssistant'
import ControlHint from './components/ControlHint'
import Toast from './components/Toast'
import LoginScreen from './components/LoginScreen'
import { useGameStore } from './store/gameStore'

function App() {
  const { initializeGame, isLoggedIn } = useGameStore()

  useEffect(() => {
    const cleanup = initializeGame()
    return cleanup
  }, [initializeGame])

  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen />
        <Toast />
      </>
    )
  }

  return (
    <div className="w-full h-screen relative flex bg-black overflow-hidden">
      {/* 扫描线特效 */}
      <div className="scanlines pointer-events-none z-50"></div>

      {/* 左侧信息面板 - 固定宽度 */}
      <div className="w-72 h-full relative z-40 flex-shrink-0 p-4">
        <PlayerPanel />
      </div>

      {/* 右侧游戏区域 - 自适应填满 */}
      <div className="flex-1 h-full relative flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-black">
        {/* 游戏地图容器 */}
        <GameMap />
      </div>

      {/* NPC对话框 (全局覆盖) */}
      <NPCDialog />

      {/* AI助教 */}
      <AIAssistant />

      {/* 操作提示 */}
      <ControlHint />

      {/* 全局提示 */}
      <Toast />
    </div>
  )
}

export default App
