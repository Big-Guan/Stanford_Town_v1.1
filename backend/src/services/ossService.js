import OSS from 'ali-oss'
import dotenv from 'dotenv'
import path from 'path'
import { randomUUID } from 'crypto'

dotenv.config()

let ossClient = null

function createClient() {
  const {
    OSS_REGION,
    OSS_ACCESS_KEY_ID,
    OSS_ACCESS_KEY_SECRET,
    OSS_BUCKET,
    OSS_ENDPOINT,
  } = process.env

  if (!OSS_ACCESS_KEY_ID || !OSS_ACCESS_KEY_SECRET || !OSS_BUCKET || !OSS_REGION) {
    console.warn('[OSS] 未配置完整的 OSS 环境变量，跳过初始化')
    return null
  }

  try {
    const client = new OSS({
      region: OSS_REGION,
      accessKeyId: OSS_ACCESS_KEY_ID,
      accessKeySecret: OSS_ACCESS_KEY_SECRET,
      bucket: OSS_BUCKET,
      endpoint: OSS_ENDPOINT,
      secure: true,
    })
    console.log('[OSS] 阿里云 OSS 客户端已初始化')
    return client
  } catch (error) {
    console.error('[OSS] 初始化失败:', error.message)
    return null
  }
}

export function initOSSClient() {
  ossClient = createClient()
}

export function isOSSReady() {
  return !!ossClient
}

export async function uploadAvatarToOSS(buffer, filename, mimeType) {
  if (!ossClient) {
    throw new Error('OSS 服务未配置')
  }

  const ext = path.extname(filename)?.toLowerCase() || '.png'
  const objectKey = `avatars/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${ext}`

  const headers = {}
  if (mimeType) {
    headers['Content-Type'] = mimeType
  }

  await ossClient.put(objectKey, buffer, { headers })

  const customDomain = process.env.OSS_CUSTOM_DOMAIN?.replace(/\/$/, '')
  const url = customDomain ? `${customDomain}/${objectKey}` : ossClient.generateObjectUrl(objectKey)

  return { url, key: objectKey }
}

