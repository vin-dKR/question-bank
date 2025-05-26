import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Register fonts
pdfMake.vfs = pdfFonts;


export async function generatePDF(config: PDFConfig): Promise<Blob> {
    const { selectedQuestions, options } = config;
    const { includeAnswers, watermarkOpacity, logo } = options;


    // Convert logo File to base64 if provided
    let logoBase64: string | undefined;
    if (logo) {
        logoBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(logo);
        });
    }

    // eslint-disable-next-line
    const documentDefinition: any = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        watermark: logoBase64
            ? {
                image: logoBase64,
                opacity: watermarkOpacity,
                fit: [200, 200],
            }
            : undefined,
        header: logoBase64
            ? {
                image: logoBase64,
                width: 100,
                alignment: 'left',
                margin: [20, 20, 0, 0],
            }
            : undefined,
        content: [
            {
                text: config.institution,
                style: 'header',
                alignment: 'center',
                margin: [0, 0, 0, 20],
            },
            ...selectedQuestions.map((question, index) => {
                // eslint-disable-next-line
                const questionContent: any = [
                    {
                        text: `${index + 1}. ${question.question_text}`,
                        style: 'question',
                        margin: [0, 10, 0, 5],
                    },
                    {
                        ul: Object.entries(question.options).map(([key, value]) => ({
                            text: `${key}. ${value}`,
                            style: 'option',
                            margin: [10, 2, 0, 2],
                        })),
                    },
                    {
                        text: `Source: (${question.exam_name}, ${question.subject})`,
                        style: 'metadata',
                        margin: [0, 5, 0, 10],
                    },
                ];

                if (includeAnswers) {
                    questionContent.push(
                        {
                            text: `Answer: ${question.answer}`,
                            style: 'answer',
                            margin: [0, 5, 0, 5],
                        },
                    );
                }

                return {
                    stack: questionContent.filter(Boolean),
                };
            }),
        ],
        styles: {
            header: {
                fontSize: 18,
                bold: true,
            },
            question: {
                fontSize: 12,
                bold: true,
            },
            option: {
                fontSize: 11,
            },
            answer: {
                fontSize: 11,
                bold: true,
                color: 'green',
            },
            explanation: {
                fontSize: 11,
                color: 'gray',
            },
            metadata: {
                fontSize: 10,
                italics: true,
                color: 'gray',
            },
        },
    };

    return new Promise((resolve) => {
        const pdfDoc = pdfMake.createPdf(documentDefinition);
        pdfDoc.getBlob((blob: Blob) => {
            resolve(blob);
        });
    });
}


export async function generateAnswersPDF(config: PDFConfig): Promise<Blob> {
    const { selectedQuestions, options } = config;
    const { watermarkOpacity, logo } = options;

    // Convert logo File to base64 if provided
    let logoBase64: string | undefined;
    if (logo) {
        logoBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(logo);
        });
    }

    // eslint-disable-next-line
    const documentDefinition: any = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        watermark: logoBase64
            ? {
                image: logoBase64,
                opacity: watermarkOpacity,
                fit: [200, 200],
            }
            : undefined,
        header: logoBase64
            ? {
                image: logoBase64,
                width: 100,
                alignment: 'left',
                margin: [20, 20, 0, 0],
            }
            : undefined,
        content: [
            {
                text: `${config.institution} - Answer Key`,
                style: 'header',
                alignment: 'center',
                margin: [0, 0, 0, 20],
            },
            {
                ol: selectedQuestions.map((question, index) => ({
                    text: `Q${index + 1}: ${question.answer}`,
                    style: 'answer',
                    margin: [0, 5, 0, 5],
                })),
            },
        ],
        styles: {
            header: {
                fontSize: 18,
                bold: true,
            },
            answer: {
                fontSize: 11,
                bold: true,
                color: 'green',
            },
        },
    };

    return new Promise((resolve) => {
        const pdfDoc = pdfMake.createPdf(documentDefinition);
        pdfDoc.getBlob((blob: Blob) => {
            resolve(blob);
        });
    });
}
