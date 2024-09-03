import { AgentArgs, AgentCompletion, SystemMessage, UserMessage } from "../types";
import { composePrompt } from "../composePrompt";
import { parallelCompletePrompt } from "../parallelCompletePrompt";
import { variableToString } from "../variableToString";

export interface SummarizeListArgs<TItem> extends AgentArgs {
    goal: string;
    list: Array<TItem>;
    temperature?: number;
    instructions?: string;
}

export interface SummarizedItem<TItem> {
    summary: string;
    item: TItem;
}

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
