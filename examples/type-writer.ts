import { argumentParser, ArgumentSchema, generateObject, JsonSchema, openai } from 'agentm';
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI 
const apiKey = process.env.OPENAI_API_KEY!;
const model = 'gpt-4o-2024-08-06';
const completePrompt = openai({ apiKey, model });

// Define the TypeDefinition schema
interface TypeDefinition {
    interface: string;
    jsonSchema: string;
}

const typeDefinitionSchema: JsonSchema = {
    name: 'TypeDefinition',
    schema: {
        type: 'object',
        properties: {
            interface: {
                type: 'string',
                description: 'TypeScript interface definition for the type'
            },
            jsonSchema: {
                type: 'string',
                description: 'JSON Schema definition for the type'
            }
        },
        required: ['interface', 'jsonSchema'],
        additionalProperties: false
    },
    strict: true
};

// Define a schema for parsing command line arguments
interface Args {
    typename: string;
    description: string;
    error: string;
}

const argsSchema: ArgumentSchema = {
    typename: {
        type: 'string',
        description: 'name of the type to create.',
        required: true
    },
    description: {
        type: 'string',
        description: `detailed description of the type including it's properties.`,
        required: true
    },
    error: {
        type: 'string',
        description: 'error message to display when arguments are missing.',
        required: false
    }
};

// Main function
async function main() {
    // Parse cli arguments
    const parserGoal = `Parse the parameters needed to create a new type definition that includes a TypeScript interface and a JSON schema.`;
    const args = await argumentParser<Args>({ goal: parserGoal, schema: argsSchema, argv: process.argv.slice(2), completePrompt });
    if (!args.completed || args.value?.error) {
        console.error(args.error ?? args.value?.error);
        return;
    }

    // Define context
    const context = `TYPENAME: ${args.value!.typename}\nDESCRIPTION: ${args.value!.description}`;

    // Generate the type definition
    const maxTokens = 4000;
    const goal = `Create a TypeScript interface definition and JSON scheme for the type information in the context.`;
    const jsonSchema = typeDefinitionSchema;
    const result = await generateObject<TypeDefinition>({goal, jsonSchema, maxTokens, context, completePrompt });
    if (result.completed) {
        console.log(`Type Interface:\n\x1b[32m${result.value?.interface}\x1b[0m\n`);
        console.log(`JSON Schema:\n\x1b[32m${result.value?.jsonSchema}\x1b[0m\n`);
    } else {
        console.error(result.error);
    }
}

main();
