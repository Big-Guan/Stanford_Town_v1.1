import express from 'express'
import multer from 'multer'
import { isOSSReady, uploadAvatarToOSS } from '../services/ossService.js'

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
})

router.post('/avatar', upload.single('file'), async (req, res) => {
  try {
    if (!isOSSReady()) {
      return res.status(503).json({ error: 'OSS 服务未配置，请联系管理员' })
    }

    if (!req.file) {
      return res.status(400).json({ error: '未接收到文件' })
    }

    const { buffer, originalname, mimetype } = req.file
    const result = await uploadAvatarToOSS(buffer, originalname, mimetype)

    res.json({
      success: true,
      url: result.url,
      key: result.key,
    })
  } catch (error) {
    console.error('[Upload] 头像上传失败:', error)
    res.status(500).json({ error: '头像上传失败，请稍后重试' })
  }
})

export default router

