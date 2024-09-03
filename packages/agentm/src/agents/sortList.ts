import { AgentArgs, AgentCompletion, SystemMessage, UserMessage } from "../types";
import { composePrompt } from "../composePrompt";
import { parallelCompletePrompt } from "../parallelCompletePrompt";

/**
 * Arguments for the sortList Agent.
 * @param TItem The type of the items in the list.
 */
export interface SortListArgs<TItem> extends AgentArgs {
    /**
     * Goal used to direct the sorting task.
     */
    goal: string;

    /**
     * List of items to sort.
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

    /**
     * Optional. Flag to log explanations of each sorting step to the console.
     * @remarks 
     * Default is false.
     */
    logExplanations?: boolean;
}

/**
 * Sorts a list of items.
 * @remarks
 * Uses a merge sort algorithm to sort the list. The model is asked to compare each pair of items
 * in the list to determine their order. The model is provided with a goal and instructions to help
 * guide the sorting process. 
 * 
 * The sort algorithm has a complexity of O(n log n) and can use parallel completions to speed up
 * the sorting process.
 * @param TItem The type of the items in the list.
 * @param args Arguments for the sorting task.
 * @returns List of sorted items.
 */
export async function sortList<TItem>(args: SortListArgs<TItem>): Promise<AgentCompletion<Array<TItem>>> {
    const { goal, list, maxTokens } = args;
    const temperature = args.temperature ?? 0.0;

    // Create a parallel completion function
    const completePrompt = parallelCompletePrompt<Decision>(args);

    // Compose system message
    const instructions = args.instructions ? `\n${args.instructions}` : '';
    const system: SystemMessage = {
        role: 'system',
        content: composePrompt(systemPrompt, {goal, instructions})
    };

    // Sort list
    let value: Array<TItem>;
    try {
        const comparer = async (a: TItem, b: TItem) => {
            // Compose prompt
            const prompt: UserMessage = {
                role: 'user',
                content: composePrompt(itemPrompt, {a, b})
            };

            // Complete prompt
            const useJSON = true;
            const result = await completePrompt({prompt, system, useJSON, temperature, maxTokens});
            if (!result.completed) {
                throw result.error;
            }

            if (args.logExplanations) {
                console.log(`\x1b[32m${a}\x1b[0m is ${result.value!.sort_item_a} \x1b[32m${b}\x1b[0m because \x1b[32m${result.value!.explanation}\x1b[0m\n`);
            }
            // Return comparison result
            switch (result.value!.sort_item_a) {
                case 'BEFORE':
                    return -1;
                case 'AFTER':
                    return 1;
                default:
                    return 0;
            }
        };
        value = await mergeSort(list, comparer);
    } catch (err: unknown) {
        return { completed: false, error: err as Error };
    }

    // Return sorted list
    return { completed: true, value };
}

interface Decision {
    explanation: string;
    sort_item_a: 'BEFORE' | 'EQUAL' | 'AFTER';
}

const systemPrompt = 
`You are an expert in sorting a list of items.

<GOAL>
{{goal}} 

<INSTRUCTIONS>
Determine if <ITEM_A> should be sorted BEFORE, EQUAL, or AFTER <ITEM_B> based upon the stated <GOAL>.
Use the <DECISION> schema below to return your decisions as a JSON object.{{instructions}}

<DECISION>
{"explanation": "<explanation supporting your decision>", "sort_item_a": "<BEFORE, EQUAL, or AFTER>"}`;
const itemPrompt =
`<ITEM_A>
{{a}}

<ITEM_B>
{{b}}`;

async function mergeSort<TItem>(list: Array<TItem>, comparer: (a: TItem, b: TItem) => Promise<number>): Promise<Array<TItem>> {
    // Check for empty or single item list
    if (list.length < 2) {
        return list;
    }

    return await split(list, comparer);
}

async function split<TItem>(list: Array<TItem>, comparer: (a: TItem, b: TItem) => Promise<number>): Promise<Array<TItem>> {
    // Does list have a single item?
    if(list.length < 2) { 
        return list;
    };

    // Divide list into left & right halves
    const mid = Math.floor(list.length / 2);
    const left = list.slice(0, mid);
    const right = list.slice(mid);

    // Recursively split list again to get single-item lists and then merge them
    // - Using Promise.all to parallelize the downstream merges.
    const promises = [split(left, comparer), split(right, comparer)];
    const [leftList, rightList] = await Promise.all(promises);
    return await merge(leftList, rightList, comparer);
}

async function merge<TItem>(leftList: Array<TItem>, rightList: Array<TItem>, comparer: (a: TItem, b: TItem) => Promise<number>): Promise<Array<TItem>> {
    let result = [];
    let leftIndex = 0;
    let rightIndex = 0;

    while (leftIndex < leftList.length && rightIndex < rightList.length) {
        const comparison = await comparer(leftList[leftIndex], rightList[rightIndex]);
        if (comparison <= 0) {
            result.push(leftList[leftIndex]);
            leftIndex++;
        } else {
            result.push(rightList[rightIndex]);
            rightIndex++;
        }
    }

    return result.concat(leftList.slice(leftIndex)).concat(rightList.slice(rightIndex));
}
