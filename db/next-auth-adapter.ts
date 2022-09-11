import { DateTime } from 'luxon'
import { Adapter, AdapterUser } from 'next-auth/adapters'
import { DatabasePool, sql } from 'slonik'
import { z } from 'zod'
import { makeSessionFunctions } from '../lib/session'
import {
  CreateUserInput,
  makeUserFunctions,
  User,
  userSchema
} from '../lib/user'

const adapterUser = (u: User): AdapterUser => ({
  ...u,
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

      const result = await getUser(id)

      return adapterUser(result)
    },

    async getUserByEmail(email: string) {
      const { getUserByEmail } = makeUserFunctions(await client)

      const result = await getUserByEmail(email)

      return adapterUser(result)
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const { getUserByAccount } = makeUserFunctions(await client)

      const result = await getUserByAccount({ providerAccountId, provider })

      return adapterUser(result)
    },

    async updateUser(user) {
      const { updateUser } = makeUserFunctions(await client)

      const result = await updateUser(user as Partial<User>)

      return adapterUser(result)
    },

    async deleteUser(userId) {
      // const { deleteUser } = makeUserFunctions(await client)
      // const result = await deleteUser(userId)
      // return adapterUser(result)
    },

    async linkAccount(account) {
      const pool = await client

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
      const { createSession } = makeSessionFunctions(await client)

      const result = await createSession({
        sessionToken,
        userId,
        expires: expires.toISOString()
      })

      return {
        ...result,
        expires: result.expires.toJSDate()
      }
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
