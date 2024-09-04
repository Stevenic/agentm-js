import { openai, summarizeList } from "agentm";
import * as dotenv from "dotenv";
import * as fs from "fs";

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI 
const apiKey = process.env.OPENAI_API_KEY!;
const model = 'gpt-4o-mini';
const completePrompt = openai({ apiKey, model });

// Read document
const document = fs.readFileSync('./data/paul-graham-essay.txt', 'utf8');

// Summarize the document
const list = [document];
const goal = `Summarize the document.`;
summarizeList({goal, list, completePrompt }).then(result => {;
    if (result.completed) {
        const { summary } = result.value![0];
        console.log(summary);
    } else {
        console.error(result.error);
    }
});