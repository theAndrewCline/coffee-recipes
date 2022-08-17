import { prisma } from '../db'
import Chance from 'chance'

const seed = async () => {
  const users = Array.from({ length: 10 }).map(() => {
    const chance = new Chance()

    return {
      first_name: chance.first(),
      last_name: chance.last()
    }
  })

  try {
    await prisma.user.createMany({
      data: users
    })
  } catch (e) {
    console.error(e)
  }
}

seed()
