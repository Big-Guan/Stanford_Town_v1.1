function ControlHint() {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-500 glass-panel px-4 py-2 rounded-full flex items-center gap-4">
      <span>⌨️ WASD 移动</span>
      <span>🖱️ 点击 NPC 交互</span>
      <span>❓ 右下角 AI 助教</span>
    </div>
  )
}

export default ControlHint
