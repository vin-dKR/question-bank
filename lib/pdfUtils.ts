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
 * Simplified MathJax loading with timeout and better initialization
 */
async function loadMathJax(timeoutMs = 15000): Promise<boolean> {
  return new Promise((resolve) => {
    // Check if MathJax is already loaded and ready
    if (window.MathJax && window.MathJax.typesetPromise) {
      // For subsequent renders, we need to check if MathJax is actually ready
      // The startup state might not be reliable, so we'll test with a simple typeset
      try {
        // Test if MathJax is actually working by trying to typeset a simple expression
        const testElement = document.createElement('div');
        testElement.innerHTML = '\\(x\\)';
        testElement.style.position = 'absolute';
        testElement.style.left = '-9999px';
        testElement.style.top = '-9999px';
        document.body.appendChild(testElement);
        
        window.MathJax.typesetPromise([testElement]).then(() => {
          document.body.removeChild(testElement);
          console.log('MathJax already loaded and working');
          resolve(true);
        }).catch(() => {
          document.body.removeChild(testElement);
          console.log('MathJax loaded but not working, reinitializing...');
          // MathJax is loaded but not working, we need to reinitialize
          resolve(false);
        });
        return;
      } catch (error) {
        console.log('MathJax test failed, reinitializing...');
        resolve(false);
        return;
      }
    }

    // Set up timeout
    const timeout = setTimeout(() => {
      console.warn('MathJax loading timeout, proceeding without LaTeX rendering');
      resolve(false);
    }, timeoutMs);

    // Check for MathJax loading with better state checking
    const checkMathJax = () => {
      if (window.MathJax && window.MathJax.typesetPromise) {
        // Test if MathJax is actually working
        try {
          const testElement = document.createElement('div');
          testElement.innerHTML = '\\(x\\)';
          testElement.style.position = 'absolute';
          testElement.style.left = '-9999px';
          testElement.style.top = '-9999px';
          document.body.appendChild(testElement);
          
          window.MathJax.typesetPromise([testElement]).then(() => {
            document.body.removeChild(testElement);
            clearTimeout(timeout);
            console.log('MathJax loaded and working');
            resolve(true);
          }).catch(() => {
            document.body.removeChild(testElement);
            setTimeout(checkMathJax, 100);
          });
        } catch (error) {
          setTimeout(checkMathJax, 100);
        }
      } else {
        // MathJax not loaded yet, keep checking
        setTimeout(checkMathJax, 100);
      }
    };

    checkMathJax();
  });
}

/**
 * Initialize MathJax if not already loaded
 */
function initializeMathJax(): void {
  if (typeof window === 'undefined') return;
  
  // Check if MathJax script is already loaded
  const existingScript = document.getElementById('MathJax-script');
  if (existingScript) {
    console.log('MathJax script already exists');
    // Even if script exists, we need to ensure MathJax is properly configured
    if (!window.MathJax) {
      console.log('MathJax script exists but window.MathJax is not available, reconfiguring...');
    } else {
      console.log('MathJax script and window.MathJax both exist');
      return;
    }
  }

  // Configure MathJax before loading
  window.MathJax = {
    tex: {
      inlineMath: [['\\(', '\\)'], ['$', '$']],
      displayMath: [['\\[', '\\]'], ['$$', '$$']],
      processEscapes: true,
      processEnvironments: true,
      processRefs: true
    },
    options: {
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
      enableMenu: false,
      menuOptions: {
        settings: {
          texHints: true,
          semantics: false,
          zoom: 'NoZoom',
          zscale: '200%'
        }
      }
    },
    startup: {
      pageReady: () => {
        return window.MathJax.startup.defaultPageReady().then(() => {
          console.log('MathJax is ready');
          // Force inline rendering after MathJax is ready
          if (typeof forceInlineMath === 'function') {
            forceInlineMath();
          }
        });
      }
    }
  };

  // Load MathJax script if not already loaded
  if (!existingScript) {
    const script = document.createElement('script');
    script.id = 'MathJax-script';
    script.async = true;
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    document.head.appendChild(script);
    console.log('MathJax script loaded');
  } else {
    console.log('MathJax script already exists, configuration updated');
  }
}

/**
 * Force inline math rendering
 */
function forceInlineMath(): void {
  if (typeof window === 'undefined') return;
  
  // Force all MathJax elements to be inline
  const mathElements = document.querySelectorAll('[class*="MathJax"]');
  mathElements.forEach(el => {
    if (el instanceof HTMLElement) {
      el.style.display = 'inline';
      el.style.margin = '0';
      el.style.padding = '0';
      el.style.verticalAlign = 'baseline';
    }
  });
  
  console.log('Forced inline math rendering for', mathElements.length, 'elements');
}

/**
 * Reset MathJax state for consistent rendering
 */
