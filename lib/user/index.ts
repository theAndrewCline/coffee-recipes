import { randomUUID } from 'crypto'
import { DateTime } from 'luxon'
import { DatabasePool, sql } from 'slonik'
import { z } from 'zod'

export const userSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    email_verified: z.string().optional()
  })
  .transform((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.email_verified
  }))

export type User = z.infer<typeof userSchema>

export const createUserInputSchema = z.object({
  name: z.string(),
  email: z.string(),
  emailVerified: z.string()
})

export type CreateUserInput = z.infer<typeof createUserInputSchema>

export type UpdateUserInput = z.infer<typeof userSchema>

export const makeUserFunctions = (pool: DatabasePool) => ({
  async createUser(userInput: CreateUserInput) {
    const result = pool.one(sql.type(userSchema)`
      INSERT INTO public.user (name, email, email_verified)
      VALUES (${userInput.name}, ${userInput.email}, ${userInput.emailVerified})
      RETURNING id, email, name, email_verified;
    `)

    return result
  },

  async updateUser(userInput: UpdateUserInput) {
    const result = pool.one(sql.type(userSchema)`
      UPDATE public.user
      SET ${sql.join(
        Object.entries(userInput).map(([col, value]) => `${col} = ${value}`),
        sql.literalValue(', ')
      )}
      WHERE id = ${userInput.id}
      RETURNING id, email, name, email_verified;
    `)

    return result
  },

  async getUser(id: string) {
    const result = pool.one(sql.type(userSchema)`
        SELECT * FROM public.user WHERE id = ${id};
    `)

    return result
  },

  async getUserByEmail(email: string) {
    const result = pool.one(sql.type(userSchema)`
        SELECT * FROM public.user WHERE email = ${email};
    `)

    return result
  },

  async listUsers() {
    const result = pool.many(sql.type(userSchema)`
        SELECT * FROM public.user;
    `)

    return result
  }
})

if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest

  describe('user functions', async () => {
    const { createMockPool, createMockQueryResult } = await import('slonik')

    it('createUser', async () => {
      const id = randomUUID()
      const emailVerified = DateTime.fromISO('2020-10-10').toSQL()

      const query = vi.fn(async () =>
        createMockQueryResult([
          {
            id,
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
      expect(result.id).toEqual(id)
    })

    it('updateUser', async () => {
      const id = randomUUID()
      const emailVerified = DateTime.fromISO('2020-10-10').toSQL()

      const query = vi.fn(async () =>
        createMockQueryResult([
          {
            id,
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
        id,
        name: 'Jack Cline',
        email: 'jack.cline22@gmail.com',
        emailVerified
      }

      const result = await updateUser(testUser)

      expect(result).toMatchObject(testUser)
    })

    it('getUser', async () => {
      const id = randomUUID()
      const emailVerified = DateTime.fromISO('2020-10-10').toSQL()

      const query = vi.fn(async () =>
        createMockQueryResult([
          {
            id,
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
        id,
        name: 'Jack Cline',
        email: 'jack.cline22@gmail.com',
        emailVerified
      }

      const result = await getUser(testUser.id)

      expect(result).toMatchObject(testUser)
    })

    it('getUserByEmail', async () => {
      const id = randomUUID()
      const emailVerified = DateTime.fromISO('2020-10-10').toSQL()

      const query = vi.fn(async () =>
        createMockQueryResult([
          {
            id,
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
        id,
        name: 'Jack Cline',
        email: 'jack.cline22@gmail.com',
        emailVerified
      }

      const result = await getUserByEmail(testUser.email)

      expect(result).toMatchObject(testUser)
    })

    it('listUsers', async () => {
      const emailVerified = DateTime.fromISO('2020-10-10').toSQL()

      const users = [
        {
          id: randomUUID(),
          name: 'Jack Cline',
          email: 'jack.cline22@gmail.com',
          email_verified: emailVerified
        },
        {
          id: randomUUID(),
          name: 'Andrew Cline',
          email: 'andrew.cline77@gmail.com',
          email_verified: emailVerified
        },
        {
          id: randomUUID(),
          name: 'Kristin Cline',
          email: 'kristin.cline91@gmail.com',
          email_verified: emailVerified
        }
      ]

      const query = vi.fn(async () => createMockQueryResult(users))

      const pool = createMockPool({
        query
      })

      const { listUsers } = makeUserFunctions(pool)

      const result = await listUsers()

      expect(result).toEqual(
        users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          emailVerified: u.email_verified
        }))
      )
    })
  })
}
