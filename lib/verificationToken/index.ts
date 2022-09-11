import { randomUUID } from 'crypto'
import { DateTime } from 'luxon'
import { DatabasePool, sql } from 'slonik'
import { z } from 'zod'

export const verificationSchema = z
  .object({
    id: z.string(),
    token: z.string(),
    identifier: z.string(),
    expires: z.string()
  })
  .transform((s) => ({
    id: s.id,
    token: s.token,
    identifier: s.identifier,
    expires: DateTime.fromSQL(s.expires)
  }))

export type VerificationToken = z.infer<typeof verificationSchema>

export const createVerificationTokenInputSchema = z.object({
  token: z.string(),
  identifier: z.string(),
  expires: z.string()
})

export type CreateVerificationTokenInput = z.infer<
  typeof createVerificationTokenInputSchema
>

export type UpdateVerificationTokenInput = Partial<
  z.infer<typeof verificationSchema>
>

export const makeVerificationTokenFunctions = (pool: DatabasePool) => ({
  async createVerificationToken({
    identifier,
    token,
    expires
  }: CreateVerificationTokenInput) {
    const result = pool.one(sql.type(verificationSchema)`
      INSERT INTO public.verification_token (identifier, token, expires)
      VALUES (${identifier}, ${token}, ${expires})
      RETURNING id, identifier, token, expires;
    `)

    return result
  },

  async updateVerificationToken(
    verificationInput: UpdateVerificationTokenInput
  ) {
    const result = pool.one(sql.type(verificationSchema)`
      UPDATE public.verification
      SET ${sql.join(
        Object.entries(verificationInput).map(
          ([col, value]) => `${col} = ${value}`
        ),
        sql.literalValue(', ')
      )}
      WHERE id = ${verificationInput.id as string}
      RETURNING id, identifier, token, expires;
    `)

    return result
  },

  async getVerificationToken(id: string) {
    const result = pool.one(sql.type(verificationSchema)`
        SELECT * FROM public.verification WHERE id = ${id};
    `)

    return result
  },

  async deleteVerificationToken(id: string) {
    const result = pool.one(sql.type(verificationSchema)`
      DELETE FROM public.verification
      WHERE id = ${id}
      RETURNING id, identifier, token, expires;
    `)

    return result
  },

  async listVerificationTokens() {
    const result = pool.many(sql.type(verificationSchema)`
        SELECT * FROM public.verification;
    `)

    return result
  }
})

if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest

  describe('verification functions', async () => {
    const { createMockPool, createMockQueryResult } = await import('slonik')

    it('createVerificationToken', async () => {
      const id = randomUUID()
      const identifier = randomUUID()
      const expires = DateTime.now()
      const token = 'foobarbaz'

      const expectedResult: VerificationToken = {
        id,
        identifier,
        token,
        expires
      }

      const query = vi.fn(async () =>
        createMockQueryResult([
          {
            id,
            identifier,
            token,
            expires: expires.toSQL()
          }
        ])
      )

      const pool = createMockPool({
        query
      })

      const { createVerificationToken } = makeVerificationTokenFunctions(pool)

      const result = await createVerificationToken({
        identifier,
        token,
        expires: expires.toSQL()
      })

      expect(result).toEqual(expectedResult)
    })

    it('updateVerificationToken', async () => {
      const id = randomUUID()
      const identifier = randomUUID()
      const expires = DateTime.now()
      const token = 'foobarbaz'

      const expectedResult: VerificationToken = {
        id,
        identifier,
        token,
        expires
      }

      const query = vi.fn(async () =>
        createMockQueryResult([
          {
            id,
            identifier,
            token,
            expires: expires.toSQL()
          }
        ])
      )

      const pool = createMockPool({
        query
      })

      const { updateVerificationToken } = makeVerificationTokenFunctions(pool)

      const result = await updateVerificationToken({
        id,
        identifier,
        token,
        expires: expires
      })
    })

    it('getVerificationToken', async () => {
      const id = randomUUID()
      const identifier = randomUUID()
      const expires = DateTime.now()
      const token = 'foobarbaz'

      const query = vi.fn(async () =>
        createMockQueryResult([
          {
            id,
            identifier,
            token,
            expires: expires.toSQL()
          }
        ])
      )

      const pool = createMockPool({
        query
      })

      const { getVerificationToken } = makeVerificationTokenFunctions(pool)

      const testVerificationToken = {
        id,
        identifier,
        token,
        expires
      }

      const result = await getVerificationToken(testVerificationToken.id)

      expect(result).toMatchObject(testVerificationToken)
    })

    it('listVerificationTokens', async () => {
      const verifications = [
        {
          id: randomUUID(),
          identifier: randomUUID(),
          expires: DateTime.now(),
          token: 'foobarbaz'
        },
        {
          id: randomUUID(),
          identifier: randomUUID(),
          expires: DateTime.now(),
          token: 'foobarbaz'
        },
        {
          id: randomUUID(),
          identifier: randomUUID(),
          expires: DateTime.now(),
          token: 'foobarbaz'
        }
      ]

      const query = vi.fn(async () =>
        createMockQueryResult(
          verifications.map((s) => ({
            id: s.id,
            identifier: s.identifier,
            token: s.token,
            expires: s.expires.toSQL()
          }))
        )
      )

      const pool = createMockPool({
        query
      })

      const { listVerificationTokens } = makeVerificationTokenFunctions(pool)

      const result = await listVerificationTokens()

      expect(result).toEqual(verifications)
    })
  })
}