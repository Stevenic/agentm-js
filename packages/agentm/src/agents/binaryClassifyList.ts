import { AgentArgs, AgentCompletion, SystemMessage, UserMessage } from "../types";
import { composePrompt } from "../composePrompt";
import { parallelCompletePrompt } from "../parallelCompletePrompt";

export interface BinaryClassifyListArgs<TItem> extends AgentArgs {
    goal: string;
    list: Array<TItem>;
    temperature?: number;
    instructions?: string;
}

export interface BinaryClassifiedItem<TItem> {
    matches: boolean;
    item: TItem;
}

export async function binaryClassifyList<TItem = any>(args: BinaryClassifyListArgs<TItem>): Promise<AgentCompletion<Array<BinaryClassifiedItem<TItem>>>> {
    const { goal, list } = args;
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
        promises.push(completePrompt({prompt, system, useJSON, temperature}));
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
