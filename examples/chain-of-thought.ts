import { openai, chainOfThought } from "agentm";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI 
const apiKey = process.env.OPENAI_API_KEY!;
const model = 'gpt-4o-mini';
const completePrompt = openai({ apiKey, model });

// Get question from command line
const question = process.argv[2] ?? "What is the meaning of life?";
console.log(`Question: \x1b[32m${question}\x1b[0m`);

// Ask a question using chain of thought
const maxTokens = 4000;
chainOfThought({question, maxTokens, completePrompt }).then(result => {;
    if (result.completed) {
        const { value } = result;
        console.log(`Answer: \x1b[32m${value?.answer}\x1b[0m`);
        console.log(`Explanation: \x1b[32m${value?.explanation}\x1b[0m`);
    } else {
        console.error(result.error);
    }
});