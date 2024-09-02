import { AgentArgs, AgentCompletion, JsonSchema, Message, SystemMessage, UserMessage, WithExplanation } from "../types";
import { composePrompt } from "../composePrompt";
import { CancelledError } from "../CancelledError";

export interface ReduceListArgs<TResult extends {}> extends AgentArgs {
    goal: string;
    list: Array<any>;
    initialValue: TResult;
    jsonSchema?: JsonSchema;
    temperature?: number;
    maxHistory?: number;
}

export async function reduceList<TResult extends {}>(args: ReduceListArgs<TResult>): Promise<AgentCompletion<TResult>> {
    const { goal, list, initialValue, jsonSchema, completePrompt, shouldContinue } = args;
    const temperature = args.temperature ?? 0.0;
    let maxHistory = args.maxHistory ?? 8;
    if (maxHistory < 2) {
        maxHistory = 2;
    }

    // Compose system message
    let output: WithExplanation<TResult> = {...initialValue, explanation};
    const system: SystemMessage = {
        role: 'system',
        content: composePrompt(systemPrompt, {goal, output})
    };

    // Enumerate list
    const useJSON = true;
    const history: Message[] = [];
    for (let index = 0; index < list.length; index++) {
        // Compose prompt
        const item = args.list[index];
        const prompt: UserMessage = {
            role: 'user',
            content: composePrompt(itemPrompt, {index, item})
        };

        // Complete prompt
        const result: AgentCompletion<WithExplanation<TResult>> = await completePrompt({prompt, system, history, useJSON, jsonSchema, temperature});
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

<GOALS>
{{goal}} 

<INSTRUCTIONS>
Given an <ITEM> return a new JSON <OUTPUT> object that combines the item with the current output to achieve the <GOAL>. 

<OUTPUT>
{{output}}`;
const itemPrompt =
`
<INDEX>
{{index}}

<ITEM>
{{item}}
`;