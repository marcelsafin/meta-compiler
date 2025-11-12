import React, { useState } from 'react';
import { GenerationType } from '../types';
import MermaidDiagram from './MermaidDiagram';

interface OutputDisplayProps {
  output: Record<string, string> | null;
  isLoading: boolean;
  error: string | null;
  progress: Record<string, 'pending' | 'done'>;
}

// Icons - Cleaned up and modernized
const IconTechStack = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" /></svg>;
const IconDescription = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const IconDiagram = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" /></svg>;
const IconScript = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" /></svg>;
const IconSocial = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.186 2.25 2.25 0 00-3.933 2.186z" /></svg>;
const IconCheck = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconCopy = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>;
const IconDownload = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const IconSpinner = () => <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

const OUTPUT_ORDER: [GenerationType, string, React.ReactNode][] = [
    [GenerationType.TECH_STACK, 'Technical Architecture', <IconTechStack/>],
    [GenerationType.DESCRIPTION, 'Description', <IconDescription/>],
    [GenerationType.DIAGRAM, 'Diagram', <IconDiagram/>],
    [GenerationType.SCRIPT, 'Script', <IconScript/>],
    [GenerationType.SOCIAL, 'Social Post', <IconSocial/>],
];

const formatTechStack = (jsonString: string): string => {
    try {
        const data = JSON.parse(jsonString);
        let formatted = '';

        const formatSection = (title: string, content: any) => {
            if (!content) return '';
            let section = `### ${title}\n`;
            if (content.technology) {
                section += `**Technology:** ${content.technology}\n`;
            }
            if (content.description) {
                section += `**Description:** ${content.description}\n`;
            }
            return section + '\n';
        };

        if (data.frontend) formatted += formatSection('Frontend', data.frontend);
        if (data.backend) formatted += formatSection('Backend', data.backend);
        if (data.database) formatted += formatSection('Database', data.database);
        if (data.authentication) formatted += formatSection('Authentication', data.authentication);

        if (data.other_services && data.other_services.length > 0) {
            formatted += '### Other Services & APIs\n';
            data.other_services.forEach((service: any) => {
                if (service.name) {
                    formatted += `- **${service.name}:** ${service.description || 'No description provided.'}\n`;
                }
            });
        }

        return formatted.trim().replace(/###/g, '').replace(/\*\*/g, ''); // Simple formatting for <pre>
    } catch (error) {
        console.error("Failed to parse or format tech stack JSON:", error);
        return "Could not display the technical architecture. Please check the raw JSON.";
    }
};

const CopyButton: React.FC<{ textToCopy: string, label: string }> = ({ textToCopy, label }) => {
    const [isCopied, setIsCopied] = useState(false);
  
    const handleCopy = async () => {
      if (!navigator.clipboard) {
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
        <span className="ml-2">{isCopied ? 'Copied!' : label}</span>
      </button>
    );
};

const DownloadButton: React.FC<{ onDownload: () => void, disabled: boolean }> = ({ onDownload, disabled }) => {
    return (
        <button
            onClick={onDownload}
            disabled={disabled}
            className="flex items-center px-3 py-1 text-sm font-semibold text-gray-300 bg-gray-700/50 rounded-md hover:bg-gray-600/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <IconDownload />
            <span className="ml-2">Download</span>
        </button>
    );
};


const OutputDisplay: React.FC<OutputDisplayProps> = ({ output, isLoading, error, progress }) => {
    const [diagramSvg, setDiagramSvg] = useState<string>('');
    
    const handleDownloadSvg = () => {
        if (!diagramSvg) return;
        const blob = new Blob([diagramSvg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

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
            {OUTPUT_ORDER.map(([type, title, icon]) => {
                const rawContent = output[type] || '';
                
                if (!rawContent) return null;

                const formattedTechStack = type === GenerationType.TECH_STACK ? formatTechStack(rawContent) : '';

                return (
                    <div key={type} className="bg-gray-800 border border-gray-700 rounded-lg shadow-inner">
                        <div className="flex items-center justify-between text-lg font-semibold text-gray-200 p-4 border-b border-gray-700">
                            <h3 className="flex items-center">
                                {icon}
                                <span className="ml-3">{title}</span>
                            </h3>
                            <div className="flex items-center space-x-2">
                               {type === GenerationType.TECH_STACK ? (
                                    <>
                                        <CopyButton textToCopy={formattedTechStack} label="Copy Text" />
                                        <CopyButton textToCopy={rawContent} label="Copy JSON" />
                                    </>
                                ) : (
                                    <CopyButton
                                        textToCopy={rawContent}
                                        label={
                                            type === GenerationType.DESCRIPTION || type === GenerationType.SCRIPT || type === GenerationType.SOCIAL
                                            ? 'Copy Text'
                                            : 'Copy Code'
                                        }
                                    />
                                )}
                                {type === GenerationType.DIAGRAM && (
                                    <DownloadButton onDownload={handleDownloadSvg} disabled={!diagramSvg} />
                                )}
                            </div>
                        </div>
                        <div className="p-4 overflow-x-auto">
                           {type === GenerationType.DIAGRAM ? (
                              <MermaidDiagram chart={rawContent} onSvgRendered={setDiagramSvg} />
                           ) : type === GenerationType.TECH_STACK ? (
                              <pre className="whitespace-pre-wrap font-sans text-gray-300">{formattedTechStack}</pre>
                           ) : (
                              <pre className="whitespace-pre-wrap font-sans text-gray-300">{rawContent}</pre>
                           )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default OutputDisplay;