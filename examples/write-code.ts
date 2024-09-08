import { openai, generateObject, JsonSchema } from "agentm-core";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Get code to write
const task = process.argv[2];
if (!task) {
    console.error("Please tell me what code to write.");
    process.exit(1);
}

// Initialize OpenAI 
const apiKey = process.env.OPENAI_API_KEY!;
const model = 'gpt-4o-2024-08-06';
const completePrompt = openai({ apiKey, model });


// Define output shape
interface SourceCode {
    code: string;
}

const jsonSchema: JsonSchema = {
    name: 'SourceCode',
    schema: {
        type: 'object',
        properties: {
            code: { 
                type: 'string',
                description: 'typescript source code' 
            }
        },
        required: ['code'],
        additionalProperties: false
    },
    strict: true
};

// Provide additional context
const context = ``;

// Ask a question using chain of thought
const maxTokens = 4000;
const goal = `Write a small typescript program that ${task}.`;
generateObject<SourceCode>({goal, jsonSchema, maxTokens, context, completePrompt }).then(result => {;
    if (result.completed) {
        console.log(`\x1b[32m${result.value?.code}\x1b[0m`);
    } else {
        console.error(result.error);
    }
});
