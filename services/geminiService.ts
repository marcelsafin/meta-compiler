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
                **Task: Generate a simple Mermaid diagram.**
                Act as an expert in software architecture. Create a **high-level, clean, and simple** Mermaid flowchart diagram based on the project idea and technical architecture.
                - The diagram MUST be a flowchart (graph TD).
                - **Focus only on the main components and their core relationships. Avoid excessive detail, numbered steps, or complex data flow descriptions.**
                - Use subgraphs to logically group components (e.g., "UI", "Backend", "Database").
                - Use clear and concise labels for nodes.
                - **CRITICAL RULE:** If a node's text label contains special characters (like parentheses, periods, or commas), you MUST enclose the entire text label in double quotes. For example, use \`api["Node.js (Express) API"]\` instead of \`api[Node.js (Express) API]\`.
                - Your entire response must only be the Mermaid code block. Do not add any other text.

                Example of a simple diagram:
                \`\`\`mermaid
                graph TD
                    subgraph "User Interface"
                        ui["React Frontend (Vite)"]
                    end
                    
                    subgraph "Backend Services"
                        api["Node.js (Express) API"]
                    end
                    
                    subgraph "Data Storage"
                        db["PostgreSQL Database"]
                    end
                    
                    subgraph "Authentication"
                        auth["Firebase Auth"]
                    end
                    
                    ui --> api
                    api --> db
                    ui -- "Authenticates" --> auth
                \`\`\`
            `;
            break;
        case GenerationType.SCRIPT:
            taskInstruction = `
                **Task: Generate a clean demo script.**
                Act as an expert in creating scripts for technical demonstrations. Write a short and impactful script for a 2-minute demo of the project.
                - Structure the script into logical sections with clear headings and approximate timestamps.
                - For each section, provide a narrative that describes both the spoken words and the on-screen visuals in a clean, readable paragraph.
                - Do NOT use prefixes like "Speaker:" or "Visual:".
                - The tone should be professional yet engaging.
                - Reference components from the technical architecture where appropriate.
                - Base the script on the project idea.

                Example of the desired format:
                ---
                **(0:00 - 0:15) Introduction & Problem Statement**
                The presenter opens with the project's logo on screen and introduces the problem the project solves. They'll state the core pain point clearly and concisely, setting the stage for the solution.

                **(0:15 - 0:45) Unveiling the Solution**
                The screen transitions to the main dashboard of the application. The presenter walks through the core feature, explaining how it directly addresses the problem mentioned earlier. They highlight the clean UI and intuitive design.

                **(0:45 - 1:30) Core Demo**
                This section is a live walkthrough of the main workflow. The presenter demonstrates creating a new item, interacting with the key features (e.g., using the React frontend to call the Node.js API), and shows the results updating in real-time in the database.

                **(1:30 - 2:00) Vision & Closing**
                The presenter summarizes the key benefits shown in the demo. They briefly mention the technology stack (e.g., "Built with React, FastAPI, and running on Google Cloud") and future plans for the project. The final screen shows the project logo and contact information.
                ---
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