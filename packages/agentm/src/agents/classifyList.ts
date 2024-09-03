import { AgentArgs, AgentCompletion, SystemMessage, UserMessage } from "../types";
import { composePrompt } from "../composePrompt";
import { parallelCompletePrompt } from "../parallelCompletePrompt";

/**
 * Arguments for the classifyList Agent.
 * @param TItem The type of the items in the list.
 */
export interface ClassifyListArgs<TItem> extends AgentArgs {
    /**
     * Goal used to direct the classification task.
     */
    goal: string;

    /**
     * List of items to classify.
     */
    list: Array<TItem>;

    /**
     * List of categories to classify the items as.
     */
    categories: Array<string>;

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
 * A classified item.
 * @remarks
 * Returned by the classifyList Agent.
 * @param TItem The type of the items in the list.
 */
export interface ClassifiedItem<TItem> {
    /**
     * The category the item was classified as.
     */
    category: string;

    /**
     * The item that was classified.
     */
    item: TItem;
}

/**
 * Classifies a list of items based on a provided goal and list of categories.
 * @param T
 * @param args Arguments for the classification task.
 * @returns List of classifications for each item in the list.
 */
export async function classifyList<TItem = any>(args: ClassifyListArgs<TItem>): Promise<AgentCompletion<Array<ClassifiedItem<TItem>>>> {
    const { goal, list, maxTokens } = args;
    const temperature = args.temperature ?? 0.0;

    // Create a parallel completion function
    const completePrompt = parallelCompletePrompt<Classification>(args);

    // Compose system message
    const categories = args.categories.map(category => `* ${category}`).join('\n');
    const instructions = args.instructions ? `\n${args.instructions}` : '';
    const system: SystemMessage = {
        role: 'system',
        content: composePrompt(systemPrompt, {goal, categories, instructions, maxTokens})
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
        promises.push(completePrompt({prompt, system, useJSON, temperature}));
    }

    // Wait for prompts to complete and check for errors
    const results = await Promise.all(promises);
    const errors = results.filter(result => !result.completed);
    if (errors.length > 0) {
        return { completed: false, error: errors[0].error };
    }

    // Return results
    const value = results.map((result, index) => ({ category: result.value!.category, item: list[index] }));
    return { completed: true, value };
}

interface Classification {
    explanation: string;
    category: string;
}

const systemPrompt = 
`You are an expert at classifying items in a list.

<CATEGORIES>
{{categories}}

<GOAL>
{{goal}} 

<INSTRUCTIONS>
Given an <ITEM> classify the item using the above <CATEGORIES> based upon the provided <GOAL>.
Return your classification as a JSON <CLASSIFICATION> object.{{instructions}}

<CLASSIFICATION>
{"explanation": "<explanation supporting your classification>", "category": "<category assigned>"}`;
const itemPrompt =
`<INDEX>
{{index}} of {{length}}

<ITEM>
{{item}}`;
