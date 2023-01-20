import NextAuth from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import { PostgresAdapter } from '../../../db'
import { createPool } from 'slonik'

export default NextAuth({
  adapter: PostgresAdapter(createPool(process.env.DATABASE_URL as string)),

  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD
        }
      },
      from: process.env.EMAIL_FROM
    })
  ]
})
