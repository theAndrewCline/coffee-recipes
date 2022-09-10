import NextAuth from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import { PostgresAdapter } from '../../../db'
import { Pool } from 'pg'

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'default',
  password: 'postgres',
  port: 5432
})

export default NextAuth({
  adapter: PostgresAdapter(pool, {}) as any,

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
