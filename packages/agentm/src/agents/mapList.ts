import { AgentArgs, AgentCompletion, SystemMessage, UserMessage, WithExplanation } from "../types";
import { composePrompt } from "../composePrompt";
import { parallelCompletePrompt } from "../parallelCompletePrompt";

/**
 * Arguments for the mapList Agent.
 */
export interface MapListArgs extends AgentArgs {
    /**
     * Goal used to direct the mapping task.
     */
    goal: string;

    /**
     * List of items to map.
     */
    list: Array<any>;

    /**
     * Shape of the output object.
     * @remarks
     * This is a "JSON Sketch" of the desired output shape. It should include instructions to 
     * on how to map an item to the new shapes fields.
     * 
     * A top level "explanation" field is temporarily added to the shape to create a 
     * chain-of-thought for the model so your shape should not include this field.
     */
    outputShape: {};

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
 * Maps a list of items to a new shape.
 * @remarks
 * The mapped item is always a JSON object.
 * @param TItem The type of the items in the list.
 * @param args Arguments for the mapping task.
 * @returns List of items mapped to the new shape.
 */
export async function mapList<TItem extends {}>(args: MapListArgs): Promise<AgentCompletion<Array<TItem>>> {
    const { goal, list, maxTokens } = args;
    const temperature = args.temperature ?? 0.0;

    // Create a parallel completion function
    const completePrompt = parallelCompletePrompt<WithExplanation<TItem>>(args);

    // Compose system message
    const instructions = args.instructions ? `\n${args.instructions}` : '';
    const outputShape: WithExplanation<{}> = {...args.outputShape, explanation};
    const system: SystemMessage = {
        role: 'system',
        content: composePrompt(systemPrompt, {goal, instructions, outputShape})
    };

 
    // Enumerate list
    const useJSON = true;
    const length = list.length;
    const promises: Promise<AgentCompletion<WithExplanation<TItem>>>[] = [];
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
    const value = results.map(result => {
        // Remove explanation
        delete result.value!.explanation;
        return result.value!;
    });

    // Return sorted list
    return { completed: true, value };
}

const explanation = `<explanation supporting the mapping you did>`;
const systemPrompt = 
`You are an expert at mapping list items from one type to another.

<GOAL>
{{goal}} 

<INSTRUCTIONS>
Given an <ITEM> return a new JSON <OUTPUT> object that maps the item to the shape specified by the <GOAL>.{{instructions}}

<OUTPUT>
{{outputShape}}`;
const itemPrompt =
`<INDEX>
{{index}} of {{length}}

<ITEM>
{{item}}`;
