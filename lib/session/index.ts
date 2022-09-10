import { randomUUID } from 'crypto'
import { DateTime } from 'luxon'
import { DatabasePool, sql } from 'slonik'
import { z } from 'zod'

export const sessionSchema = z
  .object({
    id: z.string(),
    session_token: z.string(),
    user_id: z.string(),
    expires: z.string()
  })
  .transform((s) => ({
    id: s.id,
    sessionToken: s.session_token,
    userId: s.user_id,
    expires: DateTime.fromSQL(s.expires)
  }))

export type Session = z.infer<typeof sessionSchema>

export const createSessionInputSchema = z.object({
  sessionToken: z.string(),
  userId: z.string(),
  expires: z.string()
})

export type CreateSessionInput = z.infer<typeof createSessionInputSchema>

export type UpdateSessionInput = z.infer<typeof sessionSchema>

export const makeSessionFunctions = (pool: DatabasePool) => ({
  async createSession({ userId, sessionToken, expires }: CreateSessionInput) {
    const result = pool.one(sql.type(sessionSchema)`
      INSERT INTO public.session (user_id, session_token, expires)
      VALUES (${userId}, ${sessionToken}, ${expires})
      RETURNING id, session_token, expires;
    `)

    return result
  },

  async updateSession(sessionInput: UpdateSessionInput) {
    const result = pool.one(sql.type(sessionSchema)`
      UPDATE public.session
      SET ${sql.join(
        Object.entries(sessionInput).map(([col, value]) => `${col} = ${value}`),
        sql.literalValue(', ')
      )}
      WHERE id = ${sessionInput.id}
      RETURNING id, email, name, email_verified;
    `)

    return result
  },

  async getSession(id: string) {
    const result = pool.one(sql.type(sessionSchema)`
        SELECT * FROM public.session WHERE id = ${id};
    `)

    return result
  },

  async getSessionByEmail(email: string) {
    const result = pool.one(sql.type(sessionSchema)`
        SELECT * FROM public.session WHERE email = ${email};
    `)

    return result
  },

  async listSessions() {
    const result = pool.many(sql.type(sessionSchema)`
        SELECT * FROM public.session;
    `)

    return result
  }
})

if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest

  describe('session functions', async () => {
    const { createMockPool, createMockQueryResult } = await import('slonik')

    it('createSession', async () => {
      const id = randomUUID()
      const userId = randomUUID()
      const expires = DateTime.now()
      const sessionToken = 'foobarbaz'

      const expectedResult: Session = {
        id,
        userId,
        sessionToken,
        expires
      }

      const query = vi.fn(async () =>
        createMockQueryResult([
          {
            id,
            user_id: userId,
            session_token: sessionToken,
            expires: expires.toSQL()
          }
        ])
      )

      const pool = createMockPool({
        query
      })

      const { createSession } = makeSessionFunctions(pool)

      const result = await createSession({
        userId,
        sessionToken,
        expires: expires.toSQL()
      })

      expect(result).toEqual(expectedResult)
    })

    it.todo('updateSession', async () => {
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

      const { updateSession } = makeSessionFunctions(pool)

      const testSession = {
        id,
        name: 'Jack Cline',
        email: 'jack.cline22@gmail.com',
        emailVerified
      }

      const result = await updateSession(testSession)

      expect(result).toMatchObject(testSession)
    })

    it.todo('getSession', async () => {
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

      const { getSession } = makeSessionFunctions(pool)

      const testSession = {
        id,
        name: 'Jack Cline',
        email: 'jack.cline22@gmail.com',
        emailVerified
      }

      const result = await getSession(testSession.id)

      expect(result).toMatchObject(testSession)
    })

    it.todo('listSessions', async () => {
      const emailVerified = DateTime.fromISO('2020-10-10').toSQL()

      const sessions = [
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

      const query = vi.fn(async () => createMockQueryResult(sessions))

      const pool = createMockPool({
        query
      })

      const { listSessions } = makeSessionFunctions(pool)

      const result = await listSessions()

      expect(result).toEqual(
        sessions.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          emailVerified: u.email_verified
        }))
      )
    })
  })
}
