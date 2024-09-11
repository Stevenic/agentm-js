import OpenAI from "openai";
import { AgentCompletion, RequestError } from "agentm-core";
import { loadFile } from "../files";
import path from "path";

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

export function generateDefaultImage(): Promise<AgentCompletion<GeneratedImage>> {
    if (!_defaultImage) {
        _defaultImage = new Promise<AgentCompletion<GeneratedImage>>(async resolve => {
            const file = await loadFile(path.join(__dirname, '../../defaultImage.json'));
            const value = JSON.parse(file) as GeneratedImage;
            resolve({ completed: true, value });
        });
    }

    return _defaultImage;
}

export async function generateImage(args: OpenaiGenerateImageArgs): Promise<AgentCompletion<GeneratedImage>> {
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
            response_format: "b64_json",
            n: 1,
            prompt,
            size,
            quality,
            style
        });
    
        if (response.data.length > 0 && response.data[0].b64_json !== undefined) {
            const url = `data:image/png;base64,${response.data[0].b64_json}`
            return { completed: true, value: { url } };
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

let _defaultImage: Promise<AgentCompletion<GeneratedImage>> | undefined;