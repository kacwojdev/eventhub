// server/prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcrypt'
import path from 'path'

const adapter = new PrismaBetterSqlite3({ url: path.join(__dirname, 'dev.db') })
const prisma = new PrismaClient({ adapter })

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10)
  await prisma.admin.upsert({
    where: { email: 'admin@eventhub.pl' },
    update: {},
    create: { email: 'admin@eventhub.pl', passwordHash },
  })

  // Sample events
  const events = [
    {
      title: 'Warsztaty React',
      description: 'Praktyczne warsztaty z React i TypeScript dla początkujących.',
      location: 'Sala 101, Wydział Informatyki',
      date: new Date('2026-07-15T10:00:00'),
      capacity: 30,
    },
    {
      title: 'Hackathon Letni',
      description: '24-godzinny hackathon dla studentów. Wygraj nagrody!',
      location: 'Aula Główna',
      date: new Date('2026-08-01T09:00:00'),
      capacity: 50,
    },
    {
      title: 'Seminarium AI',
      description: 'Wykład o zastosowaniach sztucznej inteligencji w biznesie.',
      location: 'Online (link po rejestracji)',
      date: new Date('2026-07-20T18:00:00'),
      capacity: 100,
    },
  ]

  // Only seed events if none exist
  if ((await prisma.event.count()) === 0) {
    for (const event of events) {
      await prisma.event.create({ data: event })
    }
  }

  console.log('Seed complete. Admin: admin@eventhub.pl / admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
