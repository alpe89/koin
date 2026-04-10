import { Pool } from 'pg'

const DATABASE_URL = process.env['DATABASE_URL']

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 5,
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle postgres client', err)
  process.exit(1)
})
