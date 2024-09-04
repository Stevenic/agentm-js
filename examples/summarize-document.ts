import { openai, summarizeList } from "agentm";
import * as dotenv from "dotenv";
import * as fs from "fs";

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI 
const apiKey = process.env.apiKey!;
const model = 'gpt-4o-mini';
const completePrompt = openai({ apiKey, model });

// Create cancellation token
const shouldContinue = () => true;

// Read document
const document = fs.readFileSync('./data/paul-graham-essay.txt', 'utf8');

// Summarize the document
const list = [document];
const goal = `Summarize the document.`;
summarizeList({goal, list, completePrompt, shouldContinue }).then(result => {;
    if (result.completed) {
        result.value!.forEach((entry) => console.log(`\x1b[32m${entry.summary}\x1b[0m`));
    } else {
        console.error(result.error);
    }
});
