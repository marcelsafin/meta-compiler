import React, { useState, useCallback } from 'react';
import { generateContent, refineProjectIdea, generateTechStack } from './services/geminiService';
import { GenerationType } from './types';
import Button from './components/Button';
import OutputDisplay from './components/OutputDisplay';

const App: React.FC = () => {
  const [projectIdea, setProjectIdea] = useState<string>('');
  const [output, setOutput] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, 'pending' | 'done'>>({});

  const handleGenerateAll = useCallback(async () => {
    if (!projectIdea) {
      setError('Please enter a project idea.');
      return;
    }
    setIsLoading(true);
    setOutput(null);
    setError(null);
    
    const initialProgress: Record<string, 'pending' | 'done'> = {
        [GenerationType.DESCRIPTION]: 'pending',
        [GenerationType.DIAGRAM]: 'pending',
        [GenerationType.SCRIPT]: 'pending',
        [GenerationType.SOCIAL]: 'pending',
    };
    setProgress(initialProgress);

    try {
        setLoadingMessage('Analyzing project idea and proposing tech stack...');
        const techStack = await generateTechStack(projectIdea);
        
        // Check if techStack generation failed
        if (typeof techStack === 'string' && techStack.startsWith('An error occurred')) {
            throw new Error(techStack);
        }

        setLoadingMessage('Generating all assets...');

        const types: GenerationType[] = [
          GenerationType.DESCRIPTION, 
          GenerationType.DIAGRAM, 
          GenerationType.SCRIPT, 
          GenerationType.SOCIAL
        ];
        
        const promises = types.map(type => 
            generateContent(projectIdea, type, techStack as Record<string, any>)
                .then(result => {
                    if (result.startsWith('An error occurred')) {
                        return Promise.reject(new Error(result));
                    }
                    setProgress(currentProgress => ({ ...currentProgress, [type]: 'done' }));
                    return { type, result };
                })
        );

        const settledResults = await Promise.allSettled(promises);
        
        const finalOutput: Record<string, string> = {};
        let firstError: string | null = null;

        settledResults.forEach((item) => {
            if (item.status === 'fulfilled') {
                finalOutput[item.value.type] = item.value.result;
            } else {
                if (!firstError) {
                    firstError = item.reason instanceof Error ? item.reason.message : "An unknown error occurred.";
                }
            }
        });
        
        if (firstError) {
            setError(firstError);
            setOutput(null);
        } else {
            setOutput(finalOutput);
        }

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during setup.";
        setError(`Failed to generate: ${errorMessage}`);
        setOutput(null);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [projectIdea]);

  const handleRefine = useCallback(async () => {
    if (!projectIdea) return;
    setIsRefining(true);
    setError(null);
    const refinedText = await refineProjectIdea(projectIdea);

    if (refinedText.startsWith('An error occurred')) {
        setError(refinedText);
    } else {
        setProjectIdea(refinedText);
    }
    setIsRefining(false);
  }, [projectIdea]);
  
  const IconMagic = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v1a1 1 0 002 0V4a1 1 0 00-1-1zM5 10a1 1 0 011-1h1a1 1 0 110 2H6a1 1 0 01-1-1zM10 15a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM10 5a1 1 0 00-1 1v1a1 1 0 102 0V6a1 1 0 00-1-1zM3 10a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1zM15 10a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM10 13a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1zM7 10a1 1 0 011-1h1a1 1 0 110 2H8a1 1 0 01-1-1zM13 10a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1z" clipRule="evenodd" /><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 7a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm6 0a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" /></svg>;
  const IconRefine = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1.172a2 2 0 00.586 1.414l2.828 2.828a2 2 0 002.828 0l8.486-8.485a1 1 0 00-1.414-1.414L10 8.586 6.414 5H5V2zm11.293 8.293a1 1 0 00-1.414 0L10 14.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l6-6a1 1 0 000-1.414zM4 10a1 1 0 011-1h1.414l-1.707-1.707a1 1 0 010-1.414L5.414 5H7a1 1 0 010 2H6.414l2.293 2.293a1 1 0 010 1.414L5 14.414V16a1 1 0 01-1-1v-6z" clipRule="evenodd" /></svg>;
  const IconSpinner = () => <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            The Meta-Compiler
          </h1>
          <p className="mt-2 text-lg text-gray-400">Generate everything you need for your hackathon project.</p>
        </header>

        <main className="bg-gray-800/50 p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-700">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="projectIdea" className="block text-sm font-medium text-gray-300">
                  Project Idea
                </label>
                <button 
                  onClick={handleRefine}
                  disabled={!projectIdea || isRefining || isLoading}
                  className="flex items-center px-3 py-1 text-sm font-semibold text-indigo-300 bg-indigo-900/50 rounded-md hover:bg-indigo-900 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isRefining ? <IconSpinner /> : <IconRefine />}
                  <span className="ml-2">{isRefining ? 'Refining...' : 'Refine with AI'}</span>
                </button>
              </div>
              <textarea
                id="projectIdea"
                value={projectIdea}
                onChange={(e) => setProjectIdea(e.target.value)}
                rows={5}
                placeholder="Describe your idea in as much detail as possible, or just add some keywords and click 'Refine with AI'..."
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>
          
          <div className="mt-8 border-t border-gray-700 pt-8">
             <Button onClick={handleGenerateAll} disabled={isLoading || isRefining || !projectIdea} icon={<IconMagic/>}>
                {isLoading ? loadingMessage : 'Generate All Assets'}
            </Button>
          </div>
        
          <OutputDisplay output={output} isLoading={isLoading} error={error} progress={progress} />
        </main>

        <footer className="text-center mt-10 text-gray-500 text-sm">
          <p>Powered by the Gemini API on Google Cloud Run.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
