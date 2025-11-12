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
        [GenerationType.TECH_STACK]: 'pending',
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
        
        setProgress(currentProgress => ({ ...currentProgress, [GenerationType.TECH_STACK]: 'done' }));

        const finalOutput: Record<string, string> = {
          [GenerationType.TECH_STACK]: JSON.stringify(techStack, null, 2)
        };

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
  
  const IconMagic = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 01-1.423-1.423L13.5 18.75l1.188-.648a2.25 2.25 0 011.423-1.423L17.25 15l.648 1.188a2.25 2.25 0 011.423 1.423L20.25 18.75l-1.188.648a2.25 2.25 0 01-1.423 1.423z" /></svg>;
  const IconRefine = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 01-1.423-1.423L13.5 18.75l1.188-.648a2.25 2.25 0 011.423-1.423L17.25 15l.648 1.188a2.25 2.25 0 011.423 1.423L20.25 18.75l-1.188.648a2.25 2.25 0 01-1.423 1.423z" /></svg>;
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