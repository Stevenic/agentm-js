import { AgentArgs, AgentCompletion, SystemMessage, UserMessage } from "../types";
import { composePrompt } from "../composePrompt";
import { parallelCompletePrompt } from "../parallelCompletePrompt";

/**
 * Arguments for the projectList Agent.
 * @param TItem The type of the items in the list.
 */
export interface ProjectListArgs<TItem> extends AgentArgs {
    /**
     * Goal used to direct the projection task.
     */
    goal: string;

    /**
     * List of items to project.
     */
    list: Array<TItem>;

    /**
     * Template used to project the items.
     * @remarks
     * The template can be any format but should include <placeholders> for the items various 
     * fields. Markdown templates work well.
     */
    template: string;

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
 * A projected item.
 * @remarks
 * Returned by the projectList Agent.
 * @param TItem The type of the items in the list.
 */
export interface ProjectedItem<TItem> {
    /**
     * The item projected to the new text shape.
     */
    projection: string;

    /**
     * The item that was projected.
     */
    item: TItem;
}

/**
 * Projects a list of items to a new text shape using a provided template.
 * @param TItem The type of the items in the list.
 * @param args Arguments for the projection task.
 * @returns List of items projected to the new text shape.
 */
export async function projectList<TItem = any>(args: ProjectListArgs<TItem>): Promise<AgentCompletion<Array<ProjectedItem<TItem>>>> {
    const { goal, list, template, maxTokens } = args;
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
        promises.push(completePrompt({prompt, system, temperature, maxTokens}));
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
