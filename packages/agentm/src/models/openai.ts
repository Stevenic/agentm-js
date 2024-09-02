import OpenAI from "openai";
import { completePrompt, PromptCompletion, PromptCompletionArgs, PromptCompletionDetails, PromptCompletionFinishReason } from "../types";
import { RequestError } from "../RequestError";

export interface OpenaiArgs {
    apiKey: string;
    model: string;
    baseURL?: string;
    organization?: string;
    project?: string;
}

export interface OpenAICompletionArgs extends PromptCompletionArgs {
    client: OpenAI;
    model: string;
}

export function openai(args: OpenaiArgs): completePrompt<any> {
    const { apiKey, model, baseURL, organization, project } = args;

    const client = new OpenAI({ apiKey, baseURL, organization, project });

    return  (args) => {
        if (args.useJSON) { 
            return openaiJsonChatCompletion({ client, model, ...args });
        } else {
            return openaiChatCompletion({ client, model, ...args});
        }
    };
}

export async function openaiChatCompletion(args: OpenAICompletionArgs): Promise<PromptCompletion<string>> {
    const { client, model, prompt, system, history, temperature } = args;

    try {
        // Populate messages
        const messages: Array<any> = [];
        if (system) {
            messages.push(system);
        }
        if (Array.isArray(history)) {
            messages.push(...history);
        }
        messages.push(prompt);

        // Generate completion
        const response = await client.chat.completions.create({
            model,
            messages,
            temperature: temperature ?? 0.0,
        });

        // Get usage details
        const choice = response.choices[0];
        const finishReason = getFinishReason(choice);
        const details = usageToDetails(response.usage, finishReason);

        // Return completion
        const value = choice?.message.content ?? '';
        return { completed: true, value, details };
    } catch (err: unknown) {
        let error: Error;
        if (err instanceof OpenAI.APIError && err.status !== undefined) {
            error = new RequestError(err.message, err.status, err.name);
        } else {
            error = err as Error;
        }
        return { completed: false, error };
    }
}


export async function openaiJsonChatCompletion<TValue>(args: OpenAICompletionArgs): Promise<PromptCompletion<TValue>> {
    const { client, model, prompt, system, history, temperature } = args;

    try {
        // Populate messages
        const messages: any[] = [];
        if (system) {
            messages.push(system);
        }
        if (Array.isArray(history)) {
            messages.push(...history);
        }
        messages.push(prompt);

        // Generate completion
        const response = await client.chat.completions.create({
            model,
            messages,
            temperature: temperature ?? 0.0,
            response_format: { type: "json_object" },
        });

        // Get usage details
        const choice = response.choices[0];
        const finishReason = getFinishReason(choice);
        const details = usageToDetails(response.usage, finishReason);

        // Check if the conversation was too long for the context window, resulting in incomplete JSON
        if (choice?.finish_reason === "length") {
            return { completed: false, error: new Error("The conversation was too long for the context window."), details };
        }

        // Check if the model's output included restricted content, so the generation of JSON was halted and may be partial
        if (choice?.finish_reason === "content_filter") {
            return { completed: false, error: new Error("The model's output included restricted content."), details };
        }

        if (choice?.finish_reason === "stop") {
            const value = JSON.parse(response.choices[0].message.content!);
            return { completed: true, value, details };
        } else {
            return { completed: false, error: new Error("The model did not properly complete the request."), details };
        }
    } catch (err: unknown) {
        let error: Error;
        if (err instanceof OpenAI.APIError && err.status !== undefined) {
            error = new RequestError(err.message, err.status, err.name);
        } else {
            error = err as Error;
        }
        return { completed: false, error };
    }
}

function usageToDetails(usage: OpenAI.Completions.CompletionUsage|undefined, finishReason: PromptCompletionFinishReason): PromptCompletionDetails|undefined {
    if (usage) {
        return {
            inputTokens: usage.prompt_tokens,
            outputTokens: usage.completion_tokens,
            finishReason,
        };
    }

    return undefined;
}

function getFinishReason(choice?: OpenAI.Chat.ChatCompletion.Choice): PromptCompletionFinishReason {
    switch (choice?.finish_reason) {
        case 'length':
            return 'length';
        case 'stop':
            return 'stop';
        case 'content_filter':
            return 'filtered';
        case 'tool_calls':
        case 'function_call':
            return 'tool_call';
        default:
            return 'unknown';
    }
}