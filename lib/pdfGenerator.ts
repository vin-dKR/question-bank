import { PdfMakeWrapper } from 'pdfmake-wrapper';

export const generatePDF = async (
    questions: Question[],
    options?: {
        watermarkImage?: string;
        includeAnswers?: boolean;
    }
): Promise<void> => {
    const pdf = new PdfMakeWrapper();

    // Set document metadata
    pdf.info({
        title: 'MCQ Question Paper',
        author: 'MCQ Generator',
    });

    // Add header
    {/*
    pdf.add(
        pdf.addText('MCQ Question Paper', {
            fontSize: 18,
            bold: true,
            alignment: 'center',
            margin: [0, 0, 0, 20]
        })
    );

   */}
    // Add questions
    questions.forEach((question, index) => {
        // eslint-disable-next-line
        const questionContent: any[] = [
            {
                text: `${index + 1}. ${question.question_text}`,
                bold: true,
                margin: [0, 0, 0, 5]
            }
        ];

        // Add options
        Object.entries(question.options).forEach(([key, value]) => {
            questionContent.push({
                text: `(${key}) ${value}`,
                margin: [15, 0, 0, 3]
            });
        });

        // Add answer if enabled
        if (options?.includeAnswers) {
            questionContent.push({
                text: `Correct Answer: ${question.answer}`,
                color: 'green',
                italics: true,
                margin: [0, 5, 0, 0]
            });
        }

        // Add metadata
        questionContent.push({
            text: `${question.exam_name} ${question.subject} • ${question.topic}`,
            fontSize: 8,
            color: '#666',
            margin: [0, 5, 0, 15]
        });

        pdf.add(questionContent);
    });

    // Add watermark if provided
    if (options?.watermarkImage) {
        pdf.watermark({
            text: '',
            //image: options.watermarkImage,
            opacity: 0.2
        });
    }

    // Generate and download PDF
    pdf.create().download('mcq-questions.pdf');
};

