import OpenAI from "openai";
import { AgentCompletion, completePrompt, PromptCompletionArgs } from "../types";
import { RequestError } from "../RequestError";

export interface OpenaiArgs {
    apiKey: string;
    model: string;
    baseURL?: string;
    organization?: string;
    project?: string;
}

export function openai(args: OpenaiArgs): completePrompt {
    const { apiKey, model, baseURL, organization, project } = args;

    const client = new OpenAI({ apiKey, baseURL, organization, project });

    return  (args) => {
        if (args.useJSON) { 
            return openaiJsonChatCompletion(client, model, args);
        } else {
            return openaiChatCompletion(client, model, args);
        }
    };
}

export async function openaiChatCompletion(client: OpenAI, model: string, args: PromptCompletionArgs): Promise<AgentCompletion<string>> {
    const { prompt, system, history, temperature } = args;

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

        // Return completion
        return { completed: true, value: response.choices[0]?.message.content ?? '' };
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


export async function openaiJsonChatCompletion<TResult>(client: OpenAI, model: string, args: PromptCompletionArgs): Promise<AgentCompletion<TResult>> {
    const { prompt, system, history, temperature } = args;

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

        // Check if the conversation was too long for the context window, resulting in incomplete JSON 
        if (response.choices[0]?.finish_reason === "length") {
            return { completed: false, error: new Error("The conversation was too long for the context window.") };
        }

        // Check if the model's output included restricted content, so the generation of JSON was halted and may be partial
        if (response.choices[0]?.finish_reason === "content_filter") {
            return { completed: false, error: new Error("The model's output included restricted content.") };
        }

        if (response.choices[0]?.finish_reason === "stop") {
            const value = JSON.parse(response.choices[0].message.content!);
            return { completed: true, value };
        } else {
            return { completed: false, error: new Error("The model did not properly complete the request.") };
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