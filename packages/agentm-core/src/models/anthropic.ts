import Anthropic from '@anthropic-ai/sdk';
import { completePrompt, PromptCompletion, PromptCompletionArgs, PromptCompletionDetails, PromptCompletionFinishReason } from "../types";
import { RequestError } from "../RequestError";
import * as dJSON from 'dirty-json';

/**
 * Arguments to configure an Anthropic chat model.
 */
export interface AnthropicArgs {
    /**
     * Anthropic API key to use for completions.
     */
    apiKey: string;

    /**
     * Model to use for completions.
     */
    model: string;

    /**
     * Optional. Base URL for the Anthropic API.
     */
    baseURL?: string;

    /**
     * Optional. Default temperature the model should use for sampling completions.
     * @remarks
     * Defaults to 0.0.
     */
    temperature?: number;

    /**
     * Optional. Default maximum number of tokens the model should return.
     * @remarks
     * Defaults to 1000.
     */
    maxTokens?: number;

    /**
     * Optional. Maximum number of retries to attempt when a request fails.
     */
    maxRetries?: number;
}

/**
 * Anthropic extended completion arguments for chat models.
 */
export interface AnthropicCompletionArgs extends PromptCompletionArgs {
    /**
     * Anthropic client to use for completions.
     */
    client: Anthropic;

    /**
     * Model to use for completions.
     */
    model: string;
}

/**
 * Creates a completion function for Anthropic chat models.
 * @param args Arguments for the Anthropic completion function.
 * @returns A prompt completion function that can call an Anthropic chat model.
 */
export function anthropic(args: AnthropicArgs): completePrompt<any> {
    const { apiKey, model, baseURL, temperature, maxTokens, maxRetries } = args;

    // Create client
    const client = new Anthropic({ apiKey, baseURL, maxRetries });

    return  (args) => {
        if (args.jsonMode || args.jsonSchema) { 
            return anthropicJsonChatCompletion({ client, model, temperature, maxTokens, ...args });
        } else {
            return anthropicChatCompletion({ client, model, temperature, maxTokens, ...args});
        }
    };
}


/**
 * Performs a text completion using an Anthropic chat model.
 * @param args Arguments for the Anthropic chat completion.
 * @returns The completion result.
 */
export async function anthropicChatCompletion(args: AnthropicCompletionArgs): Promise<PromptCompletion<string>> {
    const { client, model, prompt, history } = args;

    try {
        // Populate messages
        const messages: Array<any> = [];
        if (Array.isArray(history)) {
            messages.push(...history);
        }
        messages.push(prompt);

        // Generate completion
        const system = args.system?.content;
        const response = await client.messages.create({
            messages,
            system,
            model,
            temperature: args.temperature ?? 0.0,
            max_tokens: args.maxTokens ?? 1000,
        });

        // Get usage details
        const finishReason = getFinishReason(response);
        const details = usageToDetails(response.usage, finishReason);

        // Return completion
        const value = response.content.filter((block) => block.type == 'text').map((block) => (block as Anthropic.TextBlock).text).join('\n\n');
        return { completed: true, value, details };
    } catch (err: unknown) {
        if (err instanceof Anthropic.APIError) {
            return { completed: false, error: new RequestError(err.message, err.status ?? 500, err.name) };
        } else {
            return { completed: false, error: new Error(`An unexpected error occurred while calling the chat completion API: ${err}`) };
        }
    }
}

/**
 * Performs a JSON completion using an Anthropic chat model.
 * @param args Arguments for the Anthropic chat completion.
 * @returns The completion result.
 */
export async function anthropicJsonChatCompletion<TValue>(args: AnthropicCompletionArgs): Promise<PromptCompletion<TValue>> {
    // First complete the prompt as normal
    const response = await anthropicChatCompletion(args);
    if (!response.completed) {
        return response as PromptCompletion<TValue>;
    }

    // Parse the JSON response
    try {
        // Find the JSON content
        const text = response.value ?? '';
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start === -1 || end === -1 || start >= end) {
            throw new Error('Invalid JSON response');
        }

        // Parse the JSON content
        const json = text.substring(start, end + 1);
        const value = dJSON.parse(json) as TValue;
        return { completed: true, value, details: response.details };
    } catch (err: unknown) {
        return { completed: false, error: new Error(`Error parsing the response: ${err}`) };
    }
}

function usageToDetails(usage: Anthropic.Messages.Usage|undefined, finishReason: PromptCompletionFinishReason): PromptCompletionDetails|undefined {
    if (usage) {
        return {
            inputTokens: usage.input_tokens,
            outputTokens: usage.output_tokens,
            finishReason,
        };
    }

    return undefined;
}

function getFinishReason(message?: Anthropic.Messages.Message): PromptCompletionFinishReason {
    switch (message?.stop_reason) {
        case 'stop_sequence':
        case 'end_turn':
            return 'stop';
        case 'max_tokens':
            return 'length';
        case 'tool_use':
            return 'tool_call';
        default:
            return 'unknown';
    }
}