import { DateTime } from 'luxon'
import { DatabasePool, sql } from 'slonik'
import { z } from 'zod'

export const userSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    email_verified: z.string()
  })
  .transform((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.email_verified
  }))

type User = z.infer<typeof userSchema>

export const createUserInputSchema = z.object({
  name: z.string(),
  email: z.string(),
  emailVerified: z.string()
})

type CreateUserInput = z.infer<typeof createUserInputSchema>

type UpdateUserInput = z.infer<typeof userSchema>

export const makeUserFunctions = (pool: DatabasePool) => ({
  async createUser(userInput: CreateUserInput) {
    const result = pool.one(sql.type(userSchema)`
      INSERT INTO user (name, email, email_verified)
      VALUES (${userInput.name}, ${userInput.email}, ${userInput.emailVerified})
      RETURNING id, email, name, email_verified
    `)

    return result
  },

  async updateUser(userInput: UpdateUserInput) {
    const result = pool.one(sql.type(userSchema)`
      UPDATE user
      SET ${sql.join(
        Object.entries(userInput).map(([col, value]) => `${col} = ${value}`),
        sql.literalValue(', ')
      )}
      WHERE id = ${userInput.id}
      RETURNING id, email, name, email_verified
    `)

    return result
  },

  async getUser(id: number) {
    const result = pool.one(sql.type(userSchema)`
        SELECT * FROM user WHERE id = ${id}
    `)

    return result
  },

  async getUserByEmail(email: string) {
    const result = pool.one(sql.type(userSchema)`
        SELECT * FROM user WHERE email = ${email}
    `)

    return result
  }
})

if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest

  describe('user functions', async () => {
    const { createMockPool, createMockQueryResult } = await import('slonik')

    it('createUser', async () => {
      const emailVerified = DateTime.fromISO('2020-10-10').toSQL()

      const query = vi.fn(async () =>
        createMockQueryResult([
          {
            id: 24,
            name: 'Andrew Cline',
            email: 'andrew.cline77@gmail.com',
            email_verified: emailVerified
          }
        ])
      )

      const pool = createMockPool({
        query
      })

      const { createUser } = makeUserFunctions(pool)

      const testUser = {
        name: 'Andrew Cline',
        email: 'andrew.cline77@gmail.com',
        emailVerified
      }

      const result = await createUser(testUser)

      expect(result).toMatchObject(testUser)
      expect(result.id).toEqual(24)
    })

    it('updateUser', async () => {
      const emailVerified = DateTime.fromISO('2020-10-10').toSQL()

      const query = vi.fn(async () =>
        createMockQueryResult([
          {
            id: 24,
            name: 'Jack Cline',
            email: 'jack.cline22@gmail.com',
            email_verified: emailVerified
          }
        ])
      )

      const pool = createMockPool({
        query
      })

      const { updateUser } = makeUserFunctions(pool)

      const testUser = {
        id: 24,
        name: 'Jack Cline',
        email: 'jack.cline22@gmail.com',
        emailVerified
      }

      const result = await updateUser(testUser)

      expect(result).toMatchObject(testUser)
    })

    it('getUser', async () => {
      const emailVerified = DateTime.fromISO('2020-10-10').toSQL()

      const query = vi.fn(async () =>
        createMockQueryResult([
          {
            id: 24,
            name: 'Jack Cline',
            email: 'jack.cline22@gmail.com',
            email_verified: emailVerified
          }
        ])
      )

      const pool = createMockPool({
        query
      })

      const { getUser } = makeUserFunctions(pool)

      const testUser = {
        id: 24,
        name: 'Jack Cline',
        email: 'jack.cline22@gmail.com',
        emailVerified
      }

      const result = await getUser(testUser.id)

      expect(result).toMatchObject(testUser)
    })

    it('getUserByEmail', async () => {
      const emailVerified = DateTime.fromISO('2020-10-10').toSQL()

      const query = vi.fn(async () =>
        createMockQueryResult([
          {
            id: 24,
            name: 'Jack Cline',
            email: 'jack.cline22@gmail.com',
            email_verified: emailVerified
          }
        ])
      )

      const pool = createMockPool({
        query
      })

      const { getUserByEmail } = makeUserFunctions(pool)

      const testUser = {
        id: 24,
        name: 'Jack Cline',
        email: 'jack.cline22@gmail.com',
        emailVerified
      }

      const result = await getUserByEmail(testUser.email)

      expect(result).toMatchObject(testUser)
    })
  })
}
