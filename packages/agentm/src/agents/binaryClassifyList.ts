import { AgentArgs, AgentCompletion, SystemMessage, UserMessage } from "../types";
import { composePrompt } from "../composePrompt";
import { parallelCompletePrompt } from "../parallelCompletePrompt";

/**
 * Arguments for the binaryClassifyList Agent.
 * @param TItem The type of the items in the list.
 */
export interface BinaryClassifyListArgs<TItem> extends AgentArgs {
    /**
     * Goal used to direct the classification task.
     */
    goal: string;

    /**
     * List of items to classify.
     */
    list: Array<TItem>;

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
 * A binary classified item.
 * @remarks
 * Returned by the binaryClassifyList Agent.
 * @param TItem The type of the items in the list.
 */
export interface BinaryClassifiedItem<TItem> {
    /**
     * Indicates whether the item matches the provided goal.
     */
    matches: boolean;

    /**
     * The item that was classified.
     */
    item: TItem;
}

/**
 * Performs a binary classification on a list of items.
 * @param args Arguments for the binary classification task. 
 * @returns List of binary classifications for each item in the list.
 */
export async function binaryClassifyList<TItem = any>(args: BinaryClassifyListArgs<TItem>): Promise<AgentCompletion<Array<BinaryClassifiedItem<TItem>>>> {
    const { goal, list, maxTokens } = args;
    const temperature = args.temperature ?? 0.0;

    // Create a parallel completion function
    const completePrompt = parallelCompletePrompt<Classification>(args);

    // Compose system message
    const instructions = args.instructions ? `\n${args.instructions}` : '';
    const system: SystemMessage = {
        role: 'system',
        content: composePrompt(systemPrompt, {goal, instructions})
    };
 
    // Enumerate list
    const useJSON = true;
    const length = list.length;
    const promises: Promise<AgentCompletion<Classification>>[] = [];
    for (let index = 0; index < length; index++) {
        // Compose prompt
        const item = args.list[index];
        const prompt: UserMessage = {
            role: 'user',
            content: composePrompt(itemPrompt, {index, length, item})
        };

        // Queue prompt completion
        promises.push(completePrompt({prompt, system, useJSON, temperature, maxTokens}));
    }

    // Wait for prompts to complete and check for errors
    const results = await Promise.all(promises);
    const errors = results.filter(result => !result.completed);
    if (errors.length > 0) {
        return { completed: false, error: errors[0].error };
    }

    // Return results
    const value = results.map((result, index) => ({ matches: result.value!.matches, item: list[index] }));
    return { completed: true, value };
}

interface Classification {
    explanation: string;
    matches: boolean;
}

const systemPrompt = 
`You are an expert at classifying items in a list.

<GOAL>
{{goal}} 

<INSTRUCTIONS>
Given an <ITEM> determine if it matches the provided <GOAL>.
Return your classification as a JSON <CLASSIFICATION> object.{{instructions}}

<CLASSIFICATION>
{"explanation": "<explanation supporting your classification>", "matches": <true or false>}`;
const itemPrompt =
`<INDEX>
{{index}} of {{length}}

<ITEM>
{{item}}`;
