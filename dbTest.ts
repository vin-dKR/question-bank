"use server"
import prisma from "@/lib/prisma"
async function main() {
    await prisma.folderQuestion.create({
        data: {
            folderId: "68242d8657f25f89f4280fab",
            questionId: "6818563bb862a742d0d9c293"
        }
    })
}


main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
