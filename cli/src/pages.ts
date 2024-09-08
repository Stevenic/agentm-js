import {checkIfExists, listFiles, loadFile, saveFile} from './files';
import path from 'path';

// Page State Cache
const _pages: { [name: string]: string } = {};

export async function listPages(pagesFolder: string, fallbackPagesFolder: string): Promise<string[]> {
    // Load all pages from primary pages folder
    const all = (await listFiles(pagesFolder)).filter(file => file.endsWith('.html'));

    // Add pages from fallback pages folder that don't already exist
    (await listFiles(fallbackPagesFolder)).forEach(file => {
        if (file.endsWith('.html') && !all.includes(file)) {
            all.push(file);
        }
    });

    // Remove .html and sort all files
    const sorted = all.map(file => file.substring(0, file.length - 5)).sort();
    
    // Move [templates] to end of array
    const pages = sorted.filter(page => !page.startsWith('['));
    const templates = sorted.filter(page => page.startsWith('['));
    pages.push(...templates);

    return pages;
}

export async function loadPageState(pagesFolder: string, name: string, reset: boolean): Promise<string|undefined> {
    if (!_pages[name] || reset) {
        // Check for file to exist
        const filename = path.join(pagesFolder, `${name}.html`);
        if (!(await checkIfExists(filename))) {
            return undefined;
        }

        // Load file
        _pages[name] = await loadFile(filename);
    }

    return _pages[name];
}

export function normalizePageName(name: string|undefined): string|undefined {
    return typeof name == 'string' && name.length > 0 ? name.replace(/[^a-z0-9\-_\[\]\(\)\{\}@#\$%&]/gi, '_').toLowerCase() : undefined;
}

export async function savePageState(pagesFolder: string, name: string, content: string): Promise<void> {
    _pages[name] = content;
    await saveFile(path.join(pagesFolder, `${name}.html`), content);
}

export function updatePageState(name: string, content: string): void {
    _pages[name] = content;
}