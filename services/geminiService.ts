
import { GoogleGenAI } from "@google/genai";
import { GenerationType } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const buildMasterPrompt = (projectIdea: string, technologies: string, generationType: GenerationType): string => {
    let taskInstruction = '';

    switch (generationType) {
        case GenerationType.DESCRIPTION:
            taskInstruction = `
                **Task: Generate a project description.**
                Act as an expert in writing engaging and clear project descriptions for a hackathon. The description should be concise, highlight the project's unique value, and be suitable for a jury. Focus on the problem, the solution, and the technology. Use markdown for formatting.
            `;
            break;
        case GenerationType.DIAGRAM:
            taskInstruction = `
                **Task: Generate a Mermaid diagram.**
                Act as an expert in Mermaid.js. Create a flow or architecture diagram that visually represents the project idea. Return ONLY the raw Mermaid code inside a \`\`\`mermaid ... \`\`\` code block. Do not include any explanatory text, introduction, or conclusion before or after the code block. The response must only contain the Mermaid code.
            `;
            break;
        case GenerationType.SCRIPT:
            taskInstruction = `
                **Task: Generate a demo script.**
                Act as an expert in creating scripts for technical demonstrations. Write a short and impactful script for a 2-minute demo of the project. Include both what should be said and what is shown on the screen. Structure it clearly, for example with "Speaker:" and "Visual:".
            `;
            break;
        case GenerationType.SOCIAL:
            taskInstruction = `
                **Task: Generate a social media post.**
                Act as a social media expert with a focus on tech. Write a short, enthusiastic post for a platform like X (Twitter) or LinkedIn to present the project. The post should be engaging, include relevant emojis, and end with the hashtag #CloudRunHackathon.
            `;
            break;
        default:
            throw new Error("Invalid generation type");
    }

    const isGitHubUrl = (str: string): boolean => {
        const githubRegex = /^(https?:\/\/)?(www\.)?github\.com\/.+\/.+/;
        return githubRegex.test(str.trim());
    };

    let techSection = '';
    if (technologies.trim() === '') {
        techSection = `
            Technologies used:
            ---
            (Not specified by user)
            ---
        `;
    } else if (isGitHubUrl(technologies)) {
        techSection = `
            The user has provided a public GitHub repository as context. Analyze the repository's main page (README, description, language breakdown) to understand the technology stack.
            **Important:** Base your description of the technology **only** on what is clearly identifiable from the repository's main page. Do not infer or hallucinate languages or frameworks that are not present. If the technology stack is not clear, it is better to be generic than to be incorrect.
            The repository is at:
            ---
            ${technologies}
            ---
        `;
    } else {
        techSection = `
            Technologies used:
            ---
            ${technologies}
            ---
        `;
    }

    return `
        You are an expert assistant. Your goal is to help a user prepare their hackathon project.

        User's project idea:
        ---
        ${projectIdea}
        ---
        ${techSection}
        Based on the information above, perform the following task:
        ${taskInstruction}
    `;
};

export const generateContent = async (projectIdea: string, technologies: string, generationType: GenerationType): Promise<string> => {
    try {
        const prompt = buildMasterPrompt(projectIdea, technologies, generationType);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
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
            Your task is to refine and polish the wording. Improve clarity, fix grammatical errors, and make the language more impactful and professional.
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
