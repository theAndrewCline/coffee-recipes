import { randomUUID } from 'crypto'
import { DatabasePool, sql } from 'slonik'
import { z } from 'zod'

export const accountSchema = z
  .object({
    id: z.string()
  })
  .transform((a) => ({
    id: a.id
  }))

export type Account = z.infer<typeof accountSchema>

export const createAccountInputSchema = z.object({})

export type CreateAccountInput = z.infer<typeof createAccountInputSchema>

export type UpdateAccountInput = z.infer<typeof accountSchema>

export const makeAccountFunctions = (pool: DatabasePool) => ({
  async createAccount(accountInput: CreateAccountInput) {
    const result = pool.one(sql.type(accountSchema)`
      INSERT INTO public.account ()
      VALUES ()
      RETURNING id;
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
  }
})

if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest

  describe('account functions', async () => {
    const { createMockPool, createMockQueryResult } = await import('slonik')

    it.todo('createAccount', async () => {
      const id = randomUUID()

      const query = vi.fn(async () =>
        createMockQueryResult([
          {
            id
          }
        ])
      )

      const pool = createMockPool({
        query
      })

      const { createAccount } = makeAccountFunctions(pool)

      const testAccount = {}

      const result = await createAccount(testAccount)

      expect(result).toMatchObject(testAccount)
      expect(result.id).toEqual(id)
    })

    it.todo('updateAccount', async () => {
      const id = randomUUID()

      const query = vi.fn(async () =>
        createMockQueryResult([
          {
            id
          }
        ])
      )

      const pool = createMockPool({
        query
      })

      const { updateAccount } = makeAccountFunctions(pool)

      const testAccount = {
        id
      }

      const result = await updateAccount(testAccount)

      expect(result).toMatchObject(testAccount)
    })

    it.todo('getAccount', async () => {
      const id = randomUUID()

      const query = vi.fn(async () =>
        createMockQueryResult([
          {
            id
          }
        ])
      )

      const pool = createMockPool({
        query
      })

      const { getAccount } = makeAccountFunctions(pool)

      const testAccount = {
        id
      }

      const result = await getAccount(testAccount.id)

      expect(result).toMatchObject(testAccount)
    })

    it.todo('listAccounts', async () => {
      const accounts = [
        {
          id: randomUUID()
        },
        {
          id: randomUUID()
        },
        {
          id: randomUUID()
        }
      ]

      const query = vi.fn(async () => createMockQueryResult(accounts))

      const pool = createMockPool({
        query
      })

      const { listAccounts } = makeAccountFunctions(pool)

      const result = await listAccounts()

      expect(result).toEqual(
        accounts.map((u) => ({
          id: u.id
        }))
      )
    })
  })
}
