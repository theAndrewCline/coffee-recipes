import { DateTime } from 'luxon'
import { Account, Awaitable } from 'next-auth'
import { Adapter, AdapterSession, AdapterUser } from 'next-auth/adapters'
import { DatabasePool } from 'slonik'
import { makeAccountFunctions } from '../lib/account'
import { makeSessionFunctions, Session } from '../lib/session'
import { CreateUserInput, makeUserFunctions, User } from '../lib/user'
import { makeVerificationTokenFunctions } from '../lib/verificationToken'

const adapterUser = (u: User): AdapterUser => ({
  ...u,
  emailVerified: u.emailVerified
    ? DateTime.fromSQL(u.emailVerified).toJSDate()
    : null
})

const adapterSession = (s: Session): AdapterSession => ({
  ...s,
  expires: s.expires.toJSDate()
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

      return result ? adapterUser(result) : result
    },

    async getUserByEmail(email: string) {
      const { getUserByEmail } = makeUserFunctions(await client)

      const result = await getUserByEmail(email)

      return result ? adapterUser(result) : result
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
      const { deleteUser } = makeUserFunctions(await client)
      const result = await deleteUser(userId)
      return adapterUser(result)
    },

    async linkAccount(account) {
      const { createAccount } = makeAccountFunctions(await client)

      const result = await createAccount(account)

      return result as Awaitable<Account>
    },

    async unlinkAccount({ providerAccountId, provider }) {},

    async createSession({ sessionToken, userId, expires }) {
      const { createSession } = makeSessionFunctions(await client)

      const result = await createSession({
        sessionToken,
        userId,
        expires: expires.toISOString()
      })

      return adapterSession(result)
    },

    async getSessionAndUser(sessionToken) {
      const pool = await client

      const { getSessionByToken } = makeSessionFunctions(pool)
      const session = await getSessionByToken(sessionToken)

      const { getUser } = makeUserFunctions(pool)
      const user = await getUser(session.userId)

      return {
        session: adapterSession(session),
        user: adapterUser(user)
      }
    },

    async updateSession(session) {
      const pool = await client

      const { updateSession } = makeSessionFunctions(pool)
      const updatedSession = await updateSession({
        ...session,
        expires: session.expires
          ? DateTime.fromJSDate(session.expires)
          : undefined
      })

      return adapterSession(updatedSession)
    },

    async deleteSession(sessionToken) {
      const pool = await client

      const { getSessionByToken, deleteSession } = makeSessionFunctions(pool)
      const session = await getSessionByToken(sessionToken)
      const result = await deleteSession(session.id)

      return adapterSession(result)
    },

    async createVerificationToken({ identifier, expires, token }) {
      const pool = await client

      const { createVerificationToken } = makeVerificationTokenFunctions(pool)
      const result = await createVerificationToken({
        identifier,
        expires: expires.toISOString(),
        token
      })

      return {
        ...result,
        expires: result.expires.toJSDate()
      }
    },

    async useVerificationToken({ identifier }) {
      const pool = await client

      const { deleteVerificationToken } = makeVerificationTokenFunctions(pool)
      const result = await deleteVerificationToken(identifier)

      return {
        ...result,
        expires: result.expires.toJSDate()
      }
    }
  }
}
