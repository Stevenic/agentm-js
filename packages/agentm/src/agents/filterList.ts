import { AgentArgs, AgentCompletion, SystemMessage, UserMessage } from "../types";
import { composePrompt } from "../composePrompt";
import { parallelCompletePrompt } from "../parallelCompletePrompt";

/**
 * Arguments for the filterList Agent.
 * @param TItem The type of the items in the list.
 */
export interface FilterListArgs<TItem> extends AgentArgs {
    /**
     * Goal used to direct the filtering task.
     */
    goal: string;

    /**
     * List of items to filter.
     */
    list: Array<TItem>;

    /**
     * Optional. Temperature the model should use for sampling completions.
     * @remarks
     * Default is 0.0.
     */
    temperature?: number;

    /**
     * Optional. Instructions to further customize the system prompt sent to the model.
     */
    instructions?: string;
}

/**
 * Filters a list of items to only include items that match a provided goal.
 * @param TItem Type of the items in the list.
 * @param args Arguments for the filtering task.
 * @returns List of items that match the provided goal.
 */
export async function filterList<TItem>(args: FilterListArgs<TItem>): Promise<AgentCompletion<Array<TItem>>> {
    const { goal, list } = args;
    const temperature = args.temperature ?? 0.0;

    // Create a parallel completion function
    const completePrompt = parallelCompletePrompt<Decision>(args);

    // Compose system message
    const instructions = args.instructions ? `\n${args.instructions}` : '';
    const system: SystemMessage = {
        role: 'system',
        content: composePrompt(systemPrompt, {goal, instructions})
    };

 
    // Enumerate list
    const useJSON = true;
    const length = list.length;
    const promises: Promise<AgentCompletion<Decision>>[] = [];
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

    // Copy kept items to output
    const value: Array<TItem> = [];
    for (let i = 0; i < results.length; i++) {
        const decision = results[i].value!;
        if (!decision.remove_item) {
            value.push(list[i]);
        }
    }

    // Return filtered list
    return { completed: true, value };
}

interface Decision {
    explanation: string;
    remove_item: boolean;
}

const systemPrompt = 
`You are an expert at filtering items in a list.

<GOAL>
{{goal}} 

<INSTRUCTIONS>
Determine if the <ITEM> should be removed from the list using provided <GOAL>.
Use the <DECISION> schema below to return your decisions as a JSON object.{{instructions}}

<DECISION>
{"explanation": "<explanation supporting your decision to remove item>", "remove_item": <true or false>}`;
const itemPrompt =
`<INDEX>
{{index}} of {{length}}

<ITEM>
{{item}}`;
