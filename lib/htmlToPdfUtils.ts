/**
 * Convert HTML string or element to PDF using html2pdf.js
 * @param htmlInput - HTML string or element to convert
 * @param options - PDF generation options
 * @returns Promise<Blob | void> - Blob if returnBlob is true, otherwise triggers download
 */
export async function htmlToPDF(
    htmlInput: string | HTMLElement,
    options: HTMLToPDFOptions = {}
): Promise<Blob | void> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
        throw new Error('PDF generation is only available in browser environment');
    }

    const {
        filename = 'document.pdf',
        pageSize = 'a4',
        orientation = 'portrait',
        margin = 10,
        scale = 2,
        quality = 1,
        returnBlob = false
    } = options;

    try {
        // Convert HTML string to DOM element if needed
        let element: HTMLElement;
        if (typeof htmlInput === 'string') {
            // Create a temporary container for the HTML string
            element = document.createElement('div');
            element.innerHTML = htmlInput;

            // Apply styles to ensure proper rendering
            element.style.width = '794px'; // A4 width in pixels at 96dpi
            element.style.minHeight = '1123px'; // A4 height in pixels at 96dpi
            element.style.backgroundColor = '#ffffff';
            element.style.color = '#000000';
            element.style.fontFamily = 'Times New Roman, serif';
            element.style.fontSize = '14px';
            element.style.lineHeight = '1.6';
            element.style.padding = '20px';
            element.style.boxSizing = 'border-box';

            // Temporarily add to DOM for proper rendering
            element.style.position = 'absolute';
            element.style.left = '-9999px';
            element.style.top = '-9999px';
            document.body.appendChild(element);
        } else {
            element = htmlInput;
        }

        // Pre-process images to handle loading errors
        const images = element.querySelectorAll('img');
        const imagePromises = Array.from(images).map(img => {
            return new Promise<void>((resolve) => {
                if (img.complete && img.naturalHeight !== 0) {
                    resolve();
                } else {
                    img.onload = () => resolve();
                    img.onerror = () => {
                        console.warn('Image failed to load:', img.src);
                        img.style.display = 'none';
                        resolve();
                    };
                }
            });
        });
        await Promise.all(imagePromises);

        // Configure html2pdf options
        const html2pdfOptions = {
            margin: margin,
            filename: filename,
            image: { type: 'jpeg', quality: quality },
            html2canvas: {
                scale: scale,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
            },
            jsPDF: {
                unit: 'mm',
                format: pageSize,
                orientation: orientation
            }
        };

        // Dynamically import html2pdf to avoid SSR issues
        const html2pdf = (await import('html2pdf.js')).default;

        let result;
        if (returnBlob) {
            const pdfBlob = await html2pdf().set(html2pdfOptions).from(element).outputPdf('blob');
            result = pdfBlob;
        } else {
            // Download PDF using html2pdf
            await html2pdf().set(html2pdfOptions).from(element).save();
            result = undefined;
        }

        // Clean up temporary element if we created one
        if (typeof htmlInput === 'string' && document.body.contains(element)) {
            document.body.removeChild(element);
        }

        return result;
    } catch (error) {
        console.error('Error converting HTML to PDF:', error);
        throw error;
    }
}

/**
 * Convert HTML string or element to PDF and return as Blob
 * @param htmlInput - HTML string or element to convert
 * @param options - PDF generation options
 * @returns Promise<Blob>
 */
export async function htmlToPDFBlob(
    htmlInput: string | HTMLElement,
    options: HTMLToPDFOptions = {}
): Promise<Blob> {
    const result = await htmlToPDF(htmlInput, { ...options, returnBlob: true });
    if (result instanceof Blob) {
        return result;
    }
    throw new Error('Failed to generate PDF blob');
}
