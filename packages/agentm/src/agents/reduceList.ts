import { AgentArgs, AgentCompletion, JsonSchema, Message, SystemMessage, UserMessage, WithExplanation } from "../types";
import { composePrompt } from "../composePrompt";
import { CancelledError } from "../CancelledError";

/**
 * Arguments for the reduceList Agent.
 */
export interface ReduceListArgs<TValue extends {}> extends AgentArgs {
    /**
     * Goal used to direct the reduction task.
     */
    goal: string;

    /**
     * List of items to reduce.
     */
    list: Array<any>;

    /**
     * Initial value to reduce the list to.
     * @remarks
     * This is a JSON object that will be the same shape as the output value.
     */
    initialValue: TValue;
    
    /**
     * Optional. JSON schema of the output object.
     * @remarks
     * This is a JSON Schema of the desired output shape. For OPenAI models that support structured
     * output, this will be used to guarantee the output shape when `jsonSchema.strict = true`.
     */
    jsonSchema?: JsonSchema;
    
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
     * Optional. Maximum number of history items to send the model.
     * @remarks
     * This further helps the model with its chain-of-thought. Default is 8.
     */
    maxHistory?: number;

    /**
     * Optional. Instructions to further customize the system prompt sent to the model.
     */
    instructions?: string;
}

/**
 * Reduces a list of items to a single value.
 * @remarks
 * This agent is useful for counting, summing, or aggregating items in a list. The agent counts
 * using first principals similar to the way humans count, one item at a time.
 * 
 * The output value is always a JSON object and will be the same shape as the initialValue. An
 * "explanation" field is temporarily added to the initialValue to create a chain-of-thought for 
 * the model so your initialValue should not include this field.
 * @param TValue The type of the value to reduce the list to.
 * @param args Arguments for the reduction task.
 * @returns Reduced value.
 */
export async function reduceList<TValue extends {}>(args: ReduceListArgs<TValue>): Promise<AgentCompletion<TValue>> {
    const { goal, list, initialValue, jsonSchema, maxTokens, completePrompt, shouldContinue } = args;
    const temperature = args.temperature ?? 0.0;
    let maxHistory = args.maxHistory ?? 8;
    if (maxHistory < 2) {
        maxHistory = 2;
    }

    // Compose system message
    let output: WithExplanation<TValue> = {...initialValue, explanation};
    const instructions = args.instructions ? `\n${args.instructions}` : '';
    const system: SystemMessage = {
        role: 'system',
        content: composePrompt(systemPrompt, {goal, instructions, output})
    };

    // Enumerate list
    const jsonMode = true;
    const length = list.length;
    const history: Message[] = [];
    for (let index = 0; index < length; index++) {
        // Compose prompt
        const item = args.list[index];
        const prompt: UserMessage = {
            role: 'user',
            content: composePrompt(itemPrompt, {index, length, item})
        };

        // Complete prompt
        const result: AgentCompletion<WithExplanation<TValue>> = await completePrompt({prompt, system, history, jsonMode, jsonSchema, temperature, maxTokens});
        if (!result.completed) {
            return { completed: false, error: result.error };
        } else if (!await shouldContinue()) {
            return { completed: false, error: new CancelledError() };
        }

        // Update output and history
        output = result.value!;
        history.push(prompt);
        history.push({ role: 'assistant', content: JSON.stringify(output) });

        // Prune history
        if (history.length > maxHistory) {
            history.splice(0, history.length - maxHistory);
        }
    }

    // Remove explanation
    if (output.explanation) {
        delete output.explanation;
    }
    return { completed: true, value: output };
}

const explanation = `<explanation supporting your answer>`;
const systemPrompt = 
`You are an expert at combining and reducing items in a list.

<GOAL>
{{goal}} 

<INSTRUCTIONS>
Given an <ITEM> return a new JSON <OUTPUT> object that combines the item with the current output to achieve the <GOAL>.{{instructions}}

<OUTPUT>
{{output}}`;
const itemPrompt =
`<INDEX>
{{index}} of {{length}}

<ITEM>
{{item}}`;