import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Canvg } from 'canvg';

// Add this at the top of the file (after imports)
declare global {
  interface Window {
    MathJax: any;
  }
}

// Register fonts
pdfMake.vfs = pdfFonts;

// Utility: Convert SVG string to data URL
export function svgToDataUrl(svg: string): string {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Convert SVG string to PNG data URL (browser only)
export async function svgToPngDataUrl(svg: string, width = 80, height = 24): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  const v = await Canvg.fromString(ctx, svg);
  await v.render();
  return canvas.toDataURL('image/png');
}

// Utility: Render LaTeX to SVG using MathJax (browser, assumes MathJax is loaded globally)
export async function latexToSvg_MathJax(latex: string): Promise<string> {
  // Wait for MathJax to be loaded and ready
  if (typeof window.MathJax === 'undefined' || !window.MathJax.tex2svgPromise) {
    await new Promise<void>((resolve) => {
      const check = () => {
        if (window.MathJax && window.MathJax.tex2svgPromise) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }
  // @ts-ignore
  const svgNode = await window.MathJax.tex2svgPromise(latex, { display: false });
  return new XMLSerializer().serializeToString(svgNode);
}

// Utility: Split string into text and LaTeX parts, convert LaTeX to PNG images for PDFMake using MathJax
export async function splitTextAndLatexToPdfMake(str: string): Promise<any[]> {
  const result: any[] = [];
  let lastIndex = 0;
  const regex = /\\\((.+?)\\\)/g;
  let match;
  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      result.push({ text: str.slice(lastIndex, match.index) });
    }
    // Convert LaTeX to SVG with MathJax, then to PNG data URL
    const svg = await latexToSvg_MathJax(match[1]);
    const dataUrl = await svgToPngDataUrl(svg, 80, 24);
    result.push({ image: dataUrl, width: 80, height: 24, margin: [0, -6, 0, -6] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < str.length) {
    result.push({ text: str.slice(lastIndex) });
  }
  return result;
}

/**
 * Example: Parse a string with mixed text and LaTeX for PDFMake
 * Usage: await parseTextWithLatexForPdf('theory of relativity is \\(E = Mc^2\\)')
 * Returns: [ { text: 'theory of relativity is ' }, { image: 'data:image/png;base64,...', ... } ]
 */
export async function parseTextWithLatexForPdf(str: string) {
  return await splitTextAndLatexToPdfMake(str);
}

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

    const content = [
        {
            text: config.institution,
            style: 'header',
            alignment: 'center',
            margin: [0, 0, 0, 20],
        },
        ...(await Promise.all(selectedQuestions.map(async (question, index) => {
            const questionContent: any = [
                {
                    text: await parseTextWithLatexForPdf(question.question_text),
                    style: 'question',
                    margin: [0, 10, 0, 5],
                },
                {
                    ul: await Promise.all(Object.entries(question.options).map(async ([key, value]) => ({
                        text: await splitTextAndLatexToPdfMake(`${key}. ${value}`),
                        style: 'option',
                        margin: [10, 2, 0, 2],
                    }))),
                },
                {
                    text: `Source: (${question.exam_name}, ${question.subject})`,
                    style: 'metadata',
                    margin: [0, 5, 0, 10],
                },
            ];

            if (includeAnswers) {
                questionContent.push({
                    text: await splitTextAndLatexToPdfMake(`Answer: ${question.answer}`),
                    style: 'answer',
                    margin: [0, 5, 0, 5],
                });
            }

            return {
                stack: questionContent.filter(Boolean),
            };
        }))),
    ];

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
        content,
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
                ol: await Promise.all(selectedQuestions.map(async (question, index) => ({
                    text: await splitTextAndLatexToPdfMake(`Q${index + 1}: ${question.answer}`),
                    style: 'answer',
                    margin: [0, 5, 0, 5],
                }))),
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
