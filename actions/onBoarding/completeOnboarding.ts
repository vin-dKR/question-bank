'use server'

import prisma from '@/lib/prisma';
import { auth, clerkClient } from '@clerk/nextjs/server';

export const completeOnboarding = async (formData: FormData) => {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
        throw new Error("Unauthorized");
    }

    const client = await clerkClient()

    const rawRole = formData.get("role");
    const role = typeof rawRole === "string" ? rawRole : null;

    if (!role) {
        return { error: "Role is missing or invalid." };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
        });

        if (!user) {
            throw new Error("User not found in database");
        }

        // Update user role
        await prisma.user.update({
            where: { clerkUserId },
            data: { role: role }
        });

        // Save role-specific data
        if (role === 'teacher') {
            await prisma.teacherData.upsert({
                where: { userId: user.id },
                update: {
                    name: formData.get('name') as string,
                    email: formData.get('email') as string,
                    school: formData.get('school') as string,
                    subject: formData.get('subject') as string,
                    experience: formData.get('experience') as string || null,
                    studentCount: formData.get('studentCount') as string || null,
                },
                create: {
                    userId: user.id,
                    name: formData.get('name') as string,
                    email: formData.get('email') as string,
                    school: formData.get('school') as string,
                    subject: formData.get('subject') as string,
                    experience: formData.get('experience') as string || null,
                    studentCount: formData.get('studentCount') as string || null,
                }
            });
        } else if (role === 'student') {
            // Handle subjects - can be JSON string or comma-separated
            const subjectsRaw = formData.get('subjects') as string;
            let subjects: string[] = [];
            if (subjectsRaw) {
                try {
                    // Try parsing as JSON first
                    const parsed = JSON.parse(subjectsRaw);
                    subjects = Array.isArray(parsed) ? parsed : [parsed];
                } catch {
                    // If not JSON, try splitting by comma
                    subjects = subjectsRaw.split(',').filter(s => s.trim());
                }
            }

            await prisma.studentData.upsert({
                where: { userId: user.id },
                update: {
                    name: formData.get('name') as string,
                    email: formData.get('email') as string,
                    grade: formData.get('grade') as string,
                    targetExam: formData.get('targetExam') as string,
                    subjects: subjects,
                },
                create: {
                    userId: user.id,
                    name: formData.get('name') as string,
                    email: formData.get('email') as string,
                    grade: formData.get('grade') as string,
                    targetExam: formData.get('targetExam') as string,
                    subjects: subjects,
                }
            });
        } else if (role === 'coaching') {
            // Handle targetExams - can be JSON string or comma-separated
            const targetExamsRaw = formData.get('targetExams') as string;
            let targetExams: string[] = [];
            if (targetExamsRaw) {
                try {
                    // Try parsing as JSON first
                    const parsed = JSON.parse(targetExamsRaw);
                    targetExams = Array.isArray(parsed) ? parsed : [parsed];
                } catch {
                    // If not JSON, try splitting by comma
                    targetExams = targetExamsRaw.split(',').filter(e => e.trim());
                }
            }

            await prisma.coachingData.upsert({
                where: { userId: user.id },
                update: {
                    centerName: formData.get('centerName') as string,
                    contactPerson: formData.get('contactPerson') as string,
                    email: formData.get('email') as string,
                    phone: formData.get('phone') as string,
                    location: formData.get('location') as string,
                    teacherCount: formData.get('teacherCount') as string || null,
                    studentCount: formData.get('studentCount') as string || null,
                    targetExams: targetExams,
                },
                create: {
                    userId: user.id,
                    centerName: formData.get('centerName') as string,
                    contactPerson: formData.get('contactPerson') as string,
                    email: formData.get('email') as string,
                    phone: formData.get('phone') as string,
                    location: formData.get('location') as string,
                    teacherCount: formData.get('teacherCount') as string || null,
                    studentCount: formData.get('studentCount') as string || null,
                    targetExams: targetExams,
                }
            });
        }

        // Build metadata object - only include fields that exist
        const publicMetadata: Record<string, unknown> = {
            onboardingComplete: true,
        };

        // Add optional fields only if they exist
        const applicationName = formData.get('applicationName');
        const applicationType = formData.get('applicationType');
        
        if (applicationName && typeof applicationName === 'string') {
            publicMetadata.applicationName = applicationName;
        }
        if (applicationType && typeof applicationType === 'string') {
            publicMetadata.applicationType = applicationType;
        }

        // Update user metadata in Clerk
        const res = await client.users.updateUser(clerkUserId, {
            publicMetadata,
        });
        
        console.log("User metadata updated successfully:", res.publicMetadata);
        return { message: 'Onboarding completed successfully', metadata: res.publicMetadata };
    } catch (err) {
        console.error("CompleteOnboarding error:", err);
        
        // Handle Prisma database connection errors by checking error name/type
        if (err && typeof err === 'object') {
            const errorObj = err as { 
                name?: string; 
                message?: string; 
                errorCode?: string;
                clientVersion?: string;
                code?: string;
                meta?: unknown;
            };
            
            const errorName = errorObj.name || '';
            const errorMessage = errorObj.message || '';
            
            // Check for Prisma initialization errors (connection issues)
            if (errorName === 'PrismaClientInitializationError' || 
                errorName.includes('PrismaClientInitialization') ||
                errorMessage.includes('Error creating a database connection') ||
                errorMessage.includes('DNS resolution')) {
                
                console.error("Prisma initialization error:", {
                    message: errorMessage,
                    errorCode: errorObj.errorCode,
                    clientVersion: errorObj.clientVersion,
                });
                
                // Check for specific connection issues
                if (errorMessage.includes('DNS resolution') || 
                    errorMessage.includes('connection') ||
                    errorMessage.includes('no record found')) {
                    return { 
                        error: 'Unable to connect to the database. Please check your network connection and try again. If the problem persists, contact support.' 
                    };
                }
                
                return { 
                    error: 'Database connection error. Please try again in a moment. If the problem persists, contact support.' 
                };
            }
            
            // Check for Prisma known request errors
            if (errorName === 'PrismaClientKnownRequestError' || 
                errorName.includes('PrismaClientKnownRequest')) {
                
                console.error("Prisma request error:", {
                    message: errorMessage,
                    code: errorObj.code,
                    meta: errorObj.meta,
                });
                
                return { 
                    error: 'Database operation failed. Please try again. If the problem persists, contact support.' 
                };
            }
            
            // Handle other Prisma errors
            if (errorName.includes('Prisma') || errorName.includes('prisma')) {
                console.error("Prisma error:", {
                    name: errorName,
                    message: errorMessage,
                });
                return { 
                    error: 'Database error occurred. Please try again. If the problem persists, contact support.' 
                };
            }
        }
        
        // Provide more detailed error information for other errors
        let errorMessage = 'There was an error completing your onboarding.';
        if (err instanceof Error) {
            errorMessage = err.message || errorMessage;
            console.error("Error details:", {
                message: err.message,
                stack: err.stack,
                name: err.name,
            });
        } else if (typeof err === 'object' && err !== null) {
            const errorObj = err as { message?: string; errors?: Array<{ message?: string }> };
            if (errorObj.message) {
                errorMessage = errorObj.message;
            } else if (errorObj.errors && errorObj.errors.length > 0) {
                errorMessage = errorObj.errors[0].message || errorMessage;
            }
        }
        
        return { error: errorMessage };
    }
}
