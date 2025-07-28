/**
 * Convert text with LaTeX to HTML string for PDF generation
 * This function converts \(...\) to proper MathJax syntax
 */
function textToHtmlWithLatex(text: string): string {
    if (!text) return '';

    // First, escape HTML entities
    let processed = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    // Replace all newlines and carriage returns with a single space
    processed = processed.replace(/[\n\r]+/g, ' ');

    // Now process LaTeX
    processed = processed.replace(/\\\(([^)]+)\\\)/g, (match, latex) => {
        return `<span class="math-inline">\\(${latex.trim()}\\)</span>`;
    });
    processed = processed.replace(/\\\[([^\]]+)\\\]/g, (match, latex) => {
        return `<div class="math-display">\\[${latex.trim()}\\]</div>`;
    });
    processed = processed.replace(/\$([^$]+)\$/g, (match, latex) => {
        return `<span class="math-inline">\\(${latex.trim()}\\)</span>`;
    });
    processed = processed.replace(/\$\$([^$]+)\$\$/g, (match, latex) => {
        return `<div class="math-display">\\[${latex.trim()}\\]</div>`;
    });

    // Handle special case where LaTeX is embedded in option text like "(A)\\(Q = 2E1 - E2\\)"
    processed = processed.replace(/(\([A-D]\))\\\(([^)]+)\\\)/g, (match, optionLetter, latex) => {
        return `${optionLetter}<span class="math-inline">\\(${latex.trim()}\\)</span>`;
    });

    // Do NOT collapse spaces globally!
    return processed.trim();
}

/**
 * Convert a single question to HTML with LaTeX rendering
 */
export function questionToHTML(question: Question, index: number, options: QuestionToHTMLOptions = {}): string {
    const {
        includeAnswers = true,
        includeMetadata = true,
    } = options;

    const questionNumber = index + 1;
    const questionText = textToHtmlWithLatex(question.question_text);
    console.log("Question text", questionText)

    // Render question image if present
    const questionImageHTML = question.question_image ? `
        <div class="question-image" style="
            margin-top: 12px;
            max-width: 100%;
            display: flex;
            justify-content: center;
        ">
            <img src="${question.question_image}" alt="Question Image" style="
                max-width: 100%;
                height: 140px;
                border-radius: 6px;
            ">
        </div>
    ` : '';

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
      <div class="option ${isCorrect ? 'correct' : ''}" style="padding: 4px 12px; margin: 4px 0; border-left: 4px solid ${isCorrect ? '#10b981' : '#e5e7eb'}; background-color: ${isCorrect ? '#f0fdf4' : '#ffffff'}; border-radius: 0 6px 6px 0; display: flex; align-items: flex-start;">
        <strong style="font-weight: 500; margin-right: 8px; flex-shrink: 0;">${optionLetter}.</strong>
        <div style="flex: 1; display: inline;">${optionText}</div>
      </div>`;
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
      display: flex;
      align-items: flex-start;
    ">
      <strong style="font-weight: 600; margin-right: 8px; flex-shrink: 0;">Answer:</strong>
      <div style="flex: 1; display: inline;">${textToHtmlWithLatex(question.answer)}</div>
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
        align-items: flex-start;
        gap: 8px;
      ">
        <span class="question-number" style="
          background-color: #3b82f6;
          color: white;
          border-radius: 4px;
          font-weight: 600;
          font-size: 14px;
          width: 24px;
          height: 24px;
          text-align: center;
          line-height: 1;
        ">${questionNumber}</span>
        <span class="question-text" style="
          margin: -5px 0 0 0;
          color: #1f2937;
          flex: 1;
        ">${questionText}</span>
      </div>
      ${questionImageHTML}
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
        institution = 'XYZ Institution',
        logo,
        watermarkOpacity = 0.1,
        pageSize = 'a4',
        orientation = 'portrait',
        fontSize = 14,
        lineHeight = 1.6,
        margin = 10,
        testName = "Periodic Test - I",
        subject = "Physics",
        fullMarks = "100"
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
      padding: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background-color: #f9fafb;
    ">
      <img src="${logo}" alt="Institution Logo" style="
        height: 60px;
        width: auto;
        object-fit: contain;
      " />
      <div style="flex: 1;">
        <h1 style="
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
        ">${institution}</h1>
        <div style="
          margin: 4px 0 0 0;
          font-size: 16px;
          color: #6b7280;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
        ">${testName}
            <div> Subject: ${subject}</div>
            <div>Full Marks: ${fullMarks}</div>
        </div>
      </div>
    </div>
  ` : `
    <div class="header" style="
      text-align: center;
      margin-bottom: 24px;
      padding: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background-color: #f9fafb;
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
      ">${testName}</p>
        <div style="
          margin: 4px 0 0 0;
          font-size: 16px;
          color: #6b7280;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
        ">
            <div> Subject: ${subject}</div>
            <div>Full Marks: ${fullMarks}</div>
        </div>
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

      <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>

      <style>
        * {
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: ${lineHeight};
          background-color: #ffffff;
          margin: 0;
          padding: ${margin}mm;
          font-size: ${fontSize}px;
        }
        
        @page {
          size: ${pageSize} ${orientation};
          margin: ${margin}mm;
        }

        /* MathJax styles for LaTeX rendering */
        .math-inline {
          display: inline;
          font-weight: normal;
        }
        .math-display {
          display: block;
          text-align: center;
          margin: 10px 0;
          font-weight: normal;
        }

        /* Ensure MathJax-rendered elements are not bold in HTML and PDF */
        mjx-container, mjx-math, mjx-mrow, mjx-mi, mjx-mn, mjx-mo {
          font-weight: normal !important;
        }

        /* Print-specific styles to ensure consistent PDF rendering */
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          mjx-container, mjx-math, mjx-mrow, mjx-mi, mjx-mn, mjx-mo {
            font-weight: normal !important;
          }
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
        <p>Generated on: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}</p>
      </div>
      
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
        margin = 1
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
      
      <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-svg.js"></script>
      
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
        /* MathJax SVG output: no shadow DOM, so html2canvas can capture */
        /* .math-inline mjx-container {
          display: inline !important;
          vertical-align: -0.2em;
        }
        .math-display mjx-container {
          display: block !important;
          text-align: center;
          margin: 10px 0;
        } */
        /* Only minimal MathJax wrapper styles */
        .math-inline {
          display: inline;
        }
        .math-display {
          display: block;
          text-align: center;
          margin: 10px 0;
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
      
    </body>
    </html>
  `;
}
