/**
 * Bun migration runner
 *
 * Usage: bun run scripts/migrate.ts
 *
 * Reads all *.sql files from src/infrastructure/db/migrations/ in lexicographic
 * order, checks which have already been applied via the schema_migrations table,
 * and runs only the pending ones inside individual transactions.
 */

import { Pool, type PoolClient } from 'pg'
import { readdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const DATABASE_URL = process.env['DATABASE_URL']

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required')
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL })

const MIGRATIONS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '../src/infrastructure/db/migrations',
)

async function ensureMigrationsTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
}

async function getAppliedMigrations(client: PoolClient): Promise<Set<string>> {
  const result = await client.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations ORDER BY filename',
  )
  return new Set(result.rows.map((r) => r.filename))
}

async function getMigrationFiles(): Promise<string[]> {
  const entries = await readdir(MIGRATIONS_DIR)
  return entries
    .filter((f) => f.endsWith('.sql'))
    .sort()
}

async function runMigration(
  client: PoolClient,
  filename: string,
): Promise<void> {
  const filepath = join(MIGRATIONS_DIR, filename)
  const sql = await readFile(filepath, 'utf-8')

  await client.query('BEGIN')
  try {
    await client.query(sql)
    await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1)',
      [filename],
    )
    await client.query('COMMIT')
    console.log(`  [ok] ${filename}`)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  }
}

async function main(): Promise<void> {
  const client = await pool.connect()

  try {
    await ensureMigrationsTable(client)

    const applied = await getAppliedMigrations(client)
    const files = await getMigrationFiles()
    const pending = files.filter((f) => !applied.has(f))

    if (pending.length === 0) {
      console.log('No pending migrations.')
      return
    }

    console.log(`Running ${pending.length} migration(s)...`)

    for (const filename of pending) {
      await runMigration(client, filename)
    }

    console.log('All migrations applied successfully.')
  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

await main()
