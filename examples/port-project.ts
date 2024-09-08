import { argumentParser, ArgumentSchema, generateObject, JsonSchema, openai } from 'agentm-core';
import * as dotenv from "dotenv";
import * as fs from 'fs/promises';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI 
const apiKey = process.env.OPENAI_API_KEY!;
const model = 'gpt-4o-2024-08-06';
const completePrompt = openai({ apiKey, model });

// Define the TargetFile schema
interface TargetFile {
    filename: string;
    content: string;
}

const targetFileSchema: JsonSchema = {
    name: 'TargetFile',
    schema: {
        type: 'object',
        properties: {
            filename: {
                type: 'string',
                description: 'path to the file being created'
            },
            content: {
                type: 'string',
                description: 'contents of the target file'
            }
        },
        required: ['filename', 'content'],
        additionalProperties: false
    },
    strict: true
};


// Define a schema for parsing command line arguments
interface Args {
    sourceFolder: string;
    outputFolder: string;
    error: string;
}

const argsSchema: ArgumentSchema = {
    sourceFolder: {
        type: 'string',
        description: 'source folder containing the typescript files to convert.',
        required: true
    },
    outputFolder: {
        type: 'string',
        description: 'output folder for where to save the converted python files. should default to [sourceFolder]-py',
        required: true
    },
    error: {
        type: 'string',
        description: 'error message to display when arguments are missing.',
        required: false
    }
};

// Define conversion goal
const conversionGoal = 
`You are converting a project from TypeScript to Python. 
Convert the TypeScript file above to Python. 
Assume that imports to other project files will be in the some location folder wise but have a .py extension. If the file isn't a code file just copy it. 
If it doesn't seem needed in the target project return EMPTY for the content field.
Use the following libraries:

- **Pydantic** - For defining data models and validating the structure of input arguments and decision outputs, similar to TypeScript interfaces.
- **Asyncio** - To handle asynchronous operations, allowing for concurrent processing of tasks, akin to JavaScript's promise handling.
- **Requests** - If the library needs to make HTTP requests to an external service, similar to how the original library might interact with a model API.
- **OpenAI** - Any LLM model calls.
- **tiktoken** - Counting tokens`;

// Main function to start the conversion process
async function main() {
    // Parse cli arguments
    const parserGoal = `Parse the parameters needed to convert a TypeScript project to Python.`;
    const args = await argumentParser<Args>({ goal: parserGoal, schema: argsSchema, argv: process.argv.slice(2), completePrompt });
    if (!args.completed || args.value?.error) {
        console.error(args.error ?? args.value?.error);
        return;
    }

    // Resolve paths
    const sourceFolder = path.resolve(args.value!.sourceFolder);
    const outputFolder = path.resolve(args.value!.outputFolder);

    // Walk through the source folder and convert each file
    console.log(`\x1b[35;1mPorting project to python...\x1b[0m`);
    await walkDirectory(sourceFolder, async (filePath) => {
        // Convert the file
        console.log(`Converting \x1b[32m${filePath}\x1b[0m`);
        const target = await convertFile(filePath, outputFolder);

        // Check for EMPTY content
        if (target.content === 'EMPTY') {
            console.log(`Skipping ${filePath}`);
            return;
        }

        // Create target directory if it doesn't exist
        const targetPath = target.filename;
        console.log(`Creating \x1b[32m${targetPath}\x1b[0m`);
        await fs.mkdir(path.dirname(targetPath), { recursive: true });

        // Write the file
        await fs.writeFile(targetPath, target.content);
    });
}

main();

// Function to recursively walk through the directory
async function walkDirectory(dir: string, callback: (filePath: string) => Promise<void>) {
    const files = await fs.readdir(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) {
            await walkDirectory(filePath, callback);
        } else {
            await callback(filePath);
        }
    }
}

// Function to convert TypeScript to Python
async function convertFile(filePath: string, outputDir: string): Promise<TargetFile> {
    try {
        // Read file and format as context
        const content = await fs.readFile(filePath, 'utf-8');
        const context = `OUTPUTFOLDER: ${outputDir}\nFILEPATH: ${filePath}\nFILEDATA:\n${content}`;

        // Convert file
        const maxTokens = 16000;
        const output = await generateObject<TargetFile>({ goal: conversionGoal, jsonSchema: targetFileSchema, context, maxTokens, completePrompt });
        if (!output.completed) {
            console.error(output.error);
            process.exit(1);
        }

        return output.value!;
    } catch (error) {
        console.error(`Error converting file ${filePath}:`, error);
        process.exit(1);
    }
}

