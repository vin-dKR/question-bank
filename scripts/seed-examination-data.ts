import prisma from '@/lib/prisma';

async function main() {
    console.log('🌱 Seeding examination data...');

    // Query existing students
    const students = await prisma.student.findMany({
        orderBy: { name: 'asc' },
    });

    console.log(`✅ Found ${students.length} existing students`);

    // Query the test and its questions
    const testId = '68b80aba285073df0c41dd1c';
    const test = await prisma.test.findUnique({
        where: { id: testId },
        include: {
            questions: {
                include: {
                    question: {
                        select: {
                            id: true,
                            answer: true,
                            options: true,
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

    const numQuestions = test.questions.length;
    if (numQuestions === 0) {
        throw new Error(`Test ${testId} has no questions`);
    }

    // Define correct answers based on the provided answer sheet
    const correctAnswers = test.questions.map((tq) => ({
        questionId: tq.questionId,
        answer: tq.question.answer ?? 'A',
        options: Array.isArray(tq.question.options) && tq.question.options.length > 0 ? tq.question.options : ['A', 'B', 'C', 'D'],
        marks: tq.marks,
    }));

    // Define possible answer options for multiple-choice questions
    const defaultOptions = ['A', 'B', 'C', 'D'];

    // Generate student responses
    const responses = students.map((student) => {
        // Random number of correct answers between 0 and numQuestions
        const correctCount = Math.floor(Math.random() * (numQuestions + 1));

        // Choose which questions are answered correctly
        const shuffledIndices = [...Array(numQuestions).keys()].sort(() => Math.random() - 0.5);
        const correctIndices = new Set(shuffledIndices.slice(0, correctCount));

        // Compute score as sum of marks for correctly answered questions
        const score = test.questions.reduce((sum, tq, idx) => sum + (correctIndices.has(idx) ? tq.marks : 0), 0);
        const totalMarks = test.totalMarks;
        const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
        const timeTaken = Math.floor(Math.random() * (120 - 60 + 1)) + 60; // Random time between 60 and 120 minutes

        // Generate answers
        const answers = correctAnswers.map((q, index) => {
            let selectedAnswer: string;
            if (correctIndices.has(index)) {
                // Use correct answer
                selectedAnswer = q.answer;
            } else {
                // Random incorrect answer from options (fallback to defaults), excluding correct answer
                const pool = (q.options && q.options.length ? q.options : defaultOptions).filter(opt => opt !== q.answer);
                selectedAnswer = pool[Math.floor(Math.random() * pool.length)] || (pool[0] || 'A');
            }

            return {
                questionId: q.questionId,
                selectedAnswer,
            };
        });

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
                score: response.score,
                totalMarks: test.totalMarks,
                percentage: response.percentage,
                timeTaken: response.timeTaken,
                answers: {
                    create: response.answers.map(answer => ({
                        questionId: answer.questionId,
                        selectedAnswer: answer.selectedAnswer,
                    })),
                },
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