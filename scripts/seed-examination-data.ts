import prisma from '@/lib/prisma';

async function main() {
    console.log('🌱 Seeding examination data...');

    // Query existing students
    const students = await prisma.student.findMany({
        orderBy: { name: 'asc' },
    });

    console.log(`✅ Found ${students.length} existing students`);

    // Query the test and its questions
    const testId = '68b53e2ac4d1249d01aed00f';
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

    if (test.questions.length !== 19) {
        throw new Error(`Expected 19 questions for test ${testId}, found ${test.questions.length}`);
    }

    // Define correct answers from the provided answer sheet
    const correctAnswers = [
        { questionId: test.questions[0].questionId, answer: 'B' },
        { questionId: test.questions[1].questionId, answer: 'B' },
        { questionId: test.questions[2].questionId, answer: 'B' },
        { questionId: test.questions[3].questionId, answer: '25' },
        { questionId: test.questions[4].questionId, answer: '1' },
        { questionId: test.questions[5].questionId, answer: 'B' },
        { questionId: test.questions[6].questionId, answer: '1440 N' },
        { questionId: test.questions[7].questionId, answer: '(i) m₁/m₂ = 1/3 (ii) a = 3/4 m/s²' },
        { questionId: test.questions[8].questionId, answer: 'C' },
        { questionId: test.questions[9].questionId, answer: '8/3×10¹⁸ sec' },
        { questionId: test.questions[10].questionId, answer: 'A' },
        { questionId: test.questions[11].questionId, answer: 'D' },
        { questionId: test.questions[12].questionId, answer: 'ML⁵T⁻²K¹/₂' },
        { questionId: test.questions[13].questionId, answer: 'L⁻¹, ML²T⁻²' },
        { questionId: test.questions[14].questionId, answer: 'B,D' },
        { questionId: test.questions[15].questionId, answer: 'D' },
        { questionId: test.questions[16].questionId, answer: 'B' },
        { questionId: test.questions[17].questionId, answer: 'D' },
        { questionId: test.questions[18].questionId, answer: '1.7 × 10¹⁰ years' },
    ];

    // Define possible answer options for multiple-choice questions
    const multipleChoiceOptions = ['A', 'B', 'C', 'D'];

    // Generate student responses
    const responses = students.map((student) => {
        // Random score: 0 to 19 (number of correct answers)
        const correctCount = Math.floor(Math.random() * 20); // 0 to 19 correct answers
        
        // Calculate score based on individual question marks
        const marksPerQuestion = test.totalMarks / test.questions.length;
        const score = correctCount * marksPerQuestion;
        
        const totalMarks = test.totalMarks;
        const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
        const timeTaken = Math.floor(Math.random() * (120 - 60 + 1)) + 60; // Random time between 60 and 120 minutes

        // Select correct answers for `correctCount` questions
        const shuffledIndices = [...Array(19).keys()].sort(() => Math.random() - 0.5);
        const correctIndices = shuffledIndices.slice(0, correctCount); // Indices of correct answers

        // Generate answers
        const answers = correctAnswers.map((q, index) => {
            let selectedAnswer: string;
            if (correctIndices.includes(index)) {
                // Use correct answer
                selectedAnswer = q.answer;
            } else {
                // For multiple-choice questions (indices 0, 1, 2, 5, 8, 10, 11, 14, 15, 16, 17)
                if ([0, 1, 2, 5, 8, 10, 11, 14, 15, 16, 17].includes(index)) {
                    // Random incorrect answer from A, B, C, D (excluding correct answer)
                    const incorrectOptions = multipleChoiceOptions.filter(opt => opt !== q.answer && !q.answer.includes(opt));
                    selectedAnswer = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)] || 'A';
                } else if (index === 14) {
                    // For question 15 (B,D), choose a single incorrect option
                    const incorrectOptions = multipleChoiceOptions.filter(opt => !q.answer.includes(opt));
                    selectedAnswer = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)] || 'A';
                } else {
                    // For non-multiple-choice questions, use a placeholder incorrect answer
                    selectedAnswer = 'Incorrect';
                }
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
