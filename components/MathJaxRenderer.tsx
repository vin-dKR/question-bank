// MathJaxRendererWithPdf.tsx
import React, { useRef, useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface MathJaxRendererProps {
  latex: string;
  displayMode?: boolean;
}

const MathJaxRendererWithPdf: React.FC<MathJaxRendererProps> = ({
  latex,
  displayMode = false,
}) => {
  const [svg, setSvg] = useState<string>('');
  const svgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const convertLatexToSvg = async () => {
      if (!window.MathJax) return;
      const options = { display: displayMode, em: 12, ex: 6 };
      const wrapper = window.MathJax.tex2svg(latex, options);
      const svgElement = wrapper.querySelector('svg');
      if (svgElement) {
        svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        setSvg(svgElement.outerHTML);
      }
    };
    convertLatexToSvg();
  }, [latex, displayMode]);

  const handlePreviewPdf = async () => {
    if (!svgContainerRef.current) return;
    const canvas = await html2canvas(svgContainerRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('formula.pdf');
  };

  return (
    <div>
      <div ref={svgContainerRef} style={{ display: 'inline-block' }} dangerouslySetInnerHTML={{ __html: svg }} />
      <button onClick={handlePreviewPdf} style={{ marginTop: 16 }}>
        Preview PDF
      </button>
    </div>
  );
};

export default MathJaxRendererWithPdf;
