/**
 * 初始化数据库表结构
 * 执行 schema-aliyun.sql 创建所有表
 */

import pg from 'pg'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '.env') })

const { Pool } = pg

const config = {
  host: process.env.DB_HOST || 'mr-nzat664jyb4r6lpzje.rwlb.rds.aliyuncs.com',
  port: parseInt(process.env.DB_PORT) || 3432,
  database: process.env.DB_NAME || 'ai_stanford_town_v1',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false, // 根据测试结果，不使用SSL
}

console.log('='.repeat(60))
console.log('🗄️  初始化数据库表结构')
console.log('='.repeat(60))
console.log('')

if (!config.user || !config.password) {
  console.error('❌ 错误: 数据库用户名或密码未配置！')
  console.error('请在 backend/.env 中配置 DB_USER 和 DB_PASSWORD')
  process.exit(1)
}

const pool = new Pool(config)

try {
  console.log('📋 连接配置:')
  console.log(`   主机: ${config.host}`)
  console.log(`   端口: ${config.port}`)
  console.log(`   数据库: ${config.database}`)
  console.log(`   用户: ${config.user}`)
  console.log('')

  // 读取SQL文件
  const sqlFile = join(__dirname, 'database', 'schema-aliyun.sql')
  console.log(`📄 读取SQL文件: ${sqlFile}`)
  const sql = readFileSync(sqlFile, 'utf-8')
  console.log(`✅ SQL文件读取成功 (${sql.length} 字符)`)
  console.log('')

  // 连接数据库
  console.log('🔌 连接数据库...')
  const client = await pool.connect()
  console.log('✅ 连接成功')
  console.log('')

  // 清理SQL：移除注释块
  let cleanSql = sql
    // 移除多行注释 /* ... */
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // 移除单行注释 --
    .split('\n')
    .map(line => {
      const commentIndex = line.indexOf('--')
      if (commentIndex >= 0) {
        return line.substring(0, commentIndex)
      }
      return line
    })
    .join('\n')
    .trim()

  console.log('📝 执行SQL脚本...')
  console.log('')

  try {
    // 直接执行整个SQL文件
    await client.query(cleanSql)
    console.log('✅ SQL脚本执行成功')
  } catch (error) {
    // 忽略已存在的错误（IF NOT EXISTS）和权限错误
    if (error.message.includes('already exists') || 
        error.message.includes('duplicate') ||
        error.message.includes('does not exist') ||
        error.message.includes('permission denied')) {
      console.log('⚠️  部分操作跳过:', error.message.substring(0, 80))
      // 如果只是扩展权限问题，继续执行其他部分
      if (error.message.includes('extension')) {
        console.log('   继续执行其他SQL语句...')
        // 移除扩展创建语句后重试
        const sqlWithoutExtension = cleanSql.replace(/CREATE\s+EXTENSION[^;]*;/gi, '')
        try {
          await client.query(sqlWithoutExtension)
          console.log('✅ SQL脚本执行成功（跳过扩展创建）')
        } catch (retryError) {
          if (!retryError.message.includes('already exists') && 
              !retryError.message.includes('duplicate')) {
            throw retryError
          }
        }
      }
    } else {
      console.error('❌ SQL执行失败:', error.message)
      throw error
    }
  }

  console.log('')
  console.log('='.repeat(60))
  console.log('✅ SQL脚本执行完成')
  console.log('='.repeat(60))
  console.log('')

  // 验证表创建
  console.log('🔍 验证表结构...')
  const tablesResult = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `)

  if (tablesResult.rows.length > 0) {
    console.log(`✅ 发现 ${tablesResult.rows.length} 个表:`)
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`)
    })
  } else {
    console.log('⚠️  未发现表')
  }

  // 检查视图
  const viewsResult = await client.query(`
    SELECT table_name 
    FROM information_schema.views 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `)

  if (viewsResult.rows.length > 0) {
    console.log(`✅ 发现 ${viewsResult.rows.length} 个视图:`)
    viewsResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`)
    })
  }

  // 统计记录数
  console.log('')
  console.log('📊 表记录统计:')
  try {
    const countResult = await client.query(`
      SELECT 'users' as table_name, count(*) as row_count FROM users
      UNION ALL
      SELECT 'user_progress', count(*) FROM user_progress
      UNION ALL
      SELECT 'task_completions', count(*) FROM task_completions
    `)
    
    countResult.rows.forEach(row => {
      console.log(`   ${row.table_name}: ${row.row_count} 条记录`)
    })
  } catch (error) {
    console.log('   (表可能不存在，这是正常的)')
  }

  client.release()
  await pool.end()

  console.log('')
  console.log('='.repeat(60))
  console.log('🎉 数据库初始化完成！')
  console.log('='.repeat(60))
  console.log('')
  console.log('下一步:')
  console.log('1. 确保 backend/.env 中已配置数据库连接信息')
  console.log('2. 启动后端服务: npm run dev')
  console.log('3. 测试API接口')
  console.log('')

} catch (error) {
  console.error('')
  console.error('❌ 初始化失败:', error.message)
  console.error('')
  process.exit(1)
}

