"use client"

import React, { useState } from 'react';
import MathJaxRenderer from '@/componenets/MathJaxRenderer';

const App: React.FC = () => {
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

export default App;
