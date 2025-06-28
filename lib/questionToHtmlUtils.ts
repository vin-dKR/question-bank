export interface QuestionToHTMLOptions {
    includeAnswers?: boolean;
    includeMetadata?: boolean;
    institution?: string;
    logo?: string;
    watermarkOpacity?: number;
    pageSize?: 'a4' | 'letter' | 'legal';
    orientation?: 'portrait' | 'landscape';
    fontSize?: number;
    lineHeight?: number;
    margin?: number;
}

/**
 * Convert text with LaTeX to HTML string for PDF generation
 * This function converts \(...\) to proper MathJax syntax
 */
function textToHtmlWithLatex(text: string): string {
    if (!text) return '';

    // Replace \(...\) with MathJax inline math syntax (no extra spaces)
    // Also ensure no line breaks interfere with LaTeX
    return text
        .replace(/\\\(/g, '\\(')
        .replace(/\\\)/g, '\\)')
        // Don't convert newlines to <br> as they can interfere with LaTeX
        // .replace(/\n/g, '<br>')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        // Ensure LaTeX expressions are not broken by whitespace
        .replace(/\s*\\\(\s*/g, '\\(')
        .replace(/\s*\\\)\s*/g, '\\)');
}

/**
 * Convert a single question to HTML with LaTeX rendering
 */
export function questionToHTML(question: Question, index: number, options: QuestionToHTMLOptions = {}): string {
    const {
        includeAnswers = true,
        includeMetadata = true,
        fontSize = 14,
        lineHeight = 1.6
    } = options;

    const questionNumber = index + 1;
    const questionText = textToHtmlWithLatex(question.question_text);

    // Render options with LaTeX
    const optionsHTML = question.options.map((option, optIndex) => {
        const optionLetter = String.fromCharCode(65 + optIndex);
        const optionNumber = String(optIndex + 1);
        const answers = (question.answer || '')
            .toString()
            .split(',')
            .map((a) => a.trim().toUpperCase());

        const isCorrect = answers.includes(optionLetter) || answers.includes(optionNumber);
        const optionText = textToHtmlWithLatex(option);

        return `
      <div class="option ${isCorrect ? 'correct' : ''}" style="
        padding: 4px 12px;
        margin: 4px 0;
        border-left: 4px solid ${isCorrect ? '#10b981' : '#e5e7eb'};
        background-color: ${isCorrect ? '#f0fdf4' : '#ffffff'};
        border-radius: 0 6px 6px 0;
      ">
        <span style="font-weight: 500; margin-right: 8px;">${optionLetter}.</span>
        <span>${optionText}</span>
      </div>
    `;
    }).join('');

    // Render answer with LaTeX
    const answerHTML = includeAnswers ? `
    <div class="answer" style="
      margin-top: 12px;
      padding: 8px 12px;
      background-color: #f0fdf4;
      border: 1px solid #10b981;
      border-radius: 6px;
      color: #065f46;
    ">
      <span style="font-weight: 600;">Answer:</span> ${textToHtmlWithLatex(question.answer)}
    </div>
  ` : '';

    // Render metadata
    const metadataHTML = includeMetadata ? `
    <div class="metadata" style="
      margin-top: 8px;
      font-size: 12px;
      color: #6b7280;
      font-style: italic;
    ">
      Source: (${question.exam_name || 'Unknown'}, ${question.subject || 'Unknown'})
      ${question.chapter ? ` • Chapter: ${question.chapter}` : ''}
      ${question.section_name ? ` • Section: ${question.section_name}` : ''}
    </div>
  ` : '';

    return `
    <div class="question" style="
      margin-bottom: 24px;
      padding: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background-color: #ffffff;
      page-break-inside: avoid;
    ">
      <div class="question-header" style="
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        <span class="question-number" style="
          background-color: #3b82f6;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 14px;
          min-width: 24px;
          text-align: center;
        ">${questionNumber}</span>
        <h3 class="question-text" style="
          margin: 0;
          font-size: ${fontSize}px;
          line-height: ${lineHeight};
          color: #1f2937;
          font-weight: 600;
        ">${questionText}</h3>
      </div>
      
      <div class="options" style="margin: 16px 0;">
        ${optionsHTML}
      </div>
      
      ${answerHTML}
      ${metadataHTML}
    </div>
  `;
}

/**
 * Convert PDFConfig to complete HTML document
 */
