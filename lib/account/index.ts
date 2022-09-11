import { randomUUID } from 'crypto'
import { DateTime } from 'luxon'
import { DatabasePool, sql } from 'slonik'
import { z } from 'zod'
import { User } from '../user'

export const accountSchema = z
  .object({
    id: z.string(),
    user_id: z.string().optional(),
    type: z.string(),
    provider: z.string(),
    provider_account_id: z.string(),
    refresh_token: z.string(),
    access_token: z.string(),
    expires_at: z.number(),
    token_type: z.string(),
    scope: z.string(),
    id_token: z.string(),
    session_state: z.string(),
    oauth_token_secret: z.string(),
    oauth_token: z.string()
  })
  .transform((a) => ({
    id: a.id,
    userId: a.user_id,
    type: a.type,
    provider: a.provider,
    providerAccountId: a.provider_account_id,
    refresh_token: a.refresh_token,
    access_token: a.access_token,
    expires_at: a.expires_at,
    token_type: a.token_type,
    scope: a.scope,
    id_token: a.id_token,
    session_state: a.session_state,
    oauth_token_secret: a.oauth_token_secret,
    oauth_token: a.oauth_token
  }))

export type Account = z.infer<typeof accountSchema>

export const createAccountInputSchema = z.object({
  userId: z.string(),
  type: z.string(),
  provider: z.string(),
  providerAccountId: z.string(),
  refresh_token: z.string(),
  access_token: z.string(),
  expires_at: z.number(),
  token_type: z.string(),
  scope: z.string(),
  id_token: z.string(),
  session_state: z.string(),
  oauth_token_secret: z.string(),
  oauth_token: z.string()
})

export type CreateAccountInput = z.infer<typeof createAccountInputSchema>

export type UpdateAccountInput = z.infer<typeof accountSchema>

export const makeAccountFunctions = (pool: DatabasePool) => ({
  async createAccount(accountInput: CreateAccountInput) {
    const result = pool.one(sql.type(accountSchema)`
      INSERT INTO public.account (
        user_id,
        type,
        provider,
        provider_account_id,
        refresh_token,
        access_token,
        expires_at,
        token_type,
        scope,
        id_token,
        session_state,
        oauth_token_secret,
        oauth_token
      )
      VALUES (
        ${accountInput.userId},
        ${accountInput.type},
        ${accountInput.provider},
        ${accountInput.providerAccountId},
        ${accountInput.refresh_token},
        ${accountInput.access_token},
        ${accountInput.expires_at},
        ${accountInput.token_type},
        ${accountInput.scope},
        ${accountInput.id_token},
        ${accountInput.session_state},
        ${accountInput.oauth_token_secret},
        ${accountInput.oauth_token}
      )
      RETURNING
        id
        user_id,
        type,
        provider,
        provider_account_id,
        refresh_token,
        access_token,
        expires_at,
        token_type,
        scope,
        id_token,
        session_state,
        oauth_token_secret,
        oauth_token;
    `)

    return result
  },

  async updateAccount(accountInput: UpdateAccountInput) {
    const result = pool.one(sql.type(accountSchema)`
      UPDATE public.account
      SET ${sql.join(
        Object.entries(accountInput).map(([col, value]) => `${col} = ${value}`),
        sql.literalValue(', ')
      )}
      WHERE id = ${accountInput.id}
      RETURNING id;
    `)

    return result
  },

  async getAccount(id: string) {
    const result = pool.one(sql.type(accountSchema)`
        SELECT * FROM public.account WHERE id = ${id};
    `)

    return result
  },

  async listAccounts() {
    const result = pool.many(sql.type(accountSchema)`
        SELECT * FROM public.account;
    `)

    return result
  },

  async getAccountByUser(userId: string) {
    const result = pool.one(sql.type(accountSchema)`
        SELECT * FROM public.account
        WHERE user_id = ${userId};
    `)

    return result
  }
})

