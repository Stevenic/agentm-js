import {checkIfExists, loadFile, saveFile} from './files';
import path from 'path';

let _settings: Partial<Settings>|undefined;

export interface Settings {
    serviceApiKey: string;
    model: string;
    maxTokens: number;
    imageQuality: 'standard' | 'hd';
    instructions?: string;
    logCompletions?: boolean;
}

export const DefaultSettings: Settings = {
    serviceApiKey: '',
    model: '',
    maxTokens: 8000,
    imageQuality: 'standard',
    instructions: '',
    logCompletions: false
};

export async function hasConfiguredSettings(folder: string): Promise<boolean> {
    const settings = await loadSettings(folder);
    if (typeof settings.serviceApiKey !== 'string' || settings.serviceApiKey.length == 0) {
        return false;
    }
    if (typeof settings.model !== 'string' || settings.model.length == 0) {
        return false;
    }
    if (typeof settings.maxTokens !== 'number' || settings.maxTokens <= 0) {
        return false;
    }

    return true;    
}

export async function loadSettings(folder: string): Promise<Settings> {
    if (_settings == undefined) {
        // Check for file to exist
        const filename = path.join(folder, 'settings.json');
        if (await checkIfExists(filename)) {
            try {
                // Load and parse file
                _settings = JSON.parse(await loadFile(filename));
            } catch {
                // Invalid JSON
            }
        }
    }

    // Return settings from file
    return {...DefaultSettings, ..._settings};
}

export async function saveSettings(folder: string, settings: Partial<Settings>): Promise<void> {
    _settings = {..._settings, ...settings};
    await saveFile(path.join(folder, 'settings.json'), JSON.stringify(_settings, null, 4));
}
