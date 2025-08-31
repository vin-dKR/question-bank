import prisma from '@/lib/prisma';


async function main() {
    console.log('🌱 Seeding examination data...');

    // Create sample students
    const students = await Promise.all([
        prisma.student.create({
            data: {
                name: 'Alice Johnson',
                rollNumber: 'STU001',
                className: 'Class 10A',
                email: 'alice.johnson@school.com',
            },
        }),
        prisma.student.create({
            data: {
                name: 'Bob Smith',
                rollNumber: 'STU002',
                className: 'Class 10A',
                email: 'bob.smith@school.com',
            },
        }),
        prisma.student.create({
            data: {
                name: 'Carol Davis',
                rollNumber: 'STU003',
                className: 'Class 10B',
                email: 'carol.davis@school.com',
            },
        }),
        prisma.student.create({
            data: {
                name: 'David Wilson',
                rollNumber: 'STU004',
                className: 'Class 10A',
                email: 'david.wilson@school.com',
            },
        }),
        prisma.student.create({
            data: {
                name: 'Eva Brown',
                rollNumber: 'STU005',
                className: 'Class 10B',
                email: 'eva.brown@school.com',
            },
        }),
    ]);

    console.log(`✅ Created ${students.length} students`);

    // Query the existing test and its questions
    const testId = '68b4218f4e8c6aa32fc34828';
    const test = await prisma.test.findUnique({
        where: { id: testId },
        include: {
            questions: {
                include: {
                    question: {
                        select: {
                            id: true,
                            answer: true,
                        },
                    },
                },
                orderBy: { questionNumber: 'asc' },
            },
        },
    });

    if (!test) {
        throw new Error(`Test with ID ${testId} not found`);
    }

    if (test.questions.length !== 2) {
        throw new Error(`Expected 2 questions for test ${testId}, found ${test.questions.length}`);
    }

    // Define correct answers from test data
    const correctAnswers = [
        { questionId: test.questions[0].questionId, answer: 'B,D' }, // Q1
        { questionId: test.questions[1].questionId, answer: 'D' },   // Q2
    ];

    // Create sample student responses with random marks
    const responses = students.map((student) => {
        // Random score: 0, 1, or 2 (0 = both wrong, 1 = one correct, 2 = both correct)
        const score = Math.floor(Math.random() * 3); // Random integer between 0 and 2
        const percentage = (score / test.totalMarks) * 100;
        const timeTaken = Math.floor(Math.random() * (120 - 60 + 1)) + 60; // Random time between 60 and 120 minutes

        // Generate answers based on score
        let answers;
        if (score === 2) {
            // Both correct
            answers = correctAnswers.map((q) => ({
                questionId: q.questionId,
                selectedAnswer: q.answer,
            }));
        } else if (score === 1) {
            // One correct, one wrong
            const correctIndex = Math.floor(Math.random() * 2); // Randomly choose which question is correct
            answers = correctAnswers.map((q, i) => ({
                questionId: q.questionId,
                selectedAnswer: i === correctIndex ? q.answer : 'A', // 'A' as a wrong answer
            }));
        } else {
            // Both wrong
            answers = correctAnswers.map((q) => ({
                questionId: q.questionId,
                selectedAnswer: 'A', // Wrong answer
            }));
        }

        return {
            studentId: student.id,
            answers,
            score,
            percentage,
            timeTaken,
        };
    });

    // Create student responses
    for (const response of responses) {
        await prisma.studentResponse.create({
            data: {
                testId: test.id,
                studentId: response.studentId,
                answers: response.answers,
                score: response.score,
                totalMarks: test.totalMarks, // 2
                percentage: response.percentage,
                timeTaken: response.timeTaken,
            },
        });
    }

    console.log(`✅ Created ${responses.length} student responses`);
    console.log('🎉 Examination data seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding data:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
