/**
 * 阿里云 PostgreSQL 数据库连接测试工具
 * 用于诊断连接问题
 */

import pg from 'pg'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 加载环境变量
dotenv.config({ path: join(__dirname, '.env') })

const { Pool } = pg

// 从环境变量读取配置
const config = {
  host: process.env.DB_HOST || 'mr-nzat664jyb4r6lpzje.rwlb.rds.aliyuncs.com',
  port: parseInt(process.env.DB_PORT) || 3432,
  database: process.env.DB_NAME || 'ai_stanford_town_v1',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionTimeoutMillis: 10000, // 10秒超时
  idleTimeoutMillis: 30000,
}

console.log('='.repeat(60))
console.log('🔍 阿里云 PostgreSQL 连接测试')
console.log('='.repeat(60))
console.log('')

// 显示配置信息（隐藏密码）
console.log('📋 连接配置:')
console.log(`   主机: ${config.host}`)
console.log(`   端口: ${config.port}`)
console.log(`   数据库: ${config.database}`)
console.log(`   用户名: ${config.user || '❌ 未配置'}`)
console.log(`   密码: ${config.password ? '✅ 已配置' : '❌ 未配置'}`)
console.log('')

// 检查必要配置
if (!config.user || !config.password) {
  console.error('❌ 错误: 数据库用户名或密码未配置！')
  console.error('')
  console.error('请在 backend/.env 文件中配置:')
  console.error('   DB_USER=你的用户名')
  console.error('   DB_PASSWORD=你的密码')
  process.exit(1)
}

// 测试1: 基本连接（无SSL）
console.log('🧪 测试 1: 基本连接（无SSL）...')
await testConnection({ ...config, ssl: false })

// 测试2: SSL连接
console.log('')
console.log('🧪 测试 2: SSL连接...')
await testConnection({ ...config, ssl: { rejectUnauthorized: false } })

// 测试3: 严格SSL连接
console.log('')
console.log('🧪 测试 3: 严格SSL连接...')
await testConnection({ ...config, ssl: true })

async function testConnection(testConfig) {
  const pool = new Pool(testConfig)
  let client = null

  try {
    console.log(`   尝试连接...`)
    const startTime = Date.now()
    
    client = await pool.connect()
    const duration = Date.now() - startTime
    
    console.log(`   ✅ 连接成功！ (耗时: ${duration}ms)`)
    
    // 测试查询
    console.log(`   执行测试查询...`)
    const result = await client.query('SELECT version(), NOW(), current_database()')
    
    console.log(`   ✅ 查询成功！`)
    console.log(`   📊 PostgreSQL 版本: ${result.rows[0].version.split(',')[0]}`)
    console.log(`   ⏰ 服务器时间: ${result.rows[0].now}`)
    console.log(`   💾 当前数据库: ${result.rows[0].current_database}`)
    
    // 检查表是否存在
    console.log(`   检查表结构...`)
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    if (tablesResult.rows.length > 0) {
      console.log(`   ✅ 发现 ${tablesResult.rows.length} 个表:`)
      tablesResult.rows.forEach(row => {
        console.log(`      - ${row.table_name}`)
      })
    } else {
      console.log(`   ⚠️  未发现表，请执行 schema-aliyun.sql 创建表结构`)
    }
    
    client.release()
    await pool.end()
    
    console.log(`   ✅ 测试通过！`)
    return true
    
  } catch (error) {
    if (client) {
      client.release()
    }
    await pool.end()
    
    console.log(`   ❌ 连接失败`)
    console.log(`   📝 错误信息: ${error.message}`)
    console.log(`   🔍 错误代码: ${error.code || 'N/A'}`)
    
    // 提供诊断建议
    provideDiagnostics(error)
    
    return false
  }
}

function provideDiagnostics(error) {
  console.log('')
  console.log('💡 诊断建议:')
  
  if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
    console.log('   ⚠️  连接超时，可能原因:')
    console.log('      1. 网络不通 - 检查是否在同一VPC或已配置白名单')
    console.log('      2. 防火墙阻止 - 检查安全组规则')
    console.log('      3. 地址错误 - 确认内网地址是否正确')
    console.log('')
    console.log('   🔧 解决方法:')
    console.log('      1. 在阿里云RDS控制台 → 数据安全性 → 白名单设置')
    console.log('      2. 添加你的服务器IP地址到白名单')
    console.log('      3. 如果是本地开发，需要添加你的公网IP')
    
  } else if (error.code === 'ECONNREFUSED') {
    console.log('   ⚠️  连接被拒绝，可能原因:')
    console.log('      1. 端口错误 - 确认端口是否为 3432')
    console.log('      2. 服务未启动 - 检查RDS实例状态')
    console.log('      3. 网络不通')
    
  } else if (error.code === '28P01' || error.message.includes('password')) {
    console.log('   ⚠️  认证失败，可能原因:')
    console.log('      1. 用户名错误')
    console.log('      2. 密码错误')
    console.log('      3. 用户无权限访问该数据库')
    console.log('')
    console.log('   🔧 解决方法:')
    console.log('      1. 检查 backend/.env 中的 DB_USER 和 DB_PASSWORD')
    console.log('      2. 在RDS控制台重置密码')
    
  } else if (error.code === '3D000' || error.message.includes('database')) {
    console.log('   ⚠️  数据库不存在')
    console.log('   🔧 解决方法:')
    console.log('      1. 在RDS控制台创建数据库: ai_stanford_town_v1')
    console.log('      2. 或修改 .env 中的 DB_NAME 为已存在的数据库')
    
  } else if (error.message.includes('SSL')) {
    console.log('   ⚠️  SSL连接问题')
    console.log('   🔧 解决方法:')
    console.log('      1. 尝试设置 DB_SSL=false')
    console.log('      2. 或设置 DB_SSL=true 并配置证书')
    
  } else {
    console.log('   ⚠️  未知错误')
    console.log('   🔧 建议:')
    console.log('      1. 检查RDS实例状态是否正常')
    console.log('      2. 检查网络连接')
    console.log('      3. 查看RDS日志获取更多信息')
  }
  
  console.log('')
}

console.log('')
console.log('='.repeat(60))
console.log('测试完成')
console.log('='.repeat(60))

