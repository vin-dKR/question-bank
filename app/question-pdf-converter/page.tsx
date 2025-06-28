'use client';

import { useState } from 'react';
import QuestionPDFConverter from '@/components/QuestionPDFConverter';

export default function QuestionPDFConverterPage() {
  // Sample questions with LaTeX content
  const sampleQuestions: Question[] = [
    {
      id: '1',
      question_number: 1,
      question_text: 'What is the value of \\(x\\) in the equation \\(2x + 5 = 13\\)?',
      options: [
        'x = 3',
        'x = 4', 
        'x = 5',
        'x = 6'
      ],
      answer: 'B',
      exam_name: 'Sample Exam',
      subject: 'Mathematics',
      chapter: 'Algebra',
      section_name: 'Linear Equations',
      isQuestionImage: false,
      isOptionImage: false,
      option_images: [],
      flagged: false
    },
    {
      id: '2',
      question_number: 2,
      question_text: 'Solve the quadratic equation: \\(x^2 - 4x + 4 = 0\\)',
      options: [
        'x = 2',
        'x = -2',
        'x = 2 or x = -2',
        'x = 2 (double root)'
      ],
      answer: 'D',
      exam_name: 'Sample Exam',
      subject: 'Mathematics',
      chapter: 'Algebra',
      section_name: 'Quadratic Equations',
      isQuestionImage: false,
      isOptionImage: false,
      option_images: [],
      flagged: false
    },
    {
      id: '3',
      question_number: 3,
      question_text: 'What is the derivative of \\(f(x) = x^3 + 2x^2 - 5x + 1\\)?',
      options: [
        '\\(f\'(x) = 3x^2 + 4x - 5\\)',
        '\\(f\'(x) = 3x^2 + 2x - 5\\)',
        '\\(f\'(x) = x^2 + 4x - 5\\)',
        '\\(f\'(x) = 3x^2 + 4x + 1\\)'
      ],
      answer: 'A',
      exam_name: 'Sample Exam',
      subject: 'Mathematics',
      chapter: 'Calculus',
      section_name: 'Differentiation',
      isQuestionImage: false,
      isOptionImage: false,
      option_images: [],
      flagged: false
    },
    {
      id: '4',
      question_number: 4,
      question_text: 'Find the area under the curve \\(y = x^2\\) from \\(x = 0\\) to \\(x = 2\\)',
      options: [
        '\\(\\frac{8}{3}\\)',
        '\\(\\frac{4}{3}\\)',
        '\\(\\frac{16}{3}\\)',
        '\\(\\frac{2}{3}\\)'
      ],
      answer: 'A',
      exam_name: 'Sample Exam',
      subject: 'Mathematics',
      chapter: 'Calculus',
      section_name: 'Integration',
      isQuestionImage: false,
      isOptionImage: false,
      option_images: [],
      flagged: false
    },
    {
      id: '5',
      question_number: 5,
      question_text: 'What is the value of \\(\\sin(30°)\\)?',
      options: [
        '\\(\\frac{1}{2}\\)',
        '\\(\\frac{\\sqrt{3}}{2}\\)',
        '\\(\\frac{1}{\\sqrt{2}}\\)',
        '\\(\\frac{\\sqrt{2}}{2}\\)'
      ],
      answer: 'A',
      exam_name: 'Sample Exam',
      subject: 'Mathematics',
      chapter: 'Trigonometry',
      section_name: 'Basic Trigonometry',
      isQuestionImage: false,
      isOptionImage: false,
      option_images: [],
      flagged: false
    }
  ];

  const [config, setConfig] = useState<PDFConfig>({
    institution: 'Sample University',
    selectedQuestions: sampleQuestions,
    options: {
      includeAnswers: true,
      watermarkOpacity: 0.1,
      logo: null
    }
  });

  const [includeAnswers, setIncludeAnswers] = useState(true);

  const handleToggleAnswers = () => {
    setIncludeAnswers(!includeAnswers);
    setConfig(prev => ({
      ...prev,
      options: {
        ...prev.options,
        includeAnswers: !includeAnswers
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Question Paper PDF Converter
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto mb-4">
            Convert your question bank to PDF with proper LaTeX rendering. 
            This tool extracts questions, options, and answers from your PDF config 
            and converts them to beautiful HTML with MathJax LaTeX support.
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAnswers}
                onChange={handleToggleAnswers}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Include Answers</span>
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Features</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Proper LaTeX equation rendering using MathJax</li>
              <li>• No PNG conversion - LaTeX stays as vector graphics</li>
              <li>• Beautiful HTML formatting with correct styling</li>
              <li>• Preview before converting to PDF</li>
              <li>• Separate question paper and answer key generation</li>
              <li>• Customizable page size, orientation, and styling</li>
            </ul>
          </div>
        </div>
        
        <QuestionPDFConverter config={config} />
      </div>
    </div>
  );
} 