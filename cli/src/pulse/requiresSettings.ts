import { hasConfiguredSettings, loadSettings, Settings } from "../settings";


export async function requiresSettings(res: any, folder: string, cb: (settings: Settings) => Promise<void>) {
    try {
        // Ensure settings configured
        const isConfigured = await hasConfiguredSettings(folder);
        if (!isConfigured) {
            res.status(400).send('Settings not configured');
            return;
        }

        // Load settings
        const settings = await loadSettings(folder);

        // Call the callback
        await cb(settings);
    } catch (err: unknown) {
        console.error(err);
        res.status(500).send((err as Error).message);
    }
}