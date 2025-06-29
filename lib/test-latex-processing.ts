// Test LaTeX processing with the example question
export function testLatexProcessing() {
  const testQuestion = {
    question_text: "energy Q is released. Then:",
    options: [
      "(A)\\(Q = 2E1 - E2\\)",
      "(B)\\(Q = E2 - 2E1\\)", 
      "(C)\\(Q = 2E1 + E2\\)",
      "(D)\\(Q = 2E2 + E1\\)"
    ],
    answer: "(A)\\(Q = 2E1 - E2\\)"
  };

  console.log('=== Testing LaTeX Processing ===');
  console.log('Original question text:', testQuestion.question_text);
  console.log('Original options:', testQuestion.options);
  console.log('Original answer:', testQuestion.answer);
  
  // Import the function (this would be done in the actual implementation)
  // const { textToHtmlWithLatex } = require('./questionToHtmlUtils');
  
  console.log('\nExpected processed question text:');
  console.log('energy Q is released. Then:');
  
  console.log('\nExpected processed options:');
  console.log('(A)<span class="math-inline">\\(Q = 2E1 - E2\\)</span>');
  console.log('(B)<span class="math-inline">\\(Q = E2 - 2E1\\)</span>');
  console.log('(C)<span class="math-inline">\\(Q = 2E1 + E2\\)</span>');
  console.log('(D)<span class="math-inline">\\(Q = 2E2 + E1\\)</span>');
  
  console.log('\nExpected processed answer:');
  console.log('(A)<span class="math-inline">\\(Q = 2E1 - E2\\)</span>');
  
  console.log('\n=== Test Complete ===');
}

// Test different LaTeX formats
export function testDifferentLatexFormats() {
  console.log('=== Testing Different LaTeX Formats ===');
  
  const testCases = [
    {
      input: "The value is \\(x^2 + y^2 = z^2\\) and \\(x = 5\\)",
      expected: "The value is <span class=\"math-inline\">\\(x^2 + y^2 = z^2\\)</span> and <span class=\"math-inline\">\\(x = 5\\)</span>"
    },
    {
      input: "Calculate $\\frac{1}{2} + \\frac{1}{3}$ and $x = 5$",
      expected: "Calculate <span class=\"math-inline\">\\(\\frac{1}{2} + \\frac{1}{3}\\)</span> and <span class=\"math-inline\">\\(x = 5\\)</span>"
    },
    {
      input: "The equation is \\[x^2 + y^2 = z^2\\] and the solution is \\[x = \\sqrt{z^2 - y^2}\\]",
      expected: "The equation is <div class=\"math-display\">\\[x^2 + y^2 = z^2\\]</div> and the solution is <div class=\"math-display\">\\[x = \\sqrt{z^2 - y^2}\\]</div>"
    },
    {
      input: "(A)\\(Q = 2E1 - E2\\)",
      expected: "(A)<span class=\"math-inline\">\\(Q = 2E1 - E2\\)</span>"
    },
    {
      input: "(B)\\(Q = E2 - 2E1\\)",
      expected: "(B)<span class=\"math-inline\">\\(Q = E2 - 2E1\\)</span>"
    }
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\nTest Case ${index + 1}:`);
    console.log('Input:', testCase.input);
    console.log('Expected:', testCase.expected);
  });
}

// Test the specific user question format
export function testUserQuestionFormat() {
  console.log('=== Testing User Question Format ===');
  
  const userQuestion = {
    question_text: "The binding energies of nuclei X and Y are E1 and … one atom of Y and an energy Q is released. Then:",
    options: [
      "(A)\\(Q = 2E1 - E2\\)",
      "(B)\\(Q = E2 - 2E1\\)", 
      "(C)\\(Q = 2E1 + E2\\)",
      "(D)\\(Q = 2E2 + E1\\)"
    ],
    answer: "(A)\\(Q = 2E1 - E2\\)"
  };
  
  console.log('User Question:', userQuestion);
  console.log('\nThis should be processed to show LaTeX expressions properly in the PDF.');
  console.log('The format "(A)\\(Q = 2E1 - E2\\)" should become "(A)<span class="math-inline">\\(Q = 2E1 - E2\\)</span>"');
}

// Export test functions
export const LatexProcessingTests = {
  testLatexProcessing,
  testDifferentLatexFormats,
  testUserQuestionFormat
}; 