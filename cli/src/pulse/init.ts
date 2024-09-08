import path from "path";
import { checkIfExists, copyFiles, ensureFolderExists, saveFile } from "../files";
import { DefaultSettings } from "../settings";

export interface PulseConfig {
    pagesFolder: string;
    fallbackPagesFolder: string;
    examplePagesFolder: string;
}

export function createConfig(pagesFolder = '.agentm'): PulseConfig {
    return {
        pagesFolder: path.join(process.cwd(), pagesFolder),
        fallbackPagesFolder: path.join(__dirname, '../../required-pages'),
        examplePagesFolder: path.join(__dirname, '../../example-pages'),
    };
}

export async function init(config: PulseConfig, noExamples?: boolean): Promise<boolean> {
    // Check for existing folder
    if (await checkIfExists(config.pagesFolder)) {
        return false;
    }

    // Create pages folder
    await ensureFolderExists(config.pagesFolder);

    // Create mandatory files
    await saveFile(path.join(config.pagesFolder, '.gitignore'), 'settings.json\n');
    await saveFile(path.join(config.pagesFolder, 'settings.json'), JSON.stringify(DefaultSettings, null, 4));
    await saveFile(path.join(config.pagesFolder, 'settings.json.example'), JSON.stringify(DefaultSettings, null, 4));
    await copyFiles(config.fallbackPagesFolder, config.pagesFolder);

    // Copy pages
    if (noExamples !== true) {
        await copyFiles(config.examplePagesFolder, config.pagesFolder);
    }

    return true;
}
    