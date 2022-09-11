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
      RETURNING id, user_id, session_token, expires;
    `)

    return result
  },

  async getSession(id: string) {
    const result = pool.one(sql.type(sessionSchema)`
        SELECT * FROM public.session WHERE id = ${id};
    `)

    return result
  },

  async getSessionByToken(token: string) {
    const result = pool.one(sql.type(sessionSchema)`
        SELECT * FROM public.session WHERE session_token = ${token};
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

    it('updateSession', async () => {
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

      const { updateSession } = makeSessionFunctions(pool)

      const result = await updateSession({
        id,
        userId,
        sessionToken,
        expires: expires
      })
    })

    it('getSession', async () => {
      const id = randomUUID()
      const userId = randomUUID()
      const expires = DateTime.now()
      const sessionToken = 'foobarbaz'

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

      const { getSession } = makeSessionFunctions(pool)

      const testSession = {
        id,
        userId,
        sessionToken,
        expires
      }

      const result = await getSession(testSession.id)

      expect(result).toMatchObject(testSession)
    })

    it('getSessionByToken', async () => {
      const id = randomUUID()
      const userId = randomUUID()
      const expires = DateTime.now()
      const sessionToken = 'foobarbaz'

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

      const { getSessionByToken } = makeSessionFunctions(pool)

      const testSession = {
        id,
        userId,
        sessionToken,
        expires
      }

      const result = await getSessionByToken(testSession.sessionToken)

      expect(result).toMatchObject(testSession)
    })

    it('getSessionAndUser', async () => {
      const id = randomUUID()
      const userId = randomUUID()
      const expires = DateTime.now()
      const sessionToken = 'foobarbaz'

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

      const { getSession } = makeSessionFunctions(pool)

      const testSession = {
        id,
        userId,
        sessionToken,
        expires
      }

      const result = await getSession(testSession.id)

      expect(result).toMatchObject(testSession)
    })

    it('listSessions', async () => {
      const sessions = [
        {
          id: randomUUID(),
          userId: randomUUID(),
          expires: DateTime.now(),
          sessionToken: 'foobarbaz'
        },
        {
          id: randomUUID(),
          userId: randomUUID(),
          expires: DateTime.now(),
          sessionToken: 'foobarbaz'
        },
        {
          id: randomUUID(),
          userId: randomUUID(),
          expires: DateTime.now(),
          sessionToken: 'foobarbaz'
        }
      ]

      const query = vi.fn(async () =>
        createMockQueryResult(
          sessions.map((s) => ({
            id: s.id,
            user_id: s.userId,
            expires: s.expires.toSQL(),
            session_token: s.sessionToken
          }))
        )
      )

      const pool = createMockPool({
        query
      })

      const { listSessions } = makeSessionFunctions(pool)

      const result = await listSessions()

      expect(result).toEqual(sessions)
    })
  })
}