export function pdfConfigToHTML(config: PDFConfig, options: QuestionToHTMLOptions = {}): string {
    const {
        includeAnswers = true,
        includeMetadata = true,
        institution = 'Institution',
        logo,
        watermarkOpacity = 0.1,
        pageSize = 'a4',
        orientation = 'portrait',
        fontSize = 14,
        lineHeight = 1.6,
        margin = 20
    } = options;

    const { selectedQuestions } = config;

    // Generate questions HTML
    const questionsHTML = selectedQuestions.map((question, index) =>
        questionToHTML(question, index, { includeAnswers, includeMetadata, fontSize, lineHeight })
    ).join('');

    // Generate header with logo if provided
    const headerHTML = logo ? `
    <div class="header" style="
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e5e7eb;
    ">
      <img src="${logo}" alt="Logo" style="
        height: 60px;
        width: auto;
        object-fit: contain;
      " />
      <h1 style="
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        color: #1f2937;
      ">${institution}</h1>
    </div>
  ` : `
    <div class="header" style="
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e5e7eb;
    ">
      <h1 style="
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        color: #1f2937;
      ">${institution}</h1>
      <p style="
        margin: 8px 0 0 0;
        font-size: 16px;
        color: #6b7280;
      ">Question Paper</p>
    </div>
  `;

    // Generate watermark if logo provided
    const watermarkCSS = logo ? `
    body::before {
      content: '';
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 200px;
      height: 200px;
      background-image: url('${logo}');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      opacity: ${watermarkOpacity};
      pointer-events: none;
      z-index: -1;
    }
  ` : '';

    // Complete HTML document
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${institution} - Question Paper</title>
      <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
      <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
      <script>
      MathJax.Hub.Config({
    tex2jax: {
      inlineMath: [ ['$','$'], ["\\(","\\)"] ],
      processEscapes: true
    }
  });
      </script>
      <style>
        * {
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: ${lineHeight};
          color: #1f2937;
          background-color: #ffffff;
          margin: 0;
          padding: ${margin}mm;
          font-size: ${fontSize}px;
        }
        
        @page {
          size: ${pageSize} ${orientation};
          margin: ${margin}mm;
        }
        
        .question {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .option {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .answer {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        /* Print styles */
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .question {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
        
        /* MathJax inline math styles - Force inline display */
        .MathJax {
          display: inline !important;
          margin: 0 !important;
          padding: 0 !important;
          vertical-align: baseline !important;
        }
        
        .MathJax_Display {
          display: block !important;
          margin: 1em 0 !important;
        }
        
        /* Force all MathJax elements to be inline */
        .MathJax_Display > .MathJax {
          display: inline !important;
        }
        
        /* Specific rules for inline math */
        .MathJax[data-mathml] {
          display: inline !important;
        }
        
        /* Override any display: block that might be applied */
        .MathJax[style*="display: block"] {
          display: inline !important;
        }
        
        /* Ensure text elements containing MathJax are inline */
        .question-text .MathJax,
        .option .MathJax,
        .answer .MathJax {
          display: inline !important;
        }
        
        ${watermarkCSS}
      </style>
    </head>
    <body>
      ${headerHTML}
      <div class="questions-container">
        ${questionsHTML}
      </div>
      
      <div class="footer" style="
        margin-top: 32px;
        padding-top: 16px;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        font-size: 12px;
        color: #6b7280;
      ">
        <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        <p>Total Questions: ${selectedQuestions.length}</p>
      </div>
      
      <script>
        // Ensure MathJax renders after the page loads
        if (window.MathJax && window.MathJax.typesetPromise) {
          window.MathJax.typesetPromise().then(() => {
            // Force all MathJax elements to be inline after rendering
            const mathElements = document.querySelectorAll('.MathJax');
            mathElements.forEach(el => {
              if (el instanceof HTMLElement) {
                el.style.display = 'inline';
                el.style.verticalAlign = 'baseline';
                el.style.margin = '0';
                el.style.padding = '0';
              }
            });
          });
        } else {
          // Wait for MathJax to load
          const checkMathJax = () => {
            if (window.MathJax && window.MathJax.typesetPromise) {
              window.MathJax.typesetPromise().then(() => {
                // Force all MathJax elements to be inline after rendering
                const mathElements = document.querySelectorAll('.MathJax');
                mathElements.forEach(el => {
                  if (el instanceof HTMLElement) {
                    el.style.display = 'inline';
                    el.style.verticalAlign = 'baseline';
                    el.style.margin = '0';
                    el.style.padding = '0';
                  }
                });
              });
            } else {
              setTimeout(checkMathJax, 100);
            }
          };
          checkMathJax();
        }
      </script>
    </body>
    </html>
  `;
}

/**
 * Convert PDFConfig to answer key HTML
 */
export function pdfConfigToAnswerKeyHTML(config: PDFConfig, options: QuestionToHTMLOptions = {}): string {
    const {
        institution = 'Institution',
        logo,
        watermarkOpacity = 0.1,
        pageSize = 'a4',
        orientation = 'portrait',
        fontSize = 14,
        lineHeight = 1.6,
        margin = 20
    } = options;

    const { selectedQuestions } = config;

    // Generate answers HTML
    const answersHTML = selectedQuestions.map((question, index) => {
        const questionNumber = index + 1;
        const answerText = textToHtmlWithLatex(question.answer);

        return `
      <div class="answer-item" style="
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        margin: 8px 0;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background-color: #f9fafb;
      ">
        <span class="question-number" style="
          background-color: #10b981;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 14px;
          min-width: 32px;
          text-align: center;
        ">${questionNumber}</span>
        <div class="answer-content" style="flex: 1;">
          <div class="answer-text" style="
            font-size: ${fontSize}px;
            font-weight: 600;
            color: #065f46;
          ">${answerText}</div>
          <div class="question-preview" style="
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
            font-style: italic;
          ">${question.question_text.substring(0, 100)}${question.question_text.length > 100 ? '...' : ''}</div>
        </div>
      </div>
    `;
    }).join('');

    // Generate header with logo if provided
    const headerHTML = logo ? `
    <div class="header" style="
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e5e7eb;
    ">
      <img src="${logo}" alt="Logo" style="
        height: 60px;
        width: auto;
        object-fit: contain;
      " />
      <h1 style="
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        color: #1f2937;
      ">${institution} - Answer Key</h1>
    </div>
  ` : `
    <div class="header" style="
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e5e7eb;
    ">
      <h1 style="
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        color: #1f2937;
      ">${institution} - Answer Key</h1>
      <p style="
        margin: 8px 0 0 0;
        font-size: 16px;
        color: #6b7280;
      ">Complete Answer Key</p>
    </div>
  `;

    // Generate watermark if logo provided
    const watermarkCSS = logo ? `
    body::before {
      content: '';
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 200px;
      height: 200px;
      background-image: url('${logo}');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      opacity: ${watermarkOpacity};
      pointer-events: none;
      z-index: -1;
    }
  ` : '';

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${institution} - Answer Key</title>
      <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
      <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
      <script>
        window.MathJax = {
          tex: {
            inlineMath: [['\\(', '\\)']],
            displayMath: [['\\[', '\\]']],
            processEscapes: true,
            processEnvironments: true
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
              });
            }
          }
        };
      </script>
      <style>
        * {
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: ${lineHeight};
          color: #1f2937;
          background-color: #ffffff;
          margin: 0;
          padding: ${margin}mm;
          font-size: ${fontSize}px;
        }
        
        @page {
          size: ${pageSize} ${orientation};
          margin: ${margin}mm;
        }
        
        .answer-item {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        /* Print styles */
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .answer-item {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
        
        /* MathJax inline math styles - Force inline display */
        .MathJax {
          display: inline !important;
          margin: 0 !important;
          padding: 0 !important;
          vertical-align: baseline !important;
        }
        
        .MathJax_Display {
          display: block !important;
          margin: 1em 0 !important;
        }
        
        /* Force all MathJax elements to be inline */
        .MathJax_Display > .MathJax {
          display: inline !important;
        }
        
        /* Specific rules for inline math */
        .MathJax[data-mathml] {
          display: inline !important;
        }
        
        /* Override any display: block that might be applied */
        .MathJax[style*="display: block"] {
          display: inline !important;
        }
        
        /* Ensure text elements containing MathJax are inline */
        .question-text .MathJax,
        .option .MathJax,
        .answer .MathJax {
          display: inline !important;
          vertical-align: baseline !important;
        }
        
        ${watermarkCSS}
      </style>
    </head>
    <body>
      ${headerHTML}
      <div class="answers-container">
        ${answersHTML}
      </div>
      
      <div class="footer" style="
        margin-top: 32px;
        padding-top: 16px;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        font-size: 12px;
        color: #6b7280;
      ">
        <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        <p>Total Questions: ${selectedQuestions.length}</p>
      </div>
      
      <script>
        // Ensure MathJax renders after the page loads
        if (window.MathJax && window.MathJax.typesetPromise) {
          window.MathJax.typesetPromise().then(() => {
            // Force all MathJax elements to be inline after rendering
            const mathElements = document.querySelectorAll('.MathJax');
            mathElements.forEach(el => {
              if (el instanceof HTMLElement) {
                el.style.display = 'inline';
                el.style.verticalAlign = 'baseline';
                el.style.margin = '0';
                el.style.padding = '0';
              }
            });
          });
        } else {
          // Wait for MathJax to load
          const checkMathJax = () => {
            if (window.MathJax && window.MathJax.typesetPromise) {
              window.MathJax.typesetPromise().then(() => {
                // Force all MathJax elements to be inline after rendering
                const mathElements = document.querySelectorAll('.MathJax');
                mathElements.forEach(el => {
                  if (el instanceof HTMLElement) {
                    el.style.display = 'inline';
                    el.style.verticalAlign = 'baseline';
                    el.style.margin = '0';
                    el.style.padding = '0';
                  }
                });
              });
            } else {
              setTimeout(checkMathJax, 100);
            }
          };
          checkMathJax();
        }
      </script>
    </body>
    </html>
  `;
} 
