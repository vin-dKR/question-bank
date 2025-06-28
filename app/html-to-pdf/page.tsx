import HTMLToPDFConverter from '@/components/HTMLToPDFConverter';

export default function HTMLToPDFPage() {
  const sampleHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333; text-align: center;">Sample HTML Document</h1>
      <p style="line-height: 1.6; color: #666;">
        This is a sample HTML document that demonstrates how to convert HTML content to PDF.
        You can include various HTML elements like:
      </p>
      <ul style="color: #666;">
        <li>Text formatting (bold, italic, etc.)</li>
        <li>Lists and tables</li>
        <li>Images and links</li>
        <li>Custom styling with CSS</li>
      </ul>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Math Example</h3>
        <p>Here's a mathematical expression: <strong>E = mc²</strong></p>
        <p>And a fraction: <strong>½ + ¼ = ¾</strong></p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #333; color: white;">
            <th style="padding: 10px; border: 1px solid #ddd;">Name</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Age</th>
            <th style="padding: 10px; border: 1px solid #ddd;">City</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">John Doe</td>
            <td style="padding: 10px; border: 1px solid #ddd;">30</td>
            <td style="padding: 10px; border: 1px solid #ddd;">New York</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 10px; border: 1px solid #ddd;">Jane Smith</td>
            <td style="padding: 10px; border: 1px solid #ddd;">25</td>
            <td style="padding: 10px; border: 1px solid #ddd;">Los Angeles</td>
          </tr>
        </tbody>
      </table>
      <p style="text-align: center; color: #999; font-size: 14px;">
        Generated on: ${new Date().toLocaleDateString()}
      </p>
    </div>
  `;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            HTML to PDF Converter
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Convert HTML content, elements, or URLs to PDF format. 
            This tool supports various page sizes, orientations, and quality settings.
          </p>
        </div>
        
        <HTMLToPDFConverter defaultHTML={sampleHTML} />
      </div>
    </div>
  );
} 