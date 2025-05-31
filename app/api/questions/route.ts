import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const subject = searchParams.get('subject');
        const exam = searchParams.get('exam');
        const type = searchParams.get('type');
        const difficulty = searchParams.get('difficulty');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const subject_name = searchParams.get('subject_name');
        const exam_name = searchParams.get('exam_name');
        const chapter = searchParams.get('chapter');
        const file_name = searchParams.get('file_name');

        const query: any = {};
        
        // Add filters if provided
        if (subject) query['subject'] = subject;
        if (exam) query['exam_name'] = exam;
        if (type) query['question_type'] = type;
        if (difficulty) query['difficulty'] = difficulty;
        
        // Add name-based filters
        if (subject_name) query['subject'] = subject_name;
        if (exam_name) query['exam_name'] = exam_name;
        if (chapter) query['chapter'] = chapter;
        if (file_name) query['file_name'] = file_name;
        
        // Add text search if provided
        if (search) {
            query.OR = [
                { question_text: { contains: search, mode: 'insensitive' } },
                { options: { has: search } }
            ];
        }
        
        // Calculate pagination
        const skip = (page - 1) * limit;
        
        // Get questions with pagination
        const [questions, total] = await Promise.all([
            prisma.question.findMany({
                where: query,
                skip,
                take: limit,
                orderBy: { question_number: 'asc' }
            }),
            prisma.question.count({ where: query })
        ]);
        
        return NextResponse.json({
            success: true,
            data: {
                questions,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching questions:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch questions' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        // Check if we're receiving an array of questions
        if (Array.isArray(body)) {
            const questions = [];
            const errors = [];

            // Process each question in the array
            for (const questionData of body) {
                try {
                    const {
                        question_number,
                        file_name,
                        question_text,
                        isQuestionImage,
                        question_image,
                        isOptionImage,
                        options,
                        option_images,
                        section_name,
                        question_type,
                        topic,
                        exam_name,
                        subject,
                        chapter,
                        answer
                    } = questionData;
                    
                    // Validate required fields
                    if (!question_text) {
                        errors.push(`Question ${question_number}: Question text is required`);
                        continue;
                    }
                    
                    const newQuestion = await prisma.question.create({
                        data: {
                            question_number,
                            file_name,
                            question_text,
                            isQuestionImage,
                            question_image,
                            isOptionImage,
                            options,
                            option_images,
                            section_name,
                            question_type,
                            topic,
                            exam_name,
                            subject,
                            chapter,
                            answer,
                            flagged: false
                        }
                    });
                    
                    questions.push(newQuestion);
                } catch (err) {
                    errors.push(`Error processing question ${questionData.question_number || 'unknown'}: ${err.message}`);
                }
            }
            
            return NextResponse.json({
                success: true,
                count: questions.length,
                questions,
                errors: errors.length > 0 ? errors : undefined
            }, { status: 201 });
        } else {
            // Single question creation
            const {
                question_number,
                file_name,
                question_text,
                isQuestionImage,
                question_image,
                isOptionImage,
                options,
                option_images,
                section_name,
                question_type,
                topic,
                exam_name,
                subject,
                chapter,
                answer
            } = body;
            
            // Validate required fields
            if (!question_text) {
                return NextResponse.json(
                    { success: false, error: 'Question text is required' },
                    { status: 400 }
                );
            }
            
            const question = await prisma.question.create({
                data: {
                    question_number,
                    file_name,
                    question_text,
                    isQuestionImage,
                    question_image,
                    isOptionImage,
                    options,
                    option_images,
                    section_name,
                    question_type,
                    topic,
                    exam_name,
                    subject,
                    chapter,
                    answer,
                    flagged: false
                }
            });
            
            return NextResponse.json({ success: true, data: question }, { status: 201 });
        }
    } catch (error) {
        console.error('Error creating question:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create question' },
            { status: 500 }
        );
    }
} 