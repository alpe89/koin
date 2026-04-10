import type { Pool, PoolClient } from 'pg'
import type { AuthProvider } from '../../infrastructure/auth/auth-provider.port.ts'
import type { JwtService } from '../../infrastructure/jwt/jwt.port.ts'
import type { AuthUser } from './auth.types.ts'

// Default categories seeded for every new group
const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Housing', sort_order: 0 },
  { name: 'Groceries', sort_order: 1 },
  { name: 'Transport', sort_order: 2 },
  { name: 'Utilities', sort_order: 3 },
  { name: 'Health', sort_order: 4 },
  { name: 'Dining out', sort_order: 5 },
  { name: 'Entertainment', sort_order: 6 },
  { name: 'Other', sort_order: 7 },
]

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', sort_order: 0 },
  { name: 'Freelance', sort_order: 1 },
  { name: 'Other income', sort_order: 2 },
]

export async function seedGroupCategories(
  client: PoolClient,
  groupId: string,
): Promise<void> {
  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    await client.query(
      `INSERT INTO categories (group_id, name, type, sort_order)
       VALUES ($1, $2, 'expense', $3)`,
      [groupId, cat.name, cat.sort_order],
    )
  }
  for (const cat of DEFAULT_INCOME_CATEGORIES) {
    await client.query(
      `INSERT INTO categories (group_id, name, type, sort_order)
       VALUES ($1, $2, 'income', $3)`,
      [groupId, cat.name, cat.sort_order],
    )
  }
}

export function buildAuthService(
  db: Pool,
  authProvider: AuthProvider,
  jwtService: JwtService,
  googleRedirectUri: string,
) {
  function buildGoogleAuthUrl(state: string): string {
    return authProvider.buildAuthUrl(googleRedirectUri, state)
  }

  async function handleCallback(code: string): Promise<{ token: string; isNewUser: boolean }> {
    const profile = await authProvider.exchangeCodeForProfile(code, googleRedirectUri)

    const client = await db.connect()
    try {
      await client.query('BEGIN')

      // Upsert user by google_sub
      const upsertResult = await client.query<{
        id: string
        email: string
        display_name: string
        avatar_url: string | null
        default_group_id: string | null
        is_new: boolean
      }>(
        `INSERT INTO users (google_sub, email, display_name, avatar_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (google_sub) DO UPDATE
           SET email        = EXCLUDED.email,
               display_name = EXCLUDED.display_name,
               avatar_url   = EXCLUDED.avatar_url,
               updated_at   = now()
         RETURNING
           id,
           email,
           display_name,
           avatar_url,
           default_group_id,
           (xmax = 0) AS is_new`,
        [profile.googleSub, profile.email, profile.displayName, profile.avatarUrl],
      )

      const user = upsertResult.rows[0]
      if (!user) {
        throw new Error('Failed to upsert user')
      }

      const isNewUser = user.is_new

      // First login: create personal group, add as owner, seed categories — single transaction
      if (isNewUser) {
        const firstName = profile.displayName.split(' ')[0] ?? profile.displayName
        const groupName = `${firstName}'s Group`

        const groupResult = await client.query<{ id: string }>(
          `INSERT INTO groups (name, owner_id) VALUES ($1, $2) RETURNING id`,
          [groupName, user.id],
        )
        const group = groupResult.rows[0]
        if (!group) {
          throw new Error('Failed to create personal group')
        }

        await client.query(
          `INSERT INTO group_members (group_id, user_id, role)
           VALUES ($1, $2, 'owner')`,
          [group.id, user.id],
        )

        await seedGroupCategories(client, group.id)

        // Set as default group
        await client.query(
          `UPDATE users SET default_group_id = $1, updated_at = now() WHERE id = $2`,
          [group.id, user.id],
        )
      }

      await client.query('COMMIT')

      const token = jwtService.sign({
        sub: user.id,
        email: user.email,
        displayName: user.display_name,
      })

      return { token, isNewUser }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  async function getMe(userId: string): Promise<AuthUser | null> {
    const result = await db.query<{
      id: string
      email: string
      display_name: string
      avatar_url: string | null
      default_group_id: string | null
    }>(
      `SELECT id, email, display_name, avatar_url, default_group_id
       FROM users WHERE id = $1`,
      [userId],
    )
    const row = result.rows[0]
    if (!row) return null
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      defaultGroupId: row.default_group_id,
    }
  }

  return { buildGoogleAuthUrl, handleCallback, getMe }
}

export type AuthService = ReturnType<typeof buildAuthService>
