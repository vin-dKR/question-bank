"use server"
import prisma from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export const createTemplate = async (formData: Template): Promise<{
    data: Template | null
    error: string | null
}> => {
    console.log('this is formData from actions template pdfTemp', formData);

    const { userId } = await auth()
    console.log('Auth result - userId:', userId);

    if (!userId) {
        console.error('No userId found in auth');
        return { data: null, error: "Unauthorized" };
    }

    // Validate required fields
    if (!formData.templateName || !formData.templateName.trim()) {
        return { data: null, error: 'Template name is required' };
    }

    console.log('Creating template with data:', { ...formData, userId });

    try {
        const newTemplate = await prisma.templateForm.create({
            data: {
                userId,
                templateName: formData.templateName.trim(),
                institution: formData.institution || '',
                institutionAddress: formData.institutionAddress || '',
                marks: formData.marks || '',
                time: formData.time || '',
                exam: formData.exam || '',
                subject: formData.subject || '',
                logo: formData.logo || '',
                saveTemplate: formData.saveTemplate || false
            }
        })

        console.log('Template created successfully:', newTemplate);

        return {
            data: newTemplate as Template,
            error: null
        }
    } catch (e) {
        console.error('Error creating template:', e)
        console.error('Error details:', {
            name: e instanceof Error ? e.name : 'Unknown',
            message: e instanceof Error ? e.message : 'Unknown error',
            stack: e instanceof Error ? e.stack : 'No stack trace'
        });
        return { data: null, error: `Error in creating Template Form: ${e instanceof Error ? e.message : 'Unknown error'}` }
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
        // Optimized query with minimal logging and efficient field selection
        const templates = await prisma.templateForm.findMany({
            where: { userId },
            select: {
                id: true,
                templateName: true,
                institutionAddress: true,
                institution: true,
                marks: true,
                time: true,
                exam: true,
                subject: true,
                logo: true,
                saveTemplate: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        })

        return {
            data: templates as Template[],
            error: null
        }
    } catch (e) {
        console.error('Error fetching templates:', e)
        return {
            data: null,
            error: "Error in getting templates from DB"
        }
    }
}

export const deleteTemplate = async (templateId: string): Promise<{
    success: boolean
    error: string | null
}> => {
    const { userId } = await auth()

    if (!userId) {
        return {
            success: false,
            error: "Unauthorized"
        }
    }

    try {
        // Delete the template and verify it belonged to the user in one operation
        const deletedTemplate = await prisma.templateForm.deleteMany({
            where: {
                id: templateId,
                userId
            }
        })

        if (deletedTemplate.count === 0) {
            return {
                success: false,
                error: "Template not found or access denied"
            }
        }

        return {
            success: true,
            error: null
        }
    } catch (e) {
        console.error("Error deleting template:", e)
        return {
            success: false,
            error: "Error deleting template from database"
        }
    }
}

