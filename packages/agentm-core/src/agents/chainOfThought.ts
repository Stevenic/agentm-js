import { AgentArgs, ExplainedAnswer, JsonSchema, Message, PromptCompletion, SystemMessage, UserMessage } from "../types";
import { composePrompt } from "../composePrompt";

/**
 * Arguments for the chainOfThought Agent.
 */
export interface ChainOfThoughtArgs extends AgentArgs {
    /**
     * Question to ask the model.
     */
    question: string;

    /**
     * Optional. Array of previous messages to provide context to the model.
     */
    history?: Message[];

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
     * Optional. Instructions to further customize the system prompt sent to the model.
     */
    instructions?: string;
}

/**
 * Asks the model a question requiring a chain-of-thought.
 * @remarks
 * The model is forced to separate it's chain of thought from it's answer which can be useful for 
 * situations where you want to show the user the answer without all of thr reasoning.
 * @param args Arguments for the chainOfThought task.
 * @returns Answer to the question.
 */
export async function chainOfThought(args: ChainOfThoughtArgs): Promise<PromptCompletion<ExplainedAnswer>> {
    const { question, history, maxTokens, completePrompt } = args;
    const temperature = args.temperature ?? 0.0;

    // Compose system message
    const instructions = args.instructions ? `\n${args.instructions}` : '';
    const system: SystemMessage = {
        role: 'system',
        content: composePrompt(systemPrompt, {instructions})
    };
 
    // Complete the prompt
    const prompt: UserMessage = {
        role: 'user',
        content: question
    };
    return await completePrompt({prompt, system, history, jsonSchema, temperature, maxTokens});
}

const jsonSchema: JsonSchema = {
    name: "answer",
    schema: {
        type: "object",
        properties: {
            explanation: { type: "string" },
            answer: { type: "string" }
        },
        required: ["explanation", "answer"],
        additionalProperties: false
    },
    strict: true
};

const systemPrompt = 
`<INSTRUCTIONS>
Answer the users question using the JSON <OUTPUT> structure below.{{instructions}}

<OUTPUT>
{"explanation": "<explain your reasoning>", "answer": "<the answer>"}`;
