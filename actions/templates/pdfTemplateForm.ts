"use server"
import prisma from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { ObjectId } from "mongodb";


export const createTemplate = async (formData: Template): Promise<{
    data: Template | null
    error: string | null
}> => {
    const { userId } = await auth()

    if (!userId) {
        throw new Error("Unauthorized");
    }

    const id = formData.id ?? new ObjectId().toString();

    try {
        const newTemplate = await prisma.templateForm.upsert({
            where: { id },
            update: {
                userId,
                templateName: formData.templateName,
                institution: formData.institution,
                marks: formData.marks,
                time: formData.time,
                exam: formData.exam,
                subject: formData.subject,
                logo: formData.logo,
                saveTemplate: formData.saveTemplate || false
            },
            create: {
                userId,
                templateName: formData.templateName,
                institution: formData.institution,
                marks: formData.marks,
                time: formData.time,
                exam: formData.exam,
                subject: formData.subject,
                logo: formData.logo,
                saveTemplate: formData.saveTemplate || false
            }

        })

        return {
            data: newTemplate as Template,
            error: null
        }
    } catch (e) {
        console.log(e)
        return { data: null, error: "Error in creating Template Form" }
    }
}

export const getUserTemplates = async (): Promise<{
    data: Template[] | null
    error: string | null
}> => {
    const { userId } = await auth()

    if (!userId) {
        return {
            data: null,
            error: "Unauthorized"
        }
    }

    try {
        const templates = await prisma.templateForm.findMany()

        console.log("-------------------------------", templates)
        return {
            data: templates as Template[],
            error: null
        }
    } catch (e) {
        console.error(e)
        return {
            data: null,
            error: "Error in getting templates from DB"
        }
    }
}

