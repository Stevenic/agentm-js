import { Schema } from "jsonschema";
import { AgentArgs, JsonSchema, PromptCompletion } from "../types";
import { variableToString } from "../variableToString";
import { generateObject } from "./generateObject";

/**
 * Arguments for the argumentParser Agent.
 */
export interface ArgumentParserArgs extends AgentArgs {
    /**
     * Goal used to direct the parsing task.
     */
    goal: string;

    /**
     * List of arguments to parse.
     */
    argv: string[];

    /**
     * Schema of the output object.
     */
    schema: ArgumentSchema;

    /**
     * Optional. Instructions to further customize the system prompt sent to the model.
     */
    instructions?: string;
}

/**
 * Schema for a list of arguments to parse.
 */
export interface ArgumentSchema {
    [name: string]: ArgumentSchemaEntry;
}

export interface ArgumentSchemaEntry extends Schema {
    required?: boolean;
}

/**
 * Parses a list of arguments into a structured object.
 * @param args Arguments for the argumentParser task.
 * @returns Parsed list of arguments as an object matching to provided schema.
 */
export async function argumentParser<TObject extends {}>(args: ArgumentParserArgs): Promise<PromptCompletion<TObject>> {
    const { goal, schema, instructions, completePrompt } = args;
 
    // Define JSON schema of output object.
    const jsonSchema: JsonSchema = {
        name: 'ParsedArguments',
        schema: {
            type: 'object',
            properties: {},
            required: [],
            additionalProperties: false
        },
        strict: false
    };

    // Set properties and required fields
    let enableStrict = true;
    for (const [name, entry] of Object.entries(schema)) {
        // Clone the entry
        const clone = {...entry};

        // Add to JSON schema
        jsonSchema.schema.properties![name] = clone;

        // Check for required field
        if (clone.required !== undefined) {
            // Add to required property list
            if (clone.required) {
                (jsonSchema.schema.required! as string[]).push(name);
            } else {
                enableStrict = false;
            }

            // Remove schema property since it's not part of the JSON schema
            delete clone.required;
        } else {
            enableStrict = false;
        }
    }

    // Enable strict mode if all fields are required
    if (enableStrict) {
        jsonSchema.strict = true
    }

    // Parse arguments
    const context = `ARGUMENTS: ${variableToString(args.argv) ?? 'NONE'}`;
    return await generateObject({goal, jsonSchema, context, instructions, completePrompt});
}
