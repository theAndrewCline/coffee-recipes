import { DateTime } from 'luxon'
import { Adapter, AdapterUser } from 'next-auth/adapters'
import { DatabasePool, sql } from 'slonik'
import { z } from 'zod'
import {
  CreateUserInput,
  makeUserFunctions,
  User,
  userSchema
} from '../lib/user'

const adapterUser = (u: User): AdapterUser => ({
  ...u,
  id: u.id.toString(),
  emailVerified: u.emailVerified
    ? DateTime.fromSQL(u.emailVerified).toJSDate()
    : null
})

export default function PostgresAdapter(
  client: Promise<DatabasePool>
): Adapter {
  return {
    async createUser(user: Omit<AdapterUser, 'id'>) {
      const { createUser } = makeUserFunctions(await client)

      const result = await createUser({
        ...user
      } as CreateUserInput)

      return adapterUser(result)
    },

    async getUser(id: string) {
      const { getUser } = makeUserFunctions(await client)

      const result = await getUser(parseInt(id))

      return adapterUser(result)
    },

    async getUserByEmail(email: string) {
      const { getUserByEmail } = makeUserFunctions(await client)

      const result = await getUserByEmail(email)

      return adapterUser(result)
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const pool = await client

      const result = await pool.one(sql.type(userSchema)`
        SELECT FROM "Account"
        WHERE providerAccountId = ${providerAccountId}
        AND provider = ${provider};
      `)

      return adapterUser(result)
    },

    async updateUser(user) {
      const pool = await client

      const result = await pool.one(sql.type(userSchema)`
        UPDATE "User"
        SET ${sql.join(
          Object.entries(user).map(([col, value]) => `${col} = ${value}`),
          sql.literalValue(', ')
        )}
        WHERE id = ${user.id as string};
        RETURNING id, email, email_verified, name;
      `)

      return adapterUser(result)
    },

    async deleteUser(userId) {
      const pool = await client

      const result = await pool.one(sql.type(userSchema)`
        DELETE "User"
        WHERE id = ${userId};
        RETURNING id, name, email, email_verified;
      `)

      return adapterUser(result)
    },

    async linkAccount(account) {
      const pool = await client

      await pool.one(sql.type(
        z.object({
          user_id: z.string(),
          provider_id: z.string(),
          provider_type: z.string(),
          provider_account_id: z.string(),
          access_token: z.string(),
          access_token_expires: z.string()
        })
      )`
        INSERT INTO "Account" 
        (
          user_id, 
          provider_id, 
          provider_type, 
          provider_account_id, 
          access_token,
          access_token_expires
        )
        VALUES (
          ${account.userId}
          ${account.provider}
          ${account.type}
          ${account.providerAccountId}
          ${account.access_token as string}
          ${account.expires_at as number}
        );
      `)

      return account
    },
    async unlinkAccount({ providerAccountId, provider }) {
      const pool = await client

      await pool.one(sql.type(
        z.object({
          id: z.string()
        })
      )`
        DELETE "Account"
        WHERE providerAccountId = ${providerAccountId} && ${provider};
      `)
    },
    async createSession({ sessionToken, userId, expires }) {
      const pool = await client

      const result = await pool.one(sql.type(
        z.object({
          id: z.string(),
          sessionToken: z.string(),
          userId: z.string(),
          expires: z.date()
        })
      )`
        INSERT INTO "Session" (
          sessionToken,
          userId,
          expires
        ) 
        VALUES (
          ${sessionToken},
          ${userId},
          ${expires.toUTCString()}
        )
        RETURNING
          id,
          sessionToken,
          userId,
          expires;
      `)

      return result
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