function resetMathJaxState(): void {
  if (typeof window === 'undefined') return;
  
  // Clear any existing MathJax elements
  const mathElements = document.querySelectorAll('[class*="MathJax"]');
  mathElements.forEach(el => {
    if (el instanceof HTMLElement) {
      el.remove();
    }
  });
  
  // Reset MathJax startup state if possible
  if (window.MathJax && window.MathJax.startup) {
    try {
      // Clear any pending processing
      if (window.MathJax.startup.document) {
        window.MathJax.startup.document.clear();
      }
    } catch (error) {
      console.log('Could not reset MathJax state:', error);
    }
  }
  
  console.log('MathJax state reset');
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

  // Reset MathJax state for consistent rendering
  resetMathJaxState();

  // Initialize MathJax if not already loaded
  initializeMathJax();

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
    // Debug MathJax status
    debugMathJaxStatus();
    
    // Try to load MathJax with longer timeout
    const mathJaxLoaded = await loadMathJax(10000); // 10 second timeout

    if (mathJaxLoaded) {
      try {
        // Test LaTeX rendering first
        const testResult = await testLatexRendering();
        console.log('LaTeX rendering test result:', testResult);
        
        if (testResult) {
          // Render LaTeX with timeout
          await Promise.race([
            window.MathJax.typesetPromise([container]),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('MathJax rendering timeout')), 8000)
            )
          ]);
          console.log('MathJax rendering completed successfully');
          
          // Force inline rendering
          forceInlineMath();
          
          // Verify that LaTeX was actually rendered
          const mathElements = container.querySelectorAll('[class*="MathJax"]');
          console.log('MathJax elements found in container:', mathElements.length);
          
          if (mathElements.length === 0) {
            console.warn('No MathJax elements found after rendering - LaTeX may not have been processed');
          }
        } else {
          console.warn('LaTeX rendering test failed, proceeding without LaTeX');
        }
      } catch (error) {
        console.warn('MathJax rendering failed, proceeding without LaTeX:', error);
      }
    } else {
      console.warn('MathJax not available, proceeding without LaTeX rendering');
    }

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
 * Generate PDF without MathJax (fallback function)
 */
export async function generatePDFWithoutMathJax(config: PDFConfig, options: PDFGenerationOptions = {}): Promise<Blob> {
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

  // Generate HTML without MathJax
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
    // Convert HTML to PDF directly without MathJax
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
    // Try to load MathJax with timeout
    const mathJaxLoaded = await loadMathJax(5000); // 5 second timeout

    if (mathJaxLoaded) {
      try {
        // Render LaTeX with timeout
        await Promise.race([
          window.MathJax.typesetPromise([container]),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('MathJax rendering timeout')), 3000)
          )
        ]);
        console.log('MathJax rendering completed');
      } catch (error) {
        console.warn('MathJax rendering failed, proceeding without LaTeX:', error);
      }
    } else {
      console.warn('MathJax not available, proceeding without LaTeX rendering');
    }

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
 * Generate Answer Key PDF without MathJax (fallback function)
 */
export async function generateAnswersPDFWithoutMathJax(config: PDFConfig, options: PDFGenerationOptions = {}): Promise<Blob> {
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

  // Generate Answer Key HTML without MathJax
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
    // Convert HTML to PDF directly without MathJax
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

/**
 * Debug function to check MathJax status and LaTeX rendering
 */
export function debugMathJaxStatus(): void {
  console.log('=== MathJax Debug Information ===');
  
  // Check if MathJax is loaded
  if (typeof window !== 'undefined') {
    console.log('Window object available:', !!window);
    console.log('MathJax loaded:', !!window.MathJax);
    
    if (window.MathJax) {
      console.log('MathJax version:', window.MathJax.version);
      console.log('MathJax startup ready:', !!window.MathJax.startup);
      console.log('MathJax typesetPromise available:', !!window.MathJax.typesetPromise);
      console.log('MathJax tex2svgPromise available:', !!window.MathJax.tex2svgPromise);
      
      if (window.MathJax.startup) {
        console.log('MathJax startup state:', window.MathJax.startup.document?.state());
      }
    } else {
      console.log('MathJax not loaded yet');
    }
  } else {
    console.log('Window object not available (server-side)');
  }
  
  console.log('=== End Debug Information ===');
}

/**
 * Test LaTeX rendering with a simple expression
 */
export async function testLatexRendering(latex: string = 'x^2 + y^2 = z^2'): Promise<boolean> {
  try {
    if (typeof window === 'undefined') {
      console.log('Cannot test LaTeX rendering on server-side');
      return false;
    }
    
    // Wait for MathJax to be available
    const mathJaxLoaded = await loadMathJax(5000);
    
    if (!mathJaxLoaded) {
      console.log('MathJax not available for testing');
      return false;
    }
    
    // Create a test element
    const testElement = document.createElement('div');
    testElement.innerHTML = `\\(${latex}\\)`;
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    testElement.style.top = '-9999px';
    document.body.appendChild(testElement);
    
    try {
      // Try to render the LaTeX
      await window.MathJax.typesetPromise([testElement]);
      console.log('LaTeX rendering test successful');
      
      // Check if MathJax actually rendered something
      const mathElements = testElement.querySelectorAll('[class*="MathJax"]');
      const success = mathElements.length > 0;
      
      console.log('MathJax elements found:', mathElements.length);
      
      // Clean up
      document.body.removeChild(testElement);
      
      return success;
    } catch (error) {
      console.error('LaTeX rendering test failed:', error);
      document.body.removeChild(testElement);
      return false;
    }
  } catch (error) {
    console.error('LaTeX rendering test setup failed:', error);
    return false;
  }
}