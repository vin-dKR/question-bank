import { pdfConfigToHTML, pdfConfigToAnswerKeyHTML, QuestionToHTMLOptions } from './questionToHtmlUtils';
import { htmlToPDFBlob, HTMLToPDFOptions } from './htmlToPdfUtils';

// Add this at the top of the file (after imports)
declare global {
  interface Window {
    MathJax: any;
  }
}

export interface PDFGenerationOptions {
  includeAnswers?: boolean;
  includeMetadata?: boolean;
  institution?: string;
  logo?: File | Blob;
  watermarkOpacity?: number;
  pageSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  fontSize?: number;
  lineHeight?: number;
  margin?: number;
  pdfOptions?: HTMLToPDFOptions;
}

/**
 * Generate PDF from PDFConfig using HTML-to-PDF approach with LaTeX rendering
 */
export async function generatePDF(config: PDFConfig, options: PDFGenerationOptions = {}): Promise<Blob> {
  const {
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
    pdfOptions = {}
  } = options;

  // Convert logo File to data URL if provided
  let logoBase64: string | undefined;
  if (logo) {
    logoBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(logo);
    });
  } else if (config.options.logo) {
    logoBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(config.options.logo!);
    });
  }

  // Generate HTML with LaTeX support
  const html = pdfConfigToHTML(config, {
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
  });

  // Create temporary container with the HTML
  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '210mm'; // A4 width
  container.style.backgroundColor = '#ffffff';
  document.body.appendChild(container);

  try {
    // Wait for MathJax to load and render LaTeX
    await new Promise<void>((resolve) => {
      const checkMathJax = () => {
        if (window.MathJax && window.MathJax.typesetPromise) {
          // MathJax is loaded, now render the LaTeX
          window.MathJax.typesetPromise([container]).then(() => {
            console.log('MathJax rendering completed');
            resolve();
          }).catch((error: unknown) => {
            console.error('MathJax rendering error:', error);
            resolve(); // Continue anyway
          });
        } else {
          setTimeout(checkMathJax, 100);
        }
      };
      checkMathJax();
    });

    // Additional wait to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Convert HTML to PDF
    const pdfBlob = await htmlToPDFBlob(container, {
      filename: 'question_paper.pdf',
      pageSize,
      orientation,
      margin: 10,
      scale: 2,
      quality: 1,
      ...pdfOptions
    });

    return pdfBlob;
  } finally {
    // Clean up
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Generate Answer Key PDF from PDFConfig using HTML-to-PDF approach with LaTeX rendering
 */
export async function generateAnswersPDF(config: PDFConfig, options: PDFGenerationOptions = {}): Promise<Blob> {
  const {
    includeMetadata = true,
    institution = config.institution,
    logo,
    watermarkOpacity = config.options.watermarkOpacity,
    pageSize = 'a4',
    orientation = 'portrait',
    fontSize = 14,
    lineHeight = 1.6,
    margin = 20,
    pdfOptions = {}
  } = options;

  // Convert logo File to data URL if provided
  let logoBase64: string | undefined;
  if (logo) {
    logoBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(logo);
    });
  } else if (config.options.logo) {
    logoBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(config.options.logo!);
    });
  }

  // Generate Answer Key HTML with LaTeX support
  const html = pdfConfigToAnswerKeyHTML(config, {
    includeMetadata,
    institution,
    logo: logoBase64,
    watermarkOpacity,
    pageSize,
    orientation,
    fontSize,
    lineHeight,
    margin
  });

  // Create temporary container with the HTML
  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '210mm'; // A4 width
  container.style.backgroundColor = '#ffffff';
  document.body.appendChild(container);

  try {
    // Wait for MathJax to load and render LaTeX
    await new Promise<void>((resolve) => {
      const checkMathJax = () => {
        if (window.MathJax && window.MathJax.typesetPromise) {
          // MathJax is loaded, now render the LaTeX
          window.MathJax.typesetPromise([container]).then(() => {
            console.log('MathJax rendering completed');
            resolve();
          }).catch((error: unknown) => {
            console.error('MathJax rendering error:', error);
            resolve(); // Continue anyway
          });
        } else {
          setTimeout(checkMathJax, 100);
        }
      };
      checkMathJax();
    });

    // Additional wait to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Convert HTML to PDF
    const pdfBlob = await htmlToPDFBlob(container, {
      filename: 'answer_key.pdf',
      pageSize,
      orientation,
      margin: 10,
      scale: 2,
      quality: 1,
      ...pdfOptions
    });

    return pdfBlob;
  } finally {
    // Clean up
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Generate HTML preview from PDFConfig (for preview purposes)
 */
export function generateHTMLPreview(config: PDFConfig, options: QuestionToHTMLOptions = {}): string {
  return pdfConfigToHTML(config, options);
}

/**
 * Generate Answer Key HTML preview from PDFConfig (for preview purposes)
 */
export function generateAnswerKeyHTMLPreview(config: PDFConfig, options: QuestionToHTMLOptions = {}): string {
  return pdfConfigToAnswerKeyHTML(config, options);
}

// Legacy functions for backward compatibility (deprecated)
export function svgToDataUrl(svg: string): string {
  console.warn('svgToDataUrl is deprecated. Use HTML-to-PDF approach instead.');
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

export async function svgToPngDataUrl(svg: string, width = 80, height = 24): Promise<string> {
  console.warn('svgToPngDataUrl is deprecated. Use HTML-to-PDF approach instead.');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  // Note: This requires canvg library which may not be available
  // For now, return a placeholder
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
}

export async function latexToSvg_MathJax(latex: string): Promise<string> {
  console.warn('latexToSvg_MathJax is deprecated. Use HTML-to-PDF approach instead.');
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

export async function splitTextAndLatexToPdfMake(str: string): Promise<any[]> {
  console.warn('splitTextAndLatexToPdfMake is deprecated. Use HTML-to-PDF approach instead.');
  return [{ text: str }];
}

export async function parseTextWithLatexForPdf(str: string) {
  console.warn('parseTextWithLatexForPdf is deprecated. Use HTML-to-PDF approach instead.');
  return [{ text: str }];
}
