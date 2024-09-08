import {completePrompt, logCompletePrompt, openai} from 'agentm-core';
import { loadSettings } from '../settings';

export const availableModels = [
    'gpt-4o-mini',
    'gpt-4o-2024-08-06'
];

export async function createCompletePrompt(pagesFolder: string, model?: string): Promise<completePrompt> {
    // Get configuration settings
    const settings = await loadSettings(pagesFolder);
    if (!settings.openaiApiKey) {
        throw new Error('OpenAI API key not configured');
    }

    // Validate model
    model = model || settings.model;
    if (!model) {
        throw new Error('Model not configured');
    }

    // Return new model instance
    const apiKey = settings.openaiApiKey;
    if (settings.logCompletions) {
        return logCompletePrompt(openai({apiKey, model}), true);
    } else {
        return openai({apiKey, model});
    }
}