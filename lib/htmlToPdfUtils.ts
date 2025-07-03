import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface HTMLToPDFOptions {
  filename?: string;
  pageSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  scale?: number;
  quality?: number;
  returnBlob?: boolean;
}

/**
 * Convert HTML element to PDF using html2canvas and jsPDF
 * @param element - HTML element to convert
 * @param options - PDF generation options
 * @returns Promise<Blob | void> - Blob if returnBlob is true, otherwise triggers download
 */
export async function htmlToPDF(
  element: HTMLElement,
  options: HTMLToPDFOptions = {}
): Promise<Blob | void> {
  console.log("htmlToPDF- 69696996969696969696999696969", element.outerHTML, options)
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

    // Convert HTML to canvas
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      imageTimeout: 5000,
      onclone: (clonedDoc) => {
        const clonedImages = clonedDoc.querySelectorAll('img');
        clonedImages.forEach(img => {
          if (img.naturalHeight === 0) {
            img.style.display = 'none';
          }
        });
      }
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize
    });

    const imgWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = margin;

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png', quality);
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add new pages if content is longer than one page
    while (heightLeft >= 30) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    if (returnBlob) {
      // Return blob
      const pdfBlob = pdf.output('blob');
      return pdfBlob;
    } else {
      // Download PDF
      pdf.save(filename);
    }
  } catch (error) {
    console.error('Error converting HTML to PDF:', error);
    throw error;
  }
}

/**
 * Convert HTML element to PDF and return as Blob
 * @param element - HTML element to convert
 * @param options - PDF generation options
 * @returns Promise<Blob>
 */
export async function htmlToPDFBlob(
  element: HTMLElement,
  options: HTMLToPDFOptions = {}
): Promise<Blob> {

  const result = await htmlToPDF(element, { ...options, returnBlob: true });
  if (result instanceof Blob) {
    return result;
  }
  throw new Error('Failed to generate PDF blob');
}

/**
 * Convert HTML string to PDF
 * @param htmlString - HTML string to convert
 * @param options - PDF generation options
 * @returns Promise<void>
 */
export async function htmlStringToPDF(
  htmlString: string,
  options: HTMLToPDFOptions = {}
): Promise<void> {
  const container = document.createElement('div');
  container.innerHTML = htmlString;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);
  try {
    await htmlToPDF(container, options);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Convert HTML string to PDF and return as Blob
 * @param htmlString - HTML string to convert
 * @param options - PDF generation options
 * @returns Promise<Blob>
 */
export async function htmlStringToPDFBlob(
  htmlString: string,
  options: HTMLToPDFOptions = {}
): Promise<Blob> {
  const container = document.createElement('div');
  container.innerHTML = htmlString;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);
  try {
    return await htmlToPDFBlob(container, options);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Convert URL to PDF (requires CORS access)
 * @param url - URL to convert
 * @param options - PDF generation options
 * @returns Promise<void>
 */
export async function urlToPDF(
  url: string,
  options: HTMLToPDFOptions = {}
): Promise<void> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    await htmlStringToPDF(html, options);
  } catch (error) {
    console.error('Error converting URL to PDF:', error);
    throw error;
  }
} 