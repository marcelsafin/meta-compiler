import React, { useState } from 'react';
import { GenerationType } from '../types';

interface OutputDisplayProps {
  output: Record<string, string> | null;
  isLoading: boolean;
  error: string | null;
  progress: Record<string, 'pending' | 'done'>;
}

// Icons
const IconDescription = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm2 1a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H7a1 1 0 01-1-1V5z" clipRule="evenodd" /></svg>;
const IconDiagram = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" /></svg>;
const IconScript = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 7a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>;
const IconSocial = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a4 4 0 00-3.32 1.536.5.5 0 00.82.528A3 3 0 0110 3a3 3 0 012.5 1.064.5.5 0 00.82-.528A4 4 0 0010 2zM6.68 3.536a.5.5 0 00-.82-.528A4 4 0 002 6.32V10a2 2 0 002 2h12a2 2 0 002-2V6.32a4 4 0 00-4.68-3.312.5.5 0 00-.82.528A3 3 0 0114 6.32V8a1 1 0 01-1 1H7a1 1 0 01-1-1V6.32a3 3 0 011.68-2.784zM16 14a1 1 0 100 2h-1.586l-1.707 1.707A1 1 0 0111 17.086V16H9v1.086a1 1 0 01-1.707.707L5.586 16H4a1 1 0 100 2h12z" /></svg>;
const IconCheck = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const IconCopy = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg>;
const IconSpinner = () => <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-gray-400"></div>;

const OUTPUT_ORDER: [GenerationType, string, React.ReactNode][] = [
    [GenerationType.DESCRIPTION, 'Description', <IconDescription/>],
    [GenerationType.DIAGRAM, 'Diagram', <IconDiagram/>],
    [GenerationType.SCRIPT, 'Manus', <IconScript/>],
    [GenerationType.SOCIAL, 'Social Post', <IconSocial/>],
];

const renderSectionContent = (type: GenerationType, content: string) => {
    if (type === GenerationType.DIAGRAM && content.trim().startsWith('```mermaid')) {
        return (
            <div>
                <div className="p-3 mb-3 text-sm text-blue-300 bg-blue-900/50 rounded-lg">
                    <p><span className="font-bold">Tip:</span> Copy the code below and paste it into a Mermaid.js editor (e.g., mermaid.live) to see the diagram.</p>
                </div>
                <pre className="p-4 bg-gray-950 rounded-md overflow-x-auto"><code className="language-mermaid whitespace-pre-wrap font-mono">{content}</code></pre>
            </div>
        );
    }
    return <pre className="whitespace-pre-wrap font-sans text-gray-300">{content}</pre>;
};

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
    const [isCopied, setIsCopied] = useState(false);
  
    const handleCopy = async () => {
      if (!navigator.clipboard) {
        // Fallback for older browsers
        console.error('Clipboard API not available');
        return;
      }
      try {
        await navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    };
  
    return (
      <button 
        onClick={handleCopy}
        className="flex items-center px-3 py-1 text-sm font-semibold text-gray-300 bg-gray-700/50 rounded-md hover:bg-gray-600/50 transition-colors"
      >
        {isCopied ? <IconCheck /> : <IconCopy />}
        <span className="ml-2">{isCopied ? 'Copied!' : 'Copy'}</span>
      </button>
    );
};

const OutputDisplay: React.FC<OutputDisplayProps> = ({ output, isLoading, error, progress }) => {
    if (isLoading) {
      return (
        <div className="w-full mt-8 space-y-4">
          <h3 className="text-lg font-semibold text-gray-300 px-1">Generating Assets...</h3>
          {OUTPUT_ORDER.map(([type, title, icon]) => (
            <div key={type} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between transition-all duration-300">
              <div className="flex items-center text-gray-300">
                {icon}
                <span className="ml-3 font-medium">{title}</span>
              </div>
              <div className="transition-opacity duration-500">
                {progress[type] === 'done' ? <IconCheck /> : <IconSpinner />}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-full mt-8 p-4 text-red-300 bg-red-900/50 rounded-lg">
          <h3 className="font-bold">An error occurred</h3>
          <p>{error}</p>
        </div>
      );
    }
    
    if (!output) {
      return <div className="flex items-center justify-center min-h-[300px] text-gray-500 mt-8">The generated assets will be displayed here...</div>;
    }

    return (
        <div className="w-full mt-8 space-y-6">
            {OUTPUT_ORDER.map(([type, title, icon]) => (
                <div key={type} className="bg-gray-800 border border-gray-700 rounded-lg shadow-inner">
                    <div className="flex items-center justify-between text-lg font-semibold text-gray-200 p-4 border-b border-gray-700">
                      <h3 className="flex items-center">
                          {icon}
                          <span className="ml-3">{title}</span>
                      </h3>
                      <CopyButton textToCopy={output[type]} />
                    </div>
                    <div className="p-4">
                      {renderSectionContent(type, output[type])}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default OutputDisplay;
