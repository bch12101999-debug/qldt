import 'dotenv/config'
import { ensureAdmin } from '../src/lib/ensureAdmin'
import { prisma } from '../src/lib/prisma'

ensureAdmin()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
