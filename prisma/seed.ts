import { prisma } from '../db'
import Chance from 'chance'

const createStep = () => {
  const chance = new Chance()
  return {
    title: chance.name(),
    description: chance.name()
  }
}

const createRecipe = () => {
  const chance = new Chance()
  return {
    title: chance.name(),
    steps: {
      create: Array.from({ length: 3 }).map(createStep)
    }
  }
}

const seed = async () => {
  const users = Array.from({ length: 10 }).map(() => {
    const chance = new Chance()

    return {
      first_name: chance.first(),
      last_name: chance.last(),
      recipies: {
        create: Array.from({ length: 3 }).map(createRecipe)
      }
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
