// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../db'

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const response = await prisma.user.findMany()

    res.status(200).json(response)
  } catch (e: any) {
    res.status(500).json(e.message)
  }
}
