import { AgentArgs, ExplainedAnswer, JsonSchema, PromptCompletion, SystemMessage, UserMessage } from "../types";
import { composePrompt } from "../composePrompt";

/**
 * Arguments for the groundedAnswer Agent.
 */
export interface GroundedAnswerArgs extends AgentArgs {
    /**
     * Question to ask the model.
     */
    question: string;

    /**
     * Context to provide for grounding the models answering.
     */
    context: string;

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
 * Asks the model a question using contextual information to ground the models answer.
 * @remarks
 * A hallucination guard is used to help ensure that the models answer stays grounded in the provided context.
 * @param args Arguments for the groundedAnswer task.
 * @returns Answer to the question.
 */
export async function groundedAnswer(args: GroundedAnswerArgs): Promise<PromptCompletion<ExplainedAnswer>> {
    const { question, context, maxTokens, completePrompt } = args;
    const temperature = args.temperature ?? 0.0;

    // Compose system message
    const instructions = args.instructions ? `\n${args.instructions}` : '';
    const system: SystemMessage = {
        role: 'system',
        content: composePrompt(systemPrompt, {context, instructions})
    };
 
    // Complete the prompt
    const prompt: UserMessage = {
        role: 'user',
        content: question
    };
    return await completePrompt({prompt, system, jsonSchema, temperature, maxTokens});
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
`<CONTEXT>
{{context}}

<INSTRUCTIONS>
Base your answer only on the information provided in the above <CONTEXT>.
Return your answer using the JSON <OUTPUT> below. 
Do not directly mention that you're using the context in your answer.{{instructions}}

<OUTPUT>
{"explanation": "<explain your reasoning>", "answer": "<the answer>"}`;
