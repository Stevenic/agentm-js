import { openai, groundedAnswer } from "agentm-core";
import * as dotenv from "dotenv";
import * as fs from "fs";

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI 
const apiKey = process.env.OPENAI_API_KEY!;
const model = 'gpt-4o-mini';
const completePrompt = openai({ apiKey, model });

// Read document as context
const context = fs.readFileSync('./data/satya-nadella-build2024-keynote.txt', 'utf8');

// Get question from command line
const question = process.argv[2] ?? "What features were announced for copilot pc? was a ship date provided?";
console.log(`Question: \x1b[32m${question}\x1b[0m`);

// Ask a question using chain of thought
const maxTokens = 2000;
groundedAnswer({question, context, maxTokens, completePrompt }).then(result => {;
    if (result.completed) {
        const { value } = result;
        console.log(`Answer: \x1b[32m${value?.answer}\x1b[0m`);
        console.log(`Explanation: \x1b[32m${value?.explanation}\x1b[0m`);
    } else {
        console.error(result.error);
    }
});