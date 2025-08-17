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

export function questionToHTML(question: Question, index: number, options: QuestionToHTMLOptions = {}): string {
    const {
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
      <div class="option" style="background-color: #ffffff; border-radius: 0 6px 6px 0; display: flex; align-items: flex-start;">
        <div style="flex: 1; display: inline;">${optionText}</div>
      </div>`;
        return `
      <div class="option ${isCorrect ? 'correct' : ''}" style="padding: 4px 12px; margin: 4px 0; border-left: 4px solid ${isCorrect ? '#10b981' : '#e5e7eb'}; background-color: ${isCorrect ? '#f0fdf4' : '#ffffff'}; border-radius: 0 6px 6px 0; display: flex; align-items: flex-start;">
        <strong style="font-weight: 500; margin-right: 8px; flex-shrink: 0;">${optionLetter}.</strong>
        <div style="flex: 1; display: inline;">${optionText}</div>
      </div>`;
    }).join('');

    // Render answer with LaTeX
  //   const answerHTML = includeAnswers ? `
  //   <div class="answer" style="
  //     margin-top: 12px;
  //     padding: 8px 12px;
  //     background-color: #f0fdf4;
  //     border: 1px solid #10b981;
  //     border-radius: 6px;
  //     color: #065f46;
  //     display: flex;
  //     align-items: flex-start;
  //   ">
  //     <strong style="font-weight: 600; margin-right: 8px; flex-shrink: 0;">Answer:</strong>
  //     <div style="flex: 1; display: inline;">${textToHtmlWithLatex(question.answer)}</div>
  //   </div>
  // ` : '';

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
      background-color: #ffffff;
      page-break-inside: avoid;
    ">
      <div class="question-header" style="
        margin-bottom: 12px;
        display: flex;
        align-items: flex-start;
      ">
        <span class="question-number" style="
          color: black;
          font-weight: 600;
          font-size: 14px;
          width: 24px;
          height: 24px;
          text-align: center;
          flex-shrink: 0;
        ">${questionNumber}.</span>
        <span class="question-text" style="
          margin: 0;
          color: #000000;
          flex: 1;
        ">${questionText}</span>
      </div>
      ${questionImageHTML}
      <div class="options" style="margin: 4px 0 8px 24px;">
        ${optionsHTML}
      </div>
      
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
        pageSize = 'a4',
        orientation = 'portrait',
        fontSize = 14,
        lineHeight = 1.6,
        margin = 10,
    } = options;

    // WIP: add the config elements to the html
    const {
        selectedQuestions,
        logo,
        institution,
        marks,
        time,
        subject,
        exam,
        watermarkOpacity = 0
    } = config;


    // Generate questions HTML
    const questionsHTML = selectedQuestions.map((question, index) =>
        questionToHTML(question, index, { includeAnswers, includeMetadata, fontSize, lineHeight })
    ).join('');


    const headerHTML = `
  <div class="header-container" style="
    border: 2px solid #000;
    margin-bottom: 0;
  ">
    <div class="header-row" style="
      display: flex;
      align-items: center;
      justify-content: center;        /* center the middle block */
      position: relative;              /* anchor absolute logo */
      padding: 8px 12px;
      border-bottom: 1px solid #000;
      background-color: #fff;
      min-height: 80px;                /* ensures room for logo */
    ">
      ${logo ? `
        <div class="logo-section" style="
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%); /* vertically center logo */
          display: flex;
          flex-direction: column;
          align-items: center;
        ">
          <img src="${logo}" alt="Logo" style="
            height: 80px;
            width: 80px;
            object-fit: contain;
            border-radius: 50%;
          " />
        </div>
      ` : ''}

      <div class="institution-info" style="
        display: flex;
        flex-direction: column;
        align-items: center;    /* center content */
        text-align: center;     /* center text */
        gap: 6px;
      ">
        <h1 style="
          margin: 0;
          font-size: 20px;
          font-weight: bold;
          letter-spacing: 2px;
          text-transform: uppercase;
        ">${institution}</h1>

        <div style="
          display: flex;
          align-items: center;
          justify-content: center;  /* keeps exam tag centered */
        ">
          <div style="
            border: 1px solid #000;
            padding: 2px 20px;
            background-color: #f0f0f0;
          ">${exam}</div>
        </div>
      </div>
    </div>

    <div class="class-details" style="
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 12px;
      font-size: 11px;
      font-weight: bold;
      background-color: #fff;
    ">
      <div>Time: ${time}</div>
      <div class="exam-details" style="
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        font-size: 10px;
        font-weight: bold;
      ">
        <div>Sub: ${subject}</div>
        <div>Marks: ${marks}</div>
      </div>
    </div>
  </div>
`;


    // Section header for question type
    const sectionHeaderHTML = `
    <div class="section-header" style="
      background-color: #000;
      color: #fff;
      text-align: center;
      padding: 8px;
      margin: 0;
      font-weight: bold;
      font-size: 14px;
      letter-spacing: 1px;
    ">
      Multiple Choice Questions
    </div>
  `;

    // Subject header
    const subjectHeaderHTML = `
    <div class="subject-header" style="
      text-align: center;
      margin: 20px 0 15px 0;
      font-size: 16px;
      font-weight: bold;
      text-decoration: underline;
      letter-spacing: 1px;
    ">
      ${subject?.toUpperCase()}
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
      <title>${institution} - ${exam}</title>

      <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>

      <style>
        * {
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Times New Roman', serif;
          line-height: ${lineHeight};
          background-color: #ffffff;
          margin: 0;
          padding: ${margin}mm;
          font-size: ${fontSize}px;
          color: #000;
        }
        
        @page {
          size: ${pageSize} ${orientation};
          margin: ${margin}mm;
        }

        /* Question styles */
        .question-block {
          margin-bottom: 15px;
          page-break-inside: avoid;
        }

        .question-number {
          font-weight: bold;
          margin-right: 8px;
        }

        .question-content {
          margin-left: 20px;
          margin-bottom: 8px;
        }

        .options {
          margin-left: 20px;
        }

        .option {
          margin: 2px 0;
          display: flex;
          align-items: flex-start;
        }

        .option-letter {
          margin-right: 8px;
          font-weight: bold;
          min-width: 20px;
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

        /* Ensure MathJax-rendered elements are not bold */
        mjx-container, mjx-math, mjx-mrow, mjx-mi, mjx-mn, mjx-mo {
          font-weight: normal !important;
        }

        /* Print-specific styles */
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
      ${sectionHeaderHTML}
      ${subjectHeaderHTML}
      
      <div class="questions-container">
        ${questionsHTML}
      </div>
      
      <div class="footer" style="
        margin-top: 32px;
        padding-top: 16px;
        border-top: 1px solid #000;
        text-align: center;
        font-size: 10px;
        color: #666;
      ">
        <p>Page | 1</p>
      </div>
      
    </body>
    </html>
  `;

}

