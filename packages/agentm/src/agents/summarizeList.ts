import { AgentArgs, AgentCompletion, SystemMessage, UserMessage } from "../types";
import { composePrompt } from "../composePrompt";
import { parallelCompletePrompt } from "../parallelCompletePrompt";
import { variableToString } from "../variableToString";

/**
 * Arguments for the summarizeList Agent.
 * @param TItem The type of the items in the list.
 */
export interface SummarizeListArgs<TItem> extends AgentArgs {
    /**
     * Goal used to direct the summarization task.
     */
    goal: string;

    /**
     * List of items to summarize.
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
 * Summarized item.
 * @remarks
 * Returned by the summarizeList Agent.
 * @param TItem The type of the items in the list.
 */
export interface SummarizedItem<TItem> {
    /**
     * The summary of the item as text.
     */
    summary: string;

    /**
     * The item that was summarized
     */
    item: TItem;
}

/**
 * Summarizes a list of items to text.
 * @param TItem The type of the items in the list.
 * @param args Arguments for the summarization task.
 * @returns List of items summarized to text.
 */
export async function summarizeList<TItem = any>(args: SummarizeListArgs<TItem>): Promise<AgentCompletion<Array<SummarizedItem<TItem>>>> {
    const { goal, list } = args;
    const temperature = args.temperature ?? 0.0;

    // Create a parallel completion function
    const completePrompt = parallelCompletePrompt<Summarization>(args);

    // Compose system message
    const instructions = args.instructions ? `\n${args.instructions}` : '';
    const system: SystemMessage = {
        role: 'system',
        content: composePrompt(systemPrompt, {goal, instructions})
    };
 
    // Enumerate list
    const useJSON = true;
    const length = list.length;
    const promises: Promise<AgentCompletion<Summarization>>[] = [];
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
    const value = results.map((result, index) => ({ summary: variableToString(result.value!.summary), item: list[index] }));
    return { completed: true, value };
}

interface Summarization {
    explanation: string;
    summary: string;
}

const systemPrompt = 
`You are an expert at summarizing text.

<GOAL>
{{goal}} 

<INSTRUCTIONS>
Given an <ITEM> summarize it using the directions in the provided <GOAL>.
Return your summary as a JSON <SUMMARIZATION> object.
Ensure that the summary portion is a string.{{instructions}}

<SUMMARIZATION>
{"explanation": "<explanation supporting your summarization>", "summary": "<item summary as text>"}`;
const itemPrompt =
`<ITEM>
{{item}}`;