if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest

  describe('account functions', async () => {
    const { createMockPool, createMockQueryResult } = await import('slonik')

    it('createAccount', async () => {
      const id = randomUUID()

      const testAccount = {
        userId: randomUUID(),
        type: 'account',
        provider: 'google',
        providerAccountId: 'googleId',
        refresh_token: 'foobarbaz',
        access_token: 'foobarbaz',
        expires_at: DateTime.now().toUTC().toMillis(),
        token_type: 'foobarbaz',
        scope: 'web',
        id_token: 'foobarbaz',
        session_state: 'foobarbaz',
        oauth_token_secret: 'foobarbaz',
        oauth_token: 'foobarbaz'
      }

      const query = vi.fn(async () =>
        createMockQueryResult([
          {
            id,
            user_id: testAccount.userId,
            type: 'account',
            provider: 'google',
            provider_account_id: 'googleId',
            refresh_token: 'foobarbaz',
            access_token: 'foobarbaz',
            expires_at: testAccount.expires_at,
            token_type: 'foobarbaz',
            scope: 'web',
            id_token: 'foobarbaz',
            session_state: 'foobarbaz',
            oauth_token_secret: 'foobarbaz',
            oauth_token: 'foobarbaz'
          }
        ])
      )

      const pool = createMockPool({
        query
      })

      const { createAccount } = makeAccountFunctions(pool)

      const result = await createAccount(testAccount)

      expect(result).toMatchObject(testAccount)
      expect(result.id).toEqual(id)
    })

    it('updateAccount', async () => {
      const id = randomUUID()
      const userId = randomUUID()

      const testAccount = {
        id,
        userId,
        type: 'account',
        provider: 'google',
        providerAccountId: 'googleId',
        refresh_token: 'foobarbaz',
        access_token: 'foobarbaz',
        expires_at: DateTime.now().toUTC().toMillis(),
        token_type: 'foobarbaz',
        scope: 'web',
        id_token: 'foobarbaz',
        session_state: 'foobarbaz',
        oauth_token_secret: 'foobarbaz',
        oauth_token: 'foobarbaz'
      }

      const query = vi.fn(async () =>
        createMockQueryResult([
          {
            id,
            user_id: userId,
            type: 'account',
            provider: 'google',
            provider_account_id: testAccount.providerAccountId,
            refresh_token: 'foobarbaz',
            access_token: 'foobarbaz',
            expires_at: testAccount.expires_at,
            token_type: 'foobarbaz',
            scope: 'web',
            id_token: 'foobarbaz',
            session_state: 'foobarbaz',
            oauth_token_secret: 'foobarbaz',
            oauth_token: 'foobarbaz'
          }
        ])
      )

      const pool = createMockPool({
        query
      })

      const { updateAccount } = makeAccountFunctions(pool)

      const result = await updateAccount(testAccount)

      expect(result).toMatchObject(testAccount)
    })

    it('getAccount', async () => {
      const id = randomUUID()
      const userId = randomUUID()

      const testAccount = {
        id,
        userId,
        type: 'account',
        provider: 'google',
        providerAccountId: 'googleId',
        refresh_token: 'foobarbaz',
        access_token: 'foobarbaz',
        expires_at: DateTime.now().toUTC().toMillis(),
        token_type: 'foobarbaz',
        scope: 'web',
        id_token: 'foobarbaz',
        session_state: 'foobarbaz',
        oauth_token_secret: 'foobarbaz',
        oauth_token: 'foobarbaz'
      }

      const query = vi.fn(async () =>
        createMockQueryResult([
          {
            id,
            user_id: userId,
            type: 'account',
            provider: 'google',
            provider_account_id: testAccount.providerAccountId,
            refresh_token: 'foobarbaz',
            access_token: 'foobarbaz',
            expires_at: testAccount.expires_at,
            token_type: 'foobarbaz',
            scope: 'web',
            id_token: 'foobarbaz',
            session_state: 'foobarbaz',
            oauth_token_secret: 'foobarbaz',
            oauth_token: 'foobarbaz'
          }
        ])
      )

      const pool = createMockPool({
        query
      })

      const { getAccount } = makeAccountFunctions(pool)

      const result = await getAccount(testAccount.id)

      expect(result).toMatchObject(testAccount)
    })

    it('listAccounts', async () => {
      const accounts = [
        {
          id: randomUUID(),
          userId: randomUUID(),
          type: 'account',
          provider: 'google',
          providerAccountId: 'googleId',
          refresh_token: 'foobarbaz',
          access_token: 'foobarbaz',
          expires_at: DateTime.now().toUTC().toMillis(),
          token_type: 'foobarbaz',
          scope: 'web',
          id_token: 'foobarbaz',
          session_state: 'foobarbaz',
          oauth_token_secret: 'foobarbaz',
          oauth_token: 'foobarbaz'
        },
        {
          id: randomUUID(),
          userId: randomUUID(),
          type: 'account',
          provider: 'google',
          providerAccountId: 'googleId',
          refresh_token: 'foobarbaz',
          access_token: 'foobarbaz',
          expires_at: DateTime.now().toUTC().toMillis(),
          token_type: 'foobarbaz',
          scope: 'web',
          id_token: 'foobarbaz',
          session_state: 'foobarbaz',
          oauth_token_secret: 'foobarbaz',
          oauth_token: 'foobarbaz'
        },
        {
          id: randomUUID(),
          userId: randomUUID(),
          type: 'account',
          provider: 'google',
          providerAccountId: 'googleId',
          refresh_token: 'foobarbaz',
          access_token: 'foobarbaz',
          expires_at: DateTime.now().toUTC().toMillis(),
          token_type: 'foobarbaz',
          scope: 'web',
          id_token: 'foobarbaz',
          session_state: 'foobarbaz',
          oauth_token_secret: 'foobarbaz',
          oauth_token: 'foobarbaz'
        }
      ]

      const query = vi.fn(async () =>
        createMockQueryResult(
          accounts.map((a) => ({
            id: a.id,
            user_id: a.userId,
            type: a.type,
            provider: a.provider,
            provider_account_id: a.providerAccountId,
            refresh_token: a.refresh_token,
            access_token: a.access_token,
            expires_at: a.expires_at,
            token_type: a.token_type,
            scope: a.scope,
            id_token: a.id_token,
            session_state: a.session_state,
            oauth_token_secret: a.oauth_token_secret,
            oauth_token: a.oauth_token
          }))
        )
      )

      const pool = createMockPool({
        query
      })

      const { listAccounts } = makeAccountFunctions(pool)

      const result = await listAccounts()

      expect(result).toEqual(accounts)
    })

    it('getAccountByUser', async () => {
      const id = randomUUID()
      const userId = randomUUID()

      const user: User = {
        id: userId,
        name: 'Andrew Cline',
        email: 'andrew.cline77@gmail.com',
        emailVerified: undefined
      }

      const testAccount = {
        id,
        userId,
        type: 'account',
        provider: 'google',
        providerAccountId: 'googleId',
        refresh_token: 'foobarbaz',
        access_token: 'foobarbaz',
        expires_at: DateTime.now().toUTC().toMillis(),
        token_type: 'foobarbaz',
        scope: 'web',
        id_token: 'foobarbaz',
        session_state: 'foobarbaz',
        oauth_token_secret: 'foobarbaz',
        oauth_token: 'foobarbaz'
      }

      const query = vi.fn(async () =>
        createMockQueryResult([
          {
            id,
            user_id: userId,
            type: 'account',
            provider: 'google',
            provider_account_id: testAccount.providerAccountId,
            refresh_token: 'foobarbaz',
            access_token: 'foobarbaz',
            expires_at: testAccount.expires_at,
            token_type: 'foobarbaz',
            scope: 'web',
            id_token: 'foobarbaz',
            session_state: 'foobarbaz',
            oauth_token_secret: 'foobarbaz',
            oauth_token: 'foobarbaz'
          }
        ])
      )

      const pool = createMockPool({
        query
      })

      const { getAccountByUser } = makeAccountFunctions(pool)

      const result = await getAccountByUser(userId)

      expect(result).toMatchObject(testAccount)
    })
  })
}
