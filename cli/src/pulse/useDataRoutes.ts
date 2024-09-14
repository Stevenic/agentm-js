import { Application } from 'express';
import { PulseConfig } from "./init";
import { checkIfExists, deleteFile, ensureFolderExists, listFiles, loadFile, saveFile } from "../files";
import path from "path";
import { v4 } from "uuid";
import { clearCachedScripts } from '../scripts';

export function useDataRoutes(config: PulseConfig, app: Application): void {
    // Retrieve all rows from a table
    app.get('/api/data/:table', async (req, res) => {
        // Get list of row ids
        const { table } = req.params;
        const folder = await tableFolder(config, table);
        const ids = (await listFiles(folder)).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
        
        // Enumerate all rows
        const rows: Record<string, any>[] = [];
        for (const id of ids) {
            const file = recordFile(folder, id);
            try {
                const row = JSON.parse(await loadFile(file));
                row.id = id;
                rows.push(row);
            } catch (err: unknown) {
                console.error(err);
            }
        }
        
        // Return rows
        res.json(rows);
    });

    // Retrieve a single row from a table
    app.get('/api/data/:table/:id', async (req, res) => {
        const { table, id } = req.params;
        const folder = await tableFolder(config, table);
        const file = recordFile(folder, id);
        try {
            const row = JSON.parse(await loadFile(file));
            row.id = id;
            res.json(row);
        } catch (err: unknown) {
            res.json({});
        }
    });

    // Upsert a single row into a table
    app.post('/api/data/:table', async (req, res) => {
        const { table } = req.params;
        const id = req.body.id ?? v4();
        const folder = await tableFolder(config, table);
        const file = recordFile(folder, id);
        try {
            const row = { ...req.body, id };
            await ensureFolderExists(folder);
            await saveFile(file, JSON.stringify(row, null, 4));
            if (table === 'scripts') {
                clearCachedScripts();
            }
            res.json(row);
        } catch (err: unknown) {
            console.error(err);
            res.status(500).send((err as Error).message);
        }
    });

    // Delete a single row from a table
    app.delete('/api/data/:table/:id', async (req, res) => {
        const { table, id } = req.params;
        const folder = await tableFolder(config, table);
        const file = recordFile(folder, id);
        try {
            if (await checkIfExists(file)) {
                await deleteFile(file);

                // Clear cached scripts
                if (table === 'scripts') {
                    clearCachedScripts();
                }
            }
            res.json({ success: true });
        } catch (err: unknown) {
            console.error(err);
            res.status(500).send((err as Error).message);
        }
    });
}

async function tableFolder(config: PulseConfig, table: string): Promise<string> {
    const folder = path.join(config.pagesFolder, table);
    await ensureFolderExists(folder);
    return folder;
}

function recordFile(folder: string, id: string): string {
    return path.join(folder, `${id}.json`);
}
