import {anthropic, completePrompt, logCompletePrompt, openai} from 'agentm-core';
import { loadSettings } from '../settings';

export const availableModels = [
    'claude-3-5-sonnet-20240620',
    'gpt-4o-mini',
    'gpt-4o-2024-08-06'
];

export async function createCompletePrompt(pagesFolder: string, model?: string): Promise<completePrompt> {
    // Get configuration settings
    const settings = await loadSettings(pagesFolder);
    if (!settings.serviceApiKey) {
        throw new Error('OpenAI API key not configured');
    }

    // Validate model
    model = model || settings.model;
    if (!model) {
        throw new Error('Model not configured');
    }

    // Create completion functions
    let modelInstance: completePrompt;
    const apiKey = settings.serviceApiKey;
    if (model.startsWith('claude-')) {
        modelInstance = anthropic({apiKey, model});
    } else {
        modelInstance = openai({apiKey, model});
    }

    // Return new model instance
    if (settings.logCompletions) {
        return logCompletePrompt(modelInstance, true);
    } else {
        return modelInstance;
    }
}