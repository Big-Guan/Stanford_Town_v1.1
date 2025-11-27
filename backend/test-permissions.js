/**
 * 测试数据库权限
 */

import pg from 'pg'
import dotenv from 'dotenv'
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
  ssl: false,
}

console.log('='.repeat(60))
console.log('🔐 数据库权限测试')
console.log('='.repeat(60))
console.log('')

if (!config.user || !config.password) {
  console.error('❌ 错误: 数据库用户名或密码未配置！')
  process.exit(1)
}

console.log('📋 连接信息:')
console.log(`   用户: ${config.user}`)
console.log(`   主机: ${config.host}:${config.port}`)
console.log(`   数据库: ${config.database}`)
console.log('')

const pool = new Pool(config)

try {
  const client = await pool.connect()
  console.log('✅ 连接成功')
  console.log('')

  // 测试1: 检查当前用户信息
  console.log('📊 测试 1: 检查当前用户信息...')
  try {
    const userResult = await client.query('SELECT current_user, session_user, current_database()')
    console.log(`   ✅ 当前用户: ${userResult.rows[0].current_user}`)
    console.log(`   ✅ 会话用户: ${userResult.rows[0].session_user}`)
    console.log(`   ✅ 当前数据库: ${userResult.rows[0].current_database}`)
  } catch (error) {
    console.log(`   ❌ 失败: ${error.message}`)
  }
  console.log('')

  // 测试2: 检查schema权限
  console.log('📊 测试 2: 检查schema权限...')
  try {
    const schemaResult = await client.query(`
      SELECT schema_name, schema_owner
      FROM information_schema.schemata
      WHERE schema_name = 'public'
    `)
    if (schemaResult.rows.length > 0) {
      console.log(`   ✅ public schema存在，所有者: ${schemaResult.rows[0].schema_owner}`)
    } else {
      console.log(`   ⚠️  public schema不存在`)
    }
  } catch (error) {
    console.log(`   ❌ 失败: ${error.message}`)
  }
  console.log('')

  // 测试3: 检查CREATE权限
  console.log('📊 测试 3: 测试CREATE TABLE权限...')
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_permissions_table (
        id SERIAL PRIMARY KEY,
        test_data VARCHAR(50)
      )
    `)
    console.log('   ✅ CREATE TABLE 权限正常')
    
    // 清理测试表
    await client.query('DROP TABLE IF EXISTS test_permissions_table')
    console.log('   ✅ 测试表已清理')
  } catch (error) {
    console.log(`   ❌ CREATE TABLE 失败: ${error.message}`)
  }
  console.log('')

  // 测试4: 检查INSERT权限
  console.log('📊 测试 4: 测试INSERT权限...')
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_insert_table (
        id SERIAL PRIMARY KEY,
        test_data VARCHAR(50)
      )
    `)
    await client.query(`INSERT INTO test_insert_table (test_data) VALUES ('test')`)
    console.log('   ✅ INSERT 权限正常')
    await client.query('DROP TABLE IF EXISTS test_insert_table')
  } catch (error) {
    console.log(`   ❌ INSERT 失败: ${error.message}`)
    try {
      await client.query('DROP TABLE IF EXISTS test_insert_table')
    } catch {}
  }
  console.log('')

  // 测试5: 检查SELECT权限
  console.log('📊 测试 5: 测试SELECT权限...')
  try {
    const selectResult = await client.query('SELECT 1 as test')
    console.log('   ✅ SELECT 权限正常')
  } catch (error) {
    console.log(`   ❌ SELECT 失败: ${error.message}`)
  }
  console.log('')

  // 测试6: 检查是否有现有表
  console.log('📊 测试 6: 检查现有表...')
  try {
    const tablesResult = await client.query(`
      SELECT table_name, table_schema
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
      console.log('   ⚠️  未发现任何表')
    }
  } catch (error) {
    console.log(`   ❌ 失败: ${error.message}`)
  }
  console.log('')

  // 测试7: 检查用户角色和权限
  console.log('📊 测试 7: 检查用户角色...')
  try {
    const roleResult = await client.query(`
      SELECT 
        r.rolname,
        r.rolsuper,
        r.rolcreaterole,
        r.rolcreatedb,
        r.rolcanlogin
      FROM pg_roles r
      WHERE r.rolname = current_user
    `)
    if (roleResult.rows.length > 0) {
      const role = roleResult.rows[0]
      console.log(`   ✅ 角色: ${role.rolname}`)
      console.log(`      - 超级用户: ${role.rolsuper ? '是' : '否'}`)
      console.log(`      - 可创建角色: ${role.rolcreaterole ? '是' : '否'}`)
      console.log(`      - 可创建数据库: ${role.rolcreatedb ? '是' : '否'}`)
      console.log(`      - 可登录: ${role.rolcanlogin ? '是' : '否'}`)
    }
  } catch (error) {
    console.log(`   ❌ 失败: ${error.message}`)
  }
  console.log('')

  // 测试8: 检查public schema的权限
  console.log('📊 测试 8: 检查public schema权限...')
  try {
    const permResult = await client.query(`
      SELECT 
        grantee,
        privilege_type
      FROM information_schema.schema_privileges
      WHERE schema_name = 'public' AND grantee = current_user
    `)
    if (permResult.rows.length > 0) {
      console.log(`   ✅ 您在public schema的权限:`)
      permResult.rows.forEach(row => {
        console.log(`      - ${row.privilege_type}`)
      })
    } else {
      console.log('   ⚠️  未发现明确的权限记录')
    }
  } catch (error) {
    console.log(`   ❌ 失败: ${error.message}`)
  }
  console.log('')

  client.release()
  await pool.end()

  console.log('='.repeat(60))
  console.log('✅ 权限测试完成')
  console.log('='.repeat(60))
  console.log('')

} catch (error) {
  console.error('')
  console.error('❌ 测试失败:', error.message)
  console.error('')
  process.exit(1)
}

