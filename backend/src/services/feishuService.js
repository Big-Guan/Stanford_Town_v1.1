/**
 * 飞书多维表格服务
 * 用于记录玩家 NPC 交互数据
 * 
 * 文档参考: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/create
 */

import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

// 飞书配置
const FEISHU_APP_ID = process.env.FEISHU_APP_ID
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET
const FEISHU_BITABLE_APP_TOKEN = process.env.FEISHU_BITABLE_APP_TOKEN  // 多维表格 App Token
const FEISHU_BITABLE_TABLE_ID = process.env.FEISHU_BITABLE_TABLE_ID    // 数据表 ID

// 飞书 API 基础地址
const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis'

// 缓存 tenant_access_token
let cachedToken = null
let tokenExpireTime = 0

/**
 * 检查飞书服务是否已配置
 */
export function isFeishuConfigured() {
  return !!(FEISHU_APP_ID && FEISHU_APP_SECRET && FEISHU_BITABLE_APP_TOKEN && FEISHU_BITABLE_TABLE_ID)
}

/**
 * 获取 tenant_access_token
 * 文档: https://open.feishu.cn/document/server-docs/authentication-management/access-token/tenant_access_token_internal
 */
async function getTenantAccessToken() {
  // 检查缓存是否有效（提前 5 分钟刷新）
  if (cachedToken && Date.now() < tokenExpireTime - 5 * 60 * 1000) {
    return cachedToken
  }

  try {
    const response = await axios.post(
      `${FEISHU_API_BASE}/auth/v3/tenant_access_token/internal`,
      {
        app_id: FEISHU_APP_ID,
        app_secret: FEISHU_APP_SECRET,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    )

    if (response.data.code === 0) {
      cachedToken = response.data.tenant_access_token
      // token 有效期通常是 2 小时
      tokenExpireTime = Date.now() + (response.data.expire || 7200) * 1000
      console.log('[Feishu] 获取 tenant_access_token 成功')
      return cachedToken
    } else {
      console.error('[Feishu] 获取 token 失败:', response.data.msg)
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error('[Feishu] 获取 token 异常:', error.message)
    throw error
  }
}

/**
 * 向多维表格添加记录
 * 文档: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/create
 * 
 * @param {Object} record - 记录数据
 * @param {string} record.playerName - 玩家姓名
 * @param {string} record.levelName - 关卡名称
 * @param {string} record.npcName - NPC 名称
 * @param {string} record.playerInput - 玩家输入内容
 * @param {string} [record.aiResponse] - AI 返回内容（可选）
 * @param {number} [record.score] - 获得积分（可选）
 * @param {boolean} [record.passed] - 是否通过（可选）
 */
export async function addRecordToBitable(record) {
  if (!isFeishuConfigured()) {
    console.log('[Feishu] 未配置飞书，跳过记录')
    return null
  }

  try {
    const token = await getTenantAccessToken()

    // 构建字段数据
    // 注意：字段名需要与多维表格中的列名完全一致
    const fields = {
      '玩家姓名': record.playerName || '',
      '关卡名称': record.levelName || '',
      'NPC名称': record.npcName || '',
      '玩家输入': record.playerInput || '',
    }

    console.log('[Feishu] 准备写入字段:', JSON.stringify(fields, null, 2))

    const response = await axios.post(
      `${FEISHU_API_BASE}/bitable/v1/apps/${FEISHU_BITABLE_APP_TOKEN}/tables/${FEISHU_BITABLE_TABLE_ID}/records`,
      {
        fields,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    )

    if (response.data.code === 0) {
      console.log('[Feishu] 记录添加成功, record_id:', response.data.data?.record?.record_id)
      return response.data.data?.record
    } else {
      console.error('[Feishu] 添加记录失败:', response.data.code, response.data.msg)
      console.error('[Feishu] 详细错误:', JSON.stringify(response.data, null, 2))
      return null
    }
  } catch (error) {
    console.error('[Feishu] 添加记录异常:', error.message)
    // 打印详细错误信息
    if (error.response) {
      console.error('[Feishu] 响应状态:', error.response.status)
      console.error('[Feishu] 响应数据:', JSON.stringify(error.response.data, null, 2))
    }
    // 不抛出异常，避免影响主流程
    return null
  }
}

/**
 * 批量添加记录
 * 文档: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/batch_create
 */
export async function batchAddRecords(records) {
  if (!isFeishuConfigured() || !records || records.length === 0) {
    return null
  }

  try {
    const token = await getTenantAccessToken()

    const recordsData = records.map(record => ({
      fields: {
        '玩家姓名': record.playerName || '',
        '关卡名称': record.levelName || '',
        'NPC名称': record.npcName || '',
        '玩家输入': record.playerInput || '',
        '提交时间': Date.now(),
        'AI返回': record.aiResponse || '',
        '获得积分': record.score || 0,
        '是否通过': record.passed ? '是' : '否',
      }
    }))

    const response = await axios.post(
      `${FEISHU_API_BASE}/bitable/v1/apps/${FEISHU_BITABLE_APP_TOKEN}/tables/${FEISHU_BITABLE_TABLE_ID}/records/batch_create`,
      {
        records: recordsData,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    )

    if (response.data.code === 0) {
      console.log('[Feishu] 批量添加成功, 数量:', response.data.data?.records?.length)
      return response.data.data?.records
    } else {
      console.error('[Feishu] 批量添加失败:', response.data.code, response.data.msg)
      return null
    }
  } catch (error) {
    console.error('[Feishu] 批量添加异常:', error.message)
    return null
  }
}

export default {
  isFeishuConfigured,
  addRecordToBitable,
  batchAddRecords,
}

