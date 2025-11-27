import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import validateRouter from './routes/validate.js'
import assistantRouter from './routes/assistant.js'
import userRouter from './routes/user.js'
import uploadRouter from './routes/upload.js'
import { initDatabase } from './services/databaseService.js'
import { initOSSClient } from './services/ossService.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// 初始化数据库连接
initDatabase().then(connected => {
  if (connected) {
    console.log('[Server] 数据库服务已就绪')
  } else {
    console.log('[Server] 数据库未连接，使用本地模式')
  }
})

// 初始化 OSS
initOSSClient()

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100次请求
  message: '请求过于频繁，请稍后再试',
})

// 中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '5mb' }))
app.use(limiter)

// 路由
app.use('/api/validate', validateRouter)
app.use('/api/assistant', assistantRouter)
app.use('/api/user', userRouter)
app.use('/api/upload', uploadRouter)

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '未找到该接口' })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ error: '服务器内部错误' })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 AI进化小镇后端服务已启动`)
  console.log(`📍 端口: ${PORT}`)
  console.log(`🌐 环境: ${process.env.NODE_ENV}`)
  console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`)
})

