"use client"

import React, { useState } from 'react';
import MathJaxRenderer from '@/components/MathJaxRenderer';

const TestPage: React.FC = () => {
  const [latexInput, setLatexInput] = useState<string>('E = mc^2');

  return (
    <div>
      <input
        type="text"
        value={latexInput}
        onChange={(e) => setLatexInput(e.target.value)}
        placeholder="Enter LaTeX formula"
      />

      <MathJaxRenderer
        latex={latexInput}
        displayMode={true}
      />
    </div>
  );
};

export default TestPage;
