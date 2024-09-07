import { Game } from '@gathertown/gather-game-client'
import { PrismaClient } from '@prisma/client'

global.WebSocket = require('isomorphic-ws')
const prisma = new PrismaClient()

// create the game object, giving it your spaceId and API key of your choice in this weird way
const game = new Game('rmymeQAm0uda2NEj\\cuong', () =>
  Promise.resolve({ apiKey: '9GqqlnxXTFztc7qZ' })
)
// this is the line that actually connects to the server and starts initializing stuff
game.connect()
// optional but helpful callback to track when the connection status changes
game.subscribeToConnection((connected) => console.log('connected?', connected))

game.subscribeToEvent('playerJoins', async (data, context) => {
  console.log('player joined', context.playerId)

  if (context.playerId) {
    await prisma.inOut.create({
      data: {
        user: {
          connectOrCreate: {
            where: {
              id: context.playerId,
            },
            create: {
              id: context.playerId,
            },
          },
        },
        isIn: true,
        createAt: new Date(),
      },
    })
  }
})

game.subscribeToEvent('playerExits', async (data, context) => {
  console.log('player Exits', context.playerId)

  if (context.playerId) {
    await prisma.inOut.create({
      data: {
        user: {
          connectOrCreate: {
            where: {
              id: context.playerId,
            },
            create: {
              id: context.playerId,
            },
          },
        },
        isIn: false,
        createAt: new Date(),
      },
    })
  }
})

setInterval(async () => {
  const notNameUsers = await prisma.user.findMany({
    where: {
      name: null,
    },
  })

  if (notNameUsers.length !== 0) {
    for (let i = 0; i < notNameUsers.length; i++) {
      const notNameUser = notNameUsers[i]

      if (game.getPlayer(notNameUser.id)?.name) {
        await prisma.user.update({
          where: {
            id: notNameUser.id,
          },
          data: {
            name: game.getPlayer(notNameUser.id)?.name,
          },
        })
      }
    }
  }
}, 60000)
