"use server"
import prisma from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"


export const createTemplate = async (formData: Template): Promise<{
    data: Template | null
    error: string | null
}> => {
    console.log('Starting createTemplate function');
    
    const { userId } = await auth()
    console.log('Auth result - userId:', userId);

    if (!userId) {
        console.error('No userId found in auth');
        throw new Error("Unauthorized");
    }

    // Validate required fields
    if (!formData.templateName || !formData.templateName.trim()) {
        return { data: null, error: 'Template name is required' };
    }

    console.log('Creating template with data:', { ...formData, userId });

    // Test database connection
    try {
        await prisma.$connect();
        console.log('Database connection successful');
    } catch (connectionError) {
        console.error('Database connection failed:', connectionError);
        return { data: null, error: 'Database connection failed' };
    }

    try {
        const newTemplate = await prisma.templateForm.create({
            data: {
                userId,
                templateName: formData.templateName.trim(),
                institution: formData.institution || '',
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
    } finally {
        await prisma.$disconnect();
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

    console.log('Fetching templates for userId:', userId);

    try {
        const templates = await prisma.templateForm.findMany({
            where: { userId }
        })

        console.log("Templates found:", templates.length, templates)
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
        // First verify the template belongs to the user
        const template = await prisma.templateForm.findFirst({
            where: { 
                id: templateId,
                userId 
            }
        })

        if (!template) {
            return {
                success: false,
                error: "Template not found or access denied"
            }
        }

        // Delete the template
        await prisma.templateForm.delete({
            where: { id: templateId }
        })

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

