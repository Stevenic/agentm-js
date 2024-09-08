import * as fs from 'fs/promises';

export async function checkIfExists(path: string): Promise<boolean> {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
}

export async function copyFiles(srcFolder: string, destFolder: string): Promise<void> {
    await ensureFolderExists(destFolder);

    const files = await fs.readdir(srcFolder);
    for (const file of files) {
        const srcPath = `${srcFolder}/${file}`;
        const destPath = `${destFolder}/${file}`;
        await fs.copyFile(srcPath, destPath);
    }
}

export async function ensureFolderExists(path: string): Promise<void> {
    await fs.mkdir(path, { recursive: true });
}

export async function listFiles(path: string): Promise<string[]> {
    return (await fs.readdir(path)).filter(file => !file.startsWith('.') && file.includes('.'));
}

export async function loadFile(path: string): Promise<string> {
    return await fs.readFile(path, 'utf8');
}

export async function saveFile(path: string, content: string): Promise<void> {
    await fs.writeFile(path, content, 'utf8');
}

export async function deleteFile(path: string): Promise<void> {
    await fs.unlink(path);
}
