import { Awaitable } from 'next-auth'
import { Adapter, AdapterUser } from 'next-auth/adapters'
import { DatabasePool, sql } from 'slonik'
import { z } from 'zod'

const userSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    email_verified: z.date()
  })
  .transform((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.email_verified
  }))

export default function PostgresAdapter(
  client: Promise<DatabasePool>
): Adapter {
  return {
    async createUser(user: Omit<AdapterUser, 'id'>) {
      const pool = await client

      const result = await pool.query(
        sql.type(userSchema)`
          INSERT INTO users (
            name,
            email,
            email_verified,
            image,
            username
          )
          VALUES (
            ${user.name as string},
            ${user.email as string},
            ${user.email_verified as boolean},
            ${(user?.image as string) || null},
            ${user.username as string}
          )
          RETURNING id, name, email, email_verified, image
        `
      )

      return result.rows[0]
    },
    async getUser(id: string) {
      const pool = await client

      const result = await pool.one(sql.type(userSchema)`
        SELECT * FROM users WHERE id = ${id};
      `)

      return result
    },
    async getUserByEmail(email: string) {
      const pool = await client

      const result = await pool.one(sql.type(userSchema)`
        SELECT * FROM users WHERE email = ${email};
      `)

      return result
    },
    async getUserByAccount({ providerAccountId, provider }) {
      return
    },
    async updateUser(user) {
      const pool = await client

      const result = await pool.one(sql.type(userSchema)`
        UPDATE users
        SET ${sql.join(
          Object.entries(user).map(([col, value]) => `${col} = ${value}`),
          sql.literalValue(', ')
        )}
        WHERE id = ${user.id as string};
        RETURNING id, email, email_verified, name 
      `)

      return result
    },
    async deleteUser(userId) {
      const pool = await client

      const result = await pool.one(sql.type(userSchema)`
        DELETE users
        WHERE id = ${userId};
        RETURNING id, name, email, email_verified
      `)

      return result
    },
    async linkAccount(account) {
      const pool = await client

      const sql = `
        INSERT INTO accounts 
        (
          user_id, 
          provider_id, 
          provider_type, 
          provider_account_id, 
          access_token,
          access_token_expires
        )
        VALUES ($1, $2, $3, $4, $5, to_timestamp($6))`

      const params = [
        account.userId,
        account.provider,
        account.type,
        account.providerAccountId,
        account.access_token,
        account.expires_at
      ]

      await client.query(sql, params)
      return account
    },
    async unlinkAccount({ providerAccountId, provider }) {
      return
    },
    async createSession({ sessionToken, userId, expires }) {
      return
    },
    async getSessionAndUser(sessionToken) {
      return
    },
    async updateSession({ sessionToken }) {
      return
    },
    async deleteSession(sessionToken) {
      return
    },
    async createVerificationToken({ identifier, expires, token }) {
      return
    },
    async useVerificationToken({ identifier, token }) {
      return
    }
  }
}
