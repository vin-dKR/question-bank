import { pdfConfigToHTML, pdfConfigToAnswerKeyHTML } from './questionToHtmlUtils';
import { htmlToPDFBlob } from './htmlToPdfUtils';
import { initializeMathJax, loadMathJax, fixMathJaxForPDF } from './jax/jaxUtils';


/**
 * Generate PDF from PDFConfig using simplified HTML-to-PDF approach
 */
export async function generatePDF(config: PDFConfig, options: PDFGenerationOptions = {}): Promise<Blob> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
        throw new Error('PDF generation is only available in browser environment');
    }
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
        margin = 20
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

    // Skip LaTeX test for now to focus on basic PDF generation
    // Generate HTML
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


    // Extract body content and <style> tags from the full HTML document
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const bodyContent = doc.body.innerHTML;
    const styleTags = doc.head.querySelectorAll('style');

    // Create container and insert styles + body content
    const container = document.createElement('div');
    container.id = "element-to-print";
    container.innerHTML = bodyContent;
    // Prepend all <style> tags to the container
    styleTags.forEach(style => {
        container.prepend(style.cloneNode(true));
    });
    container.style.position = 'absolute';
    container.style.top = '-10000px';
    container.style.left = '0';
    container.style.width = '794px'; // A4 width in pixels
    container.style.height = 'auto';
    container.style.backgroundColor = '#ffffff';
    container.style.visibility = 'visible';
    container.style.opacity = '1';
    container.style.padding = '20px';
    container.style.boxSizing = 'border-box';
    container.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    container.style.fontSize = `${fontSize}px`;
    container.style.lineHeight = `${lineHeight}`;
    container.style.color = '#1f2937';
    document.body.appendChild(container);

    try {
        console.log('Starting PDF generation...');

        // Debug container content
        console.log('Container first 500 chars:', container.innerHTML);

        // Check for LaTeX content
        const latexElements = container.querySelectorAll('.math-inline, .math-display');
        console.log('Found LaTeX elements:', latexElements.length);

        if (latexElements.length > 0) {
            try {
                console.log('Initializing MathJax...');
                initializeMathJax();
                const mathJaxReady = await loadMathJax(10000);

                if (mathJaxReady && window.MathJax) {
                    console.log('Processing LaTeX with MathJax...');
                    await window.MathJax.typesetPromise([container]);

                    // Wait for browser to paint CHTML output
                    await new Promise(res => setTimeout(res, 500));

                    // Remove SVG-to-image conversion logic
                    console.log('MathJax processing complete, SVG elements converted to images');
                } else {
                    console.warn('MathJax not available, LaTeX will show as raw text');
                }
            } catch (mathJaxError) {
                console.warn('MathJax failed, LaTeX will show as raw text:', mathJaxError);
            }
        } else {
            console.log('No LaTeX elements found');
        }

        // Wait for DOM to settle
        await new Promise(resolve => setTimeout(resolve, 1000));

        const html2pdfOptions = {
            margin: margin,
            filename: 'question_paper.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: true,
                letterRendering: true,
                width: container.offsetWidth,
                height: container.offsetHeight
            },
            jsPDF: {
                unit: 'mm',
                format: pageSize,
                orientation: orientation
            }
        };

        // Move container to optimal position for html2canvas capture
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '794px'; // A4 width
        container.style.maxWidth = 'none';
        container.style.maxHeight = 'none';
        container.style.border = 'none';

        // Final check before PDF generation
        console.log('Final container dimensions before PDF:', {
            offsetWidth: container.offsetWidth,
            offsetHeight: container.offsetHeight,
            scrollWidth: container.scrollWidth,
            scrollHeight: container.scrollHeight
        });

        console.log('Generating PDF with html2pdf...');
        const html2pdf = (await import('html2pdf.js')).default;
        const pdfBlob = await html2pdf().set(html2pdfOptions).from(container).outputPdf('blob');
        console.log('PDF generation complete, blob size:', pdfBlob.size);

        if (pdfBlob.size < 1000) {
            console.warn('PDF blob is very small, might be empty');
            throw new Error('Generated PDF is empty');
        }

        return pdfBlob;
    } catch (error) {
        console.error('PDF generation failed:', error);
        throw error; // Let the caller handle the fallback
    } finally {
        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
    }
}

/**
 * Generate PDF without MathJax (fallback function)
 */
export async function generatePDFWithoutMathJax(config: PDFConfig, options: PDFGenerationOptions = {}): Promise<Blob> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
        throw new Error('PDF generation is only available in browser environment');
    }
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
        margin = 20
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
            ...options
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
 * Generate Answer Key PDF from PDFConfig using simplified HTML-to-PDF approach
 */
export async function generateAnswersPDF(config: PDFConfig, options: PDFGenerationOptions = {}): Promise<Blob> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
        throw new Error('PDF generation is only available in browser environment');
    }
    const {
        includeMetadata = true,
        institution = config.institution,
        logo,
        watermarkOpacity = config.options.watermarkOpacity,
        pageSize = 'a4',
        orientation = 'portrait',
        fontSize = 14,
        lineHeight = 1.6,
        margin = 20
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

    // Generate Answer Key HTML
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
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '210mm';
    container.style.height = 'auto';
    container.style.backgroundColor = '#ffffff';
    container.style.zIndex = '-1000';
    container.style.visibility = 'hidden';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);

    try {
        console.log('Starting Answer Key PDF generation with MathJax...');

        // Initialize MathJax if not already loaded
        initializeMathJax();

        // Wait for MathJax to be ready
        const mathJaxReady = await loadMathJax(10000);
        console.log('MathJax ready for answers:', mathJaxReady);

        if (mathJaxReady && window.MathJax) {
            try {
                console.log('Processing LaTeX in answer key container...');
                // Process LaTeX in the container
                await window.MathJax.typesetPromise([container]);
                console.log('MathJax typeset complete for answers');

                // Apply fixes for PDF generation
                await fixMathJaxForPDF(container);
                console.log('MathJax fixes applied for answers');
            } catch (error) {
                console.error('MathJax processing failed for answers:', error);
                console.log('Proceeding with answer key PDF generation anyway...');
            }
        } else {
            console.log('MathJax not ready for answers, proceeding without LaTeX rendering');
        }

        // Add a small delay to ensure rendering is complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        const html2pdfOptions = {
            margin: margin,
            filename: 'answer_key.pdf',
            image: { type: 'jpeg', quality: 1 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: true,
                letterRendering: true
            },
            jsPDF: {
                unit: 'mm',
                format: pageSize,
                orientation: orientation
            }
        };

        // Make container temporarily visible for html2canvas
        container.style.visibility = 'visible';
        container.style.opacity = '1';

        console.log('Generating Answer Key PDF with html2pdf...');

        // Generate PDF from the container (which now has rendered MathJax)
        const html2pdf = (await import('html2pdf.js')).default;
        const pdfBlob = await html2pdf().set(html2pdfOptions).from(container).outputPdf('blob');
        console.log('Answer Key PDF generation complete, blob size:', pdfBlob.size);
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
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
        throw new Error('PDF generation is only available in browser environment');
    }
    const {
        includeMetadata = true,
        institution = config.institution,
        logo,
        watermarkOpacity = config.options.watermarkOpacity,
        pageSize = 'a4',
        orientation = 'portrait',
        fontSize = 14,
        lineHeight = 1.6,
        margin = 20
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
            ...options
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



