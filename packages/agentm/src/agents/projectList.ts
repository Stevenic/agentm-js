import { AgentArgs, AgentCompletion, SystemMessage, UserMessage } from "../types";
import { composePrompt } from "../composePrompt";
import { parallelCompletePrompt } from "../parallelCompletePrompt";

export interface ProjectListArgs<TItem> extends AgentArgs {
    goal: string;
    list: Array<TItem>;
    template: string;
    temperature?: number;
    instructions?: string;
}

export interface ProjectedItem<TItem> {
    projection: string;
    item: TItem;
}

export async function projectList<TItem = any>(args: ProjectListArgs<TItem>): Promise<AgentCompletion<Array<ProjectedItem<TItem>>>> {
    const { goal, list, template } = args;
    const temperature = args.temperature ?? 0.0;

    // Create a parallel completion function
    const completePrompt = parallelCompletePrompt<string>(args);

    // Compose system message
    const instructions = args.instructions ? `\n${args.instructions}` : '';
    const system: SystemMessage = {
        role: 'system',
        content: composePrompt(systemPrompt, {template, goal, instructions})
    };
 
    // Enumerate list
    const length = list.length;
    const promises: Promise<AgentCompletion<string>>[] = [];
    for (let index = 0; index < length; index++) {
        // Compose prompt
        const item = args.list[index];
        const prompt: UserMessage = {
            role: 'user',
            content: composePrompt(itemPrompt, {index, length, item})
        };

        // Queue prompt completion
        promises.push(completePrompt({prompt, system, temperature}));
    }

    // Wait for prompts to complete and check for errors
    const results = await Promise.all(promises);
    const errors = results.filter(result => !result.completed);
    if (errors.length > 0) {
        return { completed: false, error: errors[0].error };
    }

    // Return results
    const value = results.map((result, index) => ({ projection: result.value!, item: list[index] }));
    return { completed: true, value };
}

const systemPrompt = 
`You are an expert at re-formatting a list of items using a template.

<TEMPLATE>
{{template}}

<GOAL>
{{goal}}

<INSTRUCTIONS>
Use the <TEMPLATE> above to reformat the <ITEM> using the directions in the provided <GOAL>.{{instructions}}`;
const itemPrompt =
`<ITEM>
{{item}}`;
