import React, { useEffect, useState } from 'react';

// Make mermaid available on the window object
declare global {
    interface Window {
        mermaid: any;
    }
}

interface MermaidDiagramProps {
  chart: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const [id] = useState(`mermaid-diagram-${Math.random().toString(36).substr(2, 9)}`);
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (chart && window.mermaid) {
        window.mermaid.initialize({ startOnLoad: false, theme: 'dark' });
        
        const renderDiagram = async () => {
            try {
                // The render function needs a valid ID and the chart definition
                const { svg } = await window.mermaid.render(id, chart);
                setSvgContent(svg);
                setError('');
            } catch (e: any) {
                console.error("Mermaid rendering error:", e);
                setError('Could not render diagram. The generated code might be invalid.');
                setSvgContent('');
            }
        };

        renderDiagram();
    }
  }, [chart, id]);

  if (error) {
    return (
        <div>
            <p className="text-red-400 mb-2">{error}</p>
            <pre className="whitespace-pre-wrap font-sans text-gray-300 bg-gray-900 p-2 rounded">{chart}</pre>
        </div>
    );
  }

  // A hidden div is needed for mermaid to render into, even if we use the SVG directly
  return (
    <div>
        <div id={id} className="hidden">{chart}</div>
        <div dangerouslySetInnerHTML={{ __html: svgContent }} />
    </div>
  );
};

export default MermaidDiagram;
