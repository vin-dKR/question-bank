import { pdfConfigToHTML, pdfConfigToAnswerKeyHTML, QuestionToHTMLOptions } from './questionToHtmlUtils';
import { htmlToPDF, HTMLToPDFOptions } from './htmlToPdfUtils';

export interface PDFConfigToPDFOptions extends QuestionToHTMLOptions, HTMLToPDFOptions {
  isAnswerKey?: boolean;
  waitForMathJax?: boolean;
}

/**
 * Convert PDFConfig directly to PDF using HTML conversion
 * This is the main function you'll use to replace your existing PDF generation
 */
export async function pdfConfigToPDF(
  config: PDFConfig,
  options: PDFConfigToPDFOptions = {}
): Promise<void> {
  const {
    isAnswerKey = false,
    waitForMathJax = true,
    includeAnswers = config.options.includeAnswers,
    includeMetadata = true,
    institution = config.institution,
    logo,
    watermarkOpacity = config.options.watermarkOpacity,
    pageSize = 'a4',
    orientation = 'portrait',
    fontSize = 14,
    lineHeight = 1.6,
    margin = 20,
    filename = isAnswerKey ? 'answer_key.pdf' : 'question_paper.pdf',
    scale = 2,
    quality = 1
  } = options;

  if (config.selectedQuestions.length === 0) {
    throw new Error('No questions selected for PDF generation');
  }

  // Convert logo File to data URL if provided
  let logoBase64: string | undefined;
  if (logo) {
    // logoBase64 = await new Promise<string>((resolve) => {
    //   const reader = new FileReader();
    //   reader.onload = () => resolve(reader.result as string);
    //   reader.readAsDataURL(logo);
    // });
  } else if (config.options.logo) {
    logoBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(config.options.logo!);
    });
  }

  // Generate HTML
  const htmlOptions: QuestionToHTMLOptions = {
    includeAnswers,
    includeMetadata,
    institution,
    logo: logoBase64,
    watermarkOpacity,
    pageSize,
    orientation,
    fontSize,
    lineHeight,
    margin
  };

  const html = isAnswerKey 
    ? pdfConfigToAnswerKeyHTML(config, htmlOptions)
    : pdfConfigToHTML(config, htmlOptions);

  // Create temporary container
  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '210mm'; // A4 width
  container.style.backgroundColor = '#ffffff';
  document.body.appendChild(container);

  try {
    // Wait for MathJax to render LaTeX if needed
    if (waitForMathJax) {
      await new Promise<void>((resolve) => {
        const checkMathJax = () => {
          if (window.MathJax && window.MathJax.startup && window.MathJax.startup.document.state() === 'ready') {
            resolve();
          } else {
            setTimeout(checkMathJax, 100);
          }
        };
        checkMathJax();
      });
    }

    // Convert to PDF
    await htmlToPDF(container, {
      filename,
      pageSize,
      orientation,
      margin: margin / 2, // Convert mm to approximate PDF margin
      scale,
      quality
    });
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}

/**
 * Generate both question paper and answer key PDFs
 */
export async function generateQuestionPaperAndAnswerKey(
  config: PDFConfig,
  options: PDFConfigToPDFOptions = {}
): Promise<void> {
  // Generate question paper
  await pdfConfigToPDF(config, {
    ...options,
    isAnswerKey: false,
    filename: options.filename || 'question_paper.pdf'
  });

  // Generate answer key if answers are included
  if (config.options.includeAnswers) {
    await pdfConfigToPDF(config, {
      ...options,
      isAnswerKey: true,
      filename: options.filename ? options.filename.replace('.pdf', '_answer_key.pdf') : 'answer_key.pdf'
    });
  }
}

/**
 * Preview PDFConfig as HTML (useful for debugging or preview)
 */
export function previewPDFConfigAsHTML(
  config: PDFConfig,
  options: QuestionToHTMLOptions = {},
  isAnswerKey = false
): string {
  const defaultOptions: QuestionToHTMLOptions = {
    includeAnswers: config.options.includeAnswers,
    includeMetadata: true,
    institution: config.institution,
    watermarkOpacity: config.options.watermarkOpacity,
    pageSize: 'a4',
    orientation: 'portrait',
    fontSize: 14,
    lineHeight: 1.6,
    margin: 20,
    ...options
  };

  return isAnswerKey 
    ? pdfConfigToAnswerKeyHTML(config, defaultOptions)
    : pdfConfigToHTML(config, defaultOptions);
}

/**
 * Replace your existing generatePDF function with this
 * Usage: await generatePDFFromConfig(config)
 */
export async function generatePDFFromConfig(config: PDFConfig): Promise<void> {
  return pdfConfigToPDF(config);
}

/**
 * Replace your existing generateAnswersPDF function with this
 * Usage: await generateAnswersPDFFromConfig(config)
 */
export async function generateAnswersPDFFromConfig(config: PDFConfig): Promise<void> {
  return pdfConfigToPDF(config, { isAnswerKey: true });
} 