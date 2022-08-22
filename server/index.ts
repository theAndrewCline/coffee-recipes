import * as trpc from '@trpc/server'
import { z } from 'zod'
import { prisma } from '../db'

export const appRouter = trpc.router().query('hello', {
  input: z
    .object({
      email: z.string().email()
    })
    .nullish(),
  async resolve({ input }) {
    const user = await prisma.user.findUnique({
      where: {
        email: input?.email
      }
    })

    return {
      greeting: `hello ${user?.id}`
    }
  }
})

export type AppRouter = typeof appRouter