export function pdfConfigToAnswerKeyHTML(config: PDFConfig, options: QuestionToHTMLOptions = {}): string {
    const {
        pageSize = 'a4',
        orientation = 'portrait',
        fontSize = 14,
        lineHeight = 1.6,
        margin = 10
    } = options;

    // WIP: add the config elements to the html
    const {
        selectedQuestions,
        logo,
        institution,
        exam,
        watermarkOpacity = 0.1
    } = config;

    // Generate answers HTML
    const answersHTML = selectedQuestions.map((question, index) => {
        const questionNumber = index + 1;
        const answerText = textToHtmlWithLatex(question.answer);

        return `
      <div class="answer-item" style="
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        gap: 12px;
        margin: 8px 0;
      ">
        <span class="question-number" style="
          color: black;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 14px;
          text-align: center;
        ">${questionNumber}.</span>
        <div class="answer-content">
          <div class="answer-text" style="
            font-size: ${fontSize}px;
            font-weight: 600;
            color: black;
          ">${answerText}</div>
        </div>
      </div>
    `;
    }).join('');

    // Generate header with logo if provided
    const headerHTML = `
    <div class="header-container" style="
      border: 2px solid #000;
      margin-bottom: 0;
    ">
      <div class="header-row" style="
        display: flex;
        align-items: center;
        justify-content: center;        /* center the middle block */
        position: relative;              /* anchor absolute logo */
        padding: 8px 12px;
        border-bottom: 1px solid #000;
        background-color: #fff;
        min-height: 80px;                /* ensures room for logo */
      ">
        ${logo ? `
          <div class="logo-section" style="
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%); /* vertically center logo */
            display: flex;
            flex-direction: column;
            align-items: center;
          ">
            <img src="${logo}" alt="Logo" style="
              height: 80px;
              width: 80px;
              object-fit: contain;
              border-radius: 50%;
            " />
          </div>
        ` : ''}
  
        <div class="institution-info" style="
          display: flex;
          flex-direction: column;
          align-items: center;    /* center content */
          text-align: center;     /* center text */
          gap: 6px;
        ">
          <h1 style="
            margin: 0;
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 2px;
            text-transform: uppercase;
          ">${institution}</h1>
  
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;  /* keeps exam tag centered */
          ">
            <div style="
              border: 1px solid #000;
              padding: 2px 20px;
              background-color: #f0f0f0;
            ">${exam}</div>
          </div>
        </div>
      </div>
  
    </div>
  `;

  const sectionHeaderHTML = `
    <div class="section-header" style="
      background-color: #000;
      color: #fff;
      text-align: center;
      padding: 8px;
      margin: 0;
      font-weight: bold;
      font-size: 14px;
      letter-spacing: 1px;
    ">
      Answer Key
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
      
      <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
      
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

        /* MathJax styles for LaTeX rendering */
        .math-inline {
          display: inline;
          font-weight: normal;
        }
        .math-display {
          display: block;
          text-align: left;
          margin: 10px 0;
          font-weight: normal;
        }

        /* Ensure MathJax-rendered elements are not bold in HTML and PDF */
        mjx-container, mjx-math, mjx-mrow, mjx-mi, mjx-mn, mjx-mo {
          font-weight: normal !important;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          mjx-container, mjx-math, mjx-mrow, mjx-mi, mjx-mn, mjx-mo {
            font-weight: normal !important;
          }
          .math-display {
            text-align: left;
          }
        }
        
        ${watermarkCSS}
      </style>
    </head>
    <body>
      ${headerHTML}
      ${sectionHeaderHTML}
      <div class="answers-container">
        ${answersHTML}
      </div>
    </body>
    </html>
  `;
}
