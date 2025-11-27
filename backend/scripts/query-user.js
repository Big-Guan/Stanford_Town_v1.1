import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const username = process.argv[2]

if (!username) {
  console.error('Usage: node scripts/query-user.js <username>')
  process.exit(1)
}

async function main() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  })

  try {
    const res = await pool.query(
      `SELECT 
        u.id,
        u.username,
        up.score,
        up.inventory,
        up.completed_npcs,
        up.updated_at
       FROM users u
       LEFT JOIN user_progress up ON u.id = up.user_id
       WHERE u.username = $1`,
      [username]
    )

    console.log(JSON.stringify(res.rows, null, 2))
  } catch (error) {
    console.error('Query error:', error.message)
  } finally {
    await pool.end()
  }
}

main()

