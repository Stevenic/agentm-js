import { AgentArgs, AgentCompletion, JsonSchema, SystemMessage, UserMessage, WithExplanation } from "../types";
import { composePrompt } from "../composePrompt";
import { parallelCompletePrompt } from "../parallelCompletePrompt";

/**
 * Base arguments for the mapList Agent.
 */
export interface BaseMapListArgs extends AgentArgs {
    /**
     * Goal used to direct the mapping task.
     */
    goal: string;

    /**
     * List of items to map.
     */
    list: Array<any>;

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
 * Arguments for the mapList Agent when using an outputShape.
 */
export interface ShapeBasedMapListArgs extends BaseMapListArgs {
    /**
     * Shape of the output object.
     * @remarks
     * This is a "JSON Sketch" of the desired output shape. It should include instructions for 
     * how the model should map an item to the new shapes fields.
     * 
     * A top level "explanation" field is temporarily added to the shape to create a 
     * chain-of-thought for the model so your shape should not include this field.
     */
    jsonShape: {}
}

export interface SchemaBasedMapListArgs extends BaseMapListArgs {
    /**
     * JSON Schema of the output object.
     * @remarks
     * This is a JSON Schema of the desired output shape. For OPenAI models that support structured
     * output, this will be used to guarantee the output shape when `jsonSchema.strict = true`.
     * 
     * A top level "explanation" field is automatically added to the schema to create a 
     * chain-of-thought for the model so your schema should not include this field.
     */
    jsonSchema: JsonSchema;
}

/**
 * Maps a list of items to a new shape.
 * @remarks
 * The mapped item is always a JSON object.
 * @param TItem The type of the items in the list.
 * @param args Arguments for the mapping task.
 * @returns List of items mapped to the new shape.
 */
export async function mapList<TItem extends {}>(args: ShapeBasedMapListArgs|SchemaBasedMapListArgs): Promise<AgentCompletion<Array<TItem>>> {
    const { goal, list, maxTokens } = args;
    const temperature = args.temperature ?? 0.0;

    // Create a parallel completion function
    const completePrompt = parallelCompletePrompt<WithExplanation<TItem>>(args);

    // Compose system message
    let jsonSchema: JsonSchema|undefined;
    let system: SystemMessage;
    const instructions = args.instructions ? `\n${args.instructions}` : '';
    if ('jsonSchema' in args) {
        jsonSchema = {...args.jsonSchema};
        jsonSchema.schema.properties!.explanation = { type: 'string', description: 'explanation supporting the mapping you did' };
        if (Array.isArray(jsonSchema.schema.required)) {
            jsonSchema.schema.required!.push('explanation');
        } else {
            jsonSchema.schema.required = ['explanation'];
        }
        system = {
            role: 'system',
            content: composePrompt(schemaSystemPrompt, {goal, instructions})
        };
    } else {
        const outputShape: WithExplanation<{}> = {...args.jsonShape, explanation};
        system = {
            role: 'system',
            content: composePrompt(shapeSystemPrompt, {goal, instructions, outputShape})
        };
    }

 
    // Enumerate list
    const jsonMode = true;
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
        promises.push(completePrompt({prompt, system, jsonMode, jsonSchema, temperature, maxTokens}));
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
const schemaSystemPrompt = 
`You are an expert at mapping list items from one type to another.

<GOAL>
{{goal}} 

<INSTRUCTIONS>
Given an <ITEM> map the item to the provided JSON shape using the instructions specified by the <GOAL>.{{instructions}}`;
const shapeSystemPrompt = 
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
