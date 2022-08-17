import { prisma } from '../db'
import Chance from 'chance'

const createStep = () => {
  const chance = new Chance()
  return {
    title: chance.name()
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

const createUsers = Array.from({ length: 10 }).map(async () => {
  const chance = new Chance()

  return prisma.user.create({
    data: {
      first_name: chance.first(),
      last_name: chance.last(),
      recipies: {
        create: Array.from({ length: 3 }).map(createRecipe)
      }
    },
    include: {
      recipies: {
        include: {
          steps: true
        }
      }
    }
  })
})

const seed = async () => {
  try {
    await Promise.all(createUsers)
  } catch (e) {
    console.error(e)
  }
}

seed()
