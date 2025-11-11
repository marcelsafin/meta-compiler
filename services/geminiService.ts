import { GoogleGenAI, Type } from "@google/genai";
import { GenerationType } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const buildMasterPrompt = (projectIdea: string, generationType: GenerationType, techStack?: Record<string, any>): string => {
    let taskInstruction = '';
    
    const techStackContext = techStack 
        ? `
            For additional context, here is a proposed technical architecture for the project. Use this to inform your response.
            ---
            ${JSON.stringify(techStack, null, 2)}
            ---
        ` 
        : '';

    switch (generationType) {
        case GenerationType.DESCRIPTION:
            taskInstruction = `
                **Task: Generate a project description.**
                Act as an expert in writing engaging and clear project descriptions for a hackathon. The description should be concise, highlight the project's unique value, and be suitable for a jury. Focus on the problem, the solution, and the technology. Use markdown for formatting. Base the description on the project idea and the provided technical architecture.
            `;
            break;
        case GenerationType.DIAGRAM:
             taskInstruction = `
                **Task: Generate a Mermaid diagram.**
                Act as an expert in software architecture. Based on the project idea and technical architecture, generate a **syntactically correct** Mermaid flowchart diagram.
                - The diagram MUST be a flowchart (graph TD).
                - **Use subgraphs to logically group related components.** For example, create subgraphs for "User Interface", "Backend Services", "Database", "Authentication", and "External APIs".
                - Use clear and concise labels for nodes. Use syntax like A["Label for A"].
                - Show the data flow and interactions between components with arrows.
                - Wrap the final output in a single Mermaid code block.
                - Do NOT add any explanations or text outside of the final Mermaid code block. Your entire response should only be the code block.

                Example of subgraph usage:
                \`\`\`mermaid
                graph TD
                    subgraph "Client"
                        A["User"] --> B["React App"];
                    end
                    subgraph "Server"
                        B --> C["Node.js API"];
                        C --> D["PostgreSQL DB"];
                    end
                \`\`\`
            `;
            break;
        case GenerationType.SCRIPT:
            taskInstruction = `
                **Task: Generate a demo script.**
                Act as an expert in creating scripts for technical demonstrations. Write a short and impactful script for a 2-minute demo of the project. Include both what should be said and what is shown on the screen, referencing components from the technical architecture where appropriate. Structure it clearly, for example with "Speaker:" and "Visual:". Base the script on the project idea.
            `;
            break;
        case GenerationType.SOCIAL:
            taskInstruction = `
                **Task: Generate a social media post.**
                Act as a social media expert with a focus on tech. Write a short, enthusiastic post for a platform like X (Twitter) or LinkedIn to present the project. The post should be engaging, include relevant emojis, and end with the hashtag #CloudRunHackathon. Base the post on the project idea.
            `;
            break;
        default:
            throw new Error("Invalid generation type");
    }

    return `
        You are an expert assistant. Your goal is to help a user prepare their hackathon project.

        User's project idea:
        ---
        ${projectIdea}
        ---
        ${techStackContext}

        Based on all the information above, perform the following task:
        ${taskInstruction}
    `;
};

export const generateTechStack = async (projectIdea: string): Promise<Record<string, any> | string> => {
    try {
        const prompt = `
            You are a solution architect. Based on the following project idea, define a clear and concise technical stack. 
            Describe the components for frontend, backend, database, authentication, and any other key services or APIs.
            
            Project Idea: "${projectIdea}"
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        frontend: {
                            type: Type.OBJECT,
                            properties: {
                                technology: { type: Type.STRING, description: "e.g., React, Vue, Angular" },
                                description: { type: Type.STRING, description: "Briefly describe the frontend's role." }
                            }
                        },
                        backend: {
                            type: Type.OBJECT,
                            properties: {
                                technology: { type: Type.STRING, description: "e.g., Node.js with Express, Python with Flask, Go" },
                                description: { type: Type.STRING, description: "Briefly describe the backend's role and key responsibilities." }
                            }
                        },
                        database: {
                            type: Type.OBJECT,
                            properties: {
                                technology: { type: Type.STRING, description: "e.g., Firestore, PostgreSQL, MongoDB" },
                                description: { type: Type.STRING, description: "Describe the data it stores." }
                            }
                        },
                        authentication: {
                            type: Type.OBJECT,
                            properties: {
                                technology: { type: Type.STRING, description: "e.g., Firebase Authentication, Auth0, JWT" },
                                description: { type: Type.STRING, description: "Describe the authentication flow." }
                            }
                        },
                        other_services: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING, description: "Name of the service or API" },
                                    description: { type: Type.STRING, description: "What the service is used for." }
                                }
                            }
                        }
                    }
                }
            }
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error(`Error calling Gemini API for tech stack generation:`, error);
        if (error instanceof Error) {
            return `An error occurred while generating the tech stack: ${error.message}`;
        }
        return `An unknown error occurred during tech stack generation.`;
    }
}

const extractMermaidCode = (text: string): string => {
    const match = text.match(/```(?:mermaid)?([\s\S]*?)```/);
    if (match && match[1]) {
        return match[1].trim();
    }
    // Fallback if the model doesn't use the code block, which it should based on the prompt.
    return text.trim();
};

export const generateContent = async (projectIdea: string, generationType: GenerationType, techStack?: Record<string, any>): Promise<string> => {
    try {
        const model = generationType === GenerationType.DIAGRAM ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
        const prompt = buildMasterPrompt(projectIdea, generationType, techStack);

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        
        const responseText = response.text;

        if (generationType === GenerationType.DIAGRAM) {
            return extractMermaidCode(responseText);
        }

        return responseText;

    } catch (error) {
        console.error(`Error calling Gemini API for ${generationType}:`, error);
        if (error instanceof Error) {
            return `An error occurred while generating the ${generationType.toLowerCase()}: ${error.message}`;
        }
        return `An unknown error occurred during ${generationType.toLowerCase()} generation.`;
    }
};

export const refineProjectIdea = async (rawIdea: string): Promise<string> => {
    try {
        const prompt = `
            You are an expert copy editor and creative assistant. A user has provided a project idea.
            Your task is to refine and polish the wording of the project idea. Improve clarity, fix grammatical errors, and make the language more impactful and professional.
            Do **not** add new features or concepts. The core idea and intent of the user must be strictly preserved.
            The output should be a single, coherent paragraph.

            User's raw idea:
            ---
            ${rawIdea}
            ---

            Generate the refined project idea:
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for idea refinement:", error);
        if (error instanceof Error) {
            return `An error occurred while refining the idea: ${error.message}`;
        }
        return "An unknown error occurred while refining the idea.";
    }
};