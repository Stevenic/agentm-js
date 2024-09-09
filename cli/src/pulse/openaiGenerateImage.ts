import OpenAI from "openai";
import { AgentCompletion, RequestError } from "agentm-core";

/**
 * Arguments to configure an OpenAI chat model.
 */
export interface OpenaiGenerateImageArgs {
    /**
     * OpenAI API key to use for completions.
     */
    apiKey: string;

    /**
     * Prompt to use for generating image.
     */
    prompt: string;

    /**
     * Requested size of the generated image.
     */
    shape: 'square' | 'landscape' | 'portrait';

    /**
     * Requested quality of the generated image.
     */
    quality: 'standard' | 'hd';

    /**
     * Style of the generated image.
     */
    style: 'vivid' | 'natural';
}

export interface GeneratedImage {
    url: string;
}

export async function openaiGenerateImage(args: OpenaiGenerateImageArgs): Promise<AgentCompletion<GeneratedImage>> {
    const { apiKey, prompt, shape, quality, style } = args;

    // Create client
    const client = new OpenAI({ apiKey });

    // Identify image size
    let size: "1024x1024" | "1792x1024" | "1024x1792";
    switch (shape) {
        case 'square':
        default:
            size = "1024x1024";
            break;
        case 'landscape':
            size = "1792x1024";
            break;
        case 'portrait':
            size = "1024x1792";
            break;
    }

    try {
        const response = await client.images.generate({
            model: "dall-e-3",
            n: 1,
            prompt,
            size,
            quality,
            style
        });
    
        if (response.data.length > 0 && response.data[0].url !== undefined) {
            return { completed: true, value: { url: response.data[0].url } };
        } else {
            return { completed: false, error: new Error('No image URL returned') };
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