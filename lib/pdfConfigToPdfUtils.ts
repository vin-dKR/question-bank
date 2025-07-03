import { pdfConfigToHTML, pdfConfigToAnswerKeyHTML, QuestionToHTMLOptions } from './questionToHtmlUtils';
import { htmlToPDF, HTMLToPDFOptions } from './htmlToPdfUtils';

export interface PDFConfigToPDFOptions extends QuestionToHTMLOptions, HTMLToPDFOptions {
  isAnswerKey?: boolean;
  waitForMathJax?: boolean;
}

/**
 * Helper: Wait for MathJax to be fully ready (typesetPromise available)
 */
async function waitForMathJaxReady(timeoutMs = 15000): Promise<boolean> {
  const start = Date.now();
  while (
    (!window.MathJax || !window.MathJax.typesetPromise) &&
    Date.now() - start < timeoutMs
  ) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return !!(window.MathJax && window.MathJax.typesetPromise);
}

/**
 * Helper: Convert File/Blob to base64 string
 */
async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

/**
 * Helper: Create and clean up a temporary DOM container
 */
function withTempContainer(html: string, fn: (container: HTMLElement) => Promise<void>): Promise<void> {
  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '210mm';
  container.style.backgroundColor = '#fff';
  document.body.appendChild(container);
  return fn(container).finally(() => {
    document.body.removeChild(container);
  });
}

/**
 * Convert PDFConfig directly to PDF using HTML conversion (with MathJax support)
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
    // logoBase64 = await fileToBase64(logo);
    console.log('logo', logo);
  } else if (config.options.logo) {
    logoBase64 = await fileToBase64(config.options.logo);
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

  await withTempContainer(html, async (container) => {
    // Wait for MathJax to render LaTeX if needed
    if (waitForMathJax) {
      // Wait for MathJax to be loaded and ready
      const mathJaxReady = await waitForMathJaxReady(15000);
      if (!mathJaxReady) {
        console.warn('MathJax did not load in time, proceeding without LaTeX rendering');
      } else {
        // Wait for MathJax to finish typesetting all math in the container
        try {
          await window.MathJax.typesetPromise([container]);
        } catch (error) {
          console.warn('MathJax rendering failed, proceeding without LaTeX:', error);
        }
      }
    }
    // Now MathJax has rendered all math, so snapshot to PDF
    await htmlToPDF(container, {
      filename,
      pageSize,
      orientation,
      margin: margin / 2, // Convert mm to approximate PDF margin
      scale,
      quality
    });
  });
}

/**
 * Generate both question paper and answer key PDFs
 */
export async function generateQuestionPaperAndAnswerKey(
  config: PDFConfig,
  options: PDFConfigToPDFOptions = {}
): Promise<void> {
  await pdfConfigToPDF(config, {
    ...options,
    isAnswerKey: false,
    filename: options.filename || 'question_paper.pdf'
  });
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
 */
export async function generatePDFFromConfig(config: PDFConfig): Promise<void> {
  return pdfConfigToPDF(config);
}

/**
 * Replace your existing generateAnswersPDF function with this
 */
export async function generateAnswersPDFFromConfig(config: PDFConfig): Promise<void> {
  return pdfConfigToPDF(config, { isAnswerKey: true });
} 