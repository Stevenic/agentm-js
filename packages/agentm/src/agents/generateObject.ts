import { AgentArgs, JsonSchema, PromptCompletion, SystemMessage, UserMessage } from "../types";
import { composePrompt } from "../composePrompt";

/**
 * Arguments for the generateObject Agent.
 */
export interface GenerateObjectArgs extends AgentArgs {
    /**
     * Goal used to direct the generation task.
     */
    goal: string;

    /**
     * Schema of the output object.
     */
    jsonSchema: JsonSchema;

    /**
     * Optional. Temperature the model should use for sampling completions.
     * @remarks
     * Default is 0.0.
     */
    temperature?: number;

    /**
     * Optional. Maximum number of tokens the model should return.
     * @remarks
     * Default is 1000.
     */
    maxTokens?: number;

    /**
     * Optional. Additional context to include in the system prompt.
     */
    context?: string;

    /**
     * Optional. Instructions to further customize the system prompt sent to the model.
     */
    instructions?: string;
}

/**
 * Generates a new instance of a structured object.
 * @param args Arguments for the generateObject task.
 * @returns Generated object.
 */
export async function generateObject<TObject extends {}>(args: GenerateObjectArgs): Promise<PromptCompletion<TObject>> {
    const { goal, maxTokens, jsonSchema, completePrompt } = args;
    const temperature = args.temperature ?? 0.0;

    // Compose system message
    const context = args.context ? `<CONTEXT>\n${args.context}\n\n` : '';
    const instructions = args.instructions ? `\n${args.instructions}` : '';
    const system: SystemMessage = {
        role: 'system',
        content: composePrompt(systemPrompt, {context, instructions})
    };
 
    // Complete the prompt
    const prompt: UserMessage = {
        role: 'user',
        content: goal
    };
    return await completePrompt({prompt, system, jsonSchema, temperature, maxTokens});
}

const systemPrompt = 
`{{context}}<INSTRUCTIONS>
Return a JSON object based on the users directions.{{instructions}}`;
