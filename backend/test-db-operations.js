/**
 * 测试数据库操作
 * 验证保存/读取用户进度功能
 */

import * as db from './src/services/databaseService.js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '.env') })

const TEST_USER_ID = 'test_user_' + Date.now()

async function testDatabaseOperations() {
  console.log('='.repeat(60))
  console.log('🧪 数据库操作测试')
  console.log('='.repeat(60))
  console.log('')

  try {
    // 1. 初始化数据库连接
    console.log('1️⃣ 初始化数据库连接...')
    const connected = await db.initDatabase()
    if (!connected) {
      console.error('❌ 数据库连接失败，请检查配置')
      process.exit(1)
    }
    console.log('✅ 数据库连接成功')
    console.log('')

    // 2. 测试保存用户进度
    console.log('2️⃣ 测试保存用户进度...')
    const testData = {
      score: 100,
      inventory: ['✨ 测试物品1', '🎁 测试物品2'],
      position: { x: 5, y: 5 },
      avatar: '👤'
    }
    
    await db.saveUserProgress(TEST_USER_ID, testData)
    console.log('✅ 用户进度保存成功')
    console.log(`   用户ID: ${TEST_USER_ID}`)
    console.log(`   积分: ${testData.score}`)
    console.log(`   位置: (${testData.position.x}, ${testData.position.y})`)
    console.log('')

    // 3. 测试读取用户进度
    console.log('3️⃣ 测试读取用户进度...')
    const progress = await db.getUserProgress(TEST_USER_ID)
    console.log('✅ 用户进度读取成功')
    console.log('   读取的数据:', JSON.stringify(progress, null, 2))
    
    // 验证数据
    if (progress.score !== testData.score) {
      throw new Error(`积分不匹配: 期望 ${testData.score}, 实际 ${progress.score}`)
    }
    if (JSON.stringify(progress.position) !== JSON.stringify(testData.position)) {
      throw new Error('位置不匹配')
    }
    console.log('✅ 数据验证通过')
    console.log('')

    // 4. 测试保存任务完成记录
    console.log('4️⃣ 测试保存任务完成记录...')
    const taskRecord = {
      userId: TEST_USER_ID,
      npcId: 1,
      taskType: 'prompt',
      content: '测试任务内容',
      feedback: '测试反馈',
      passed: true
    }
    
    await db.saveTaskCompletion(taskRecord)
    console.log('✅ 任务完成记录保存成功')
    console.log('')

    // 5. 测试获取排行榜
    console.log('5️⃣ 测试获取排行榜...')
    const leaderboard = await db.getLeaderboard(5)
    console.log('✅ 排行榜获取成功')
    console.log(`   排行榜前 ${leaderboard.length} 名:`)
    leaderboard.forEach((entry, index) => {
      console.log(`   ${index + 1}. ${entry.username || '未知'} - ${entry.score} 分`)
    })
    console.log('')

    // 6. 测试更新用户进度
    console.log('6️⃣ 测试更新用户进度...')
    const updatedData = {
      score: 250,
      inventory: ['✨ 测试物品1', '🎁 测试物品2', '🏆 新物品'],
      position: { x: 8, y: 8 },
      avatar: '👤'
    }
    
    await db.saveUserProgress(TEST_USER_ID, updatedData)
    const updatedProgress = await db.getUserProgress(TEST_USER_ID)
    
    if (updatedProgress.score !== updatedData.score) {
      throw new Error(`更新失败: 期望 ${updatedData.score}, 实际 ${updatedProgress.score}`)
    }
    console.log('✅ 用户进度更新成功')
    console.log(`   新积分: ${updatedProgress.score}`)
    console.log('')

    console.log('='.repeat(60))
    console.log('🎉 所有测试通过！')
    console.log('='.repeat(60))
    console.log('')
    console.log('📝 测试总结:')
    console.log('   ✅ 数据库连接')
    console.log('   ✅ 保存用户进度')
    console.log('   ✅ 读取用户进度')
    console.log('   ✅ 保存任务记录')
    console.log('   ✅ 获取排行榜')
    console.log('   ✅ 更新用户进度')
    console.log('')
    console.log('💡 提示: 测试数据已保存到数据库，可以手动清理')

  } catch (error) {
    console.error('')
    console.error('❌ 测试失败:', error.message)
    console.error('')
    console.error('错误详情:', error)
    process.exit(1)
  } finally {
    // 关闭数据库连接
    await db.closeDatabase()
  }
}

testDatabaseOperations()

