import { PrismaClient } from "@/generated/prisma"

const globalForPrisma = global as unknown as {
    prisma: PrismaClient
    prismaWarmedUp?: boolean
}

const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Phase 2: warm-up — see REFACTOR_PLAN A4.
// Fire-and-forget a cheap ping so the TCP + TLS handshake to MongoDB Atlas
// happens at module-load time rather than on the first real query. On a cold
// serverless container this shaves 2–5 s off the first request. The .catch is
// critical: if Atlas is unreachable at boot we must not crash the process —
// the next real query will surface the error through the normal error path.
if (!globalForPrisma.prismaWarmedUp) {
    globalForPrisma.prismaWarmedUp = true
    prisma.$runCommandRaw({ ping: 1 }).catch(() => { })
}

export default prisma
