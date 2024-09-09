import { listPages } from "../pages";
import { hasConfiguredSettings, loadSettings, saveSettings } from "../settings";
import { Application } from 'express';
import { PulseConfig } from "./init";
import { availableModels } from "./createCompletePrompt";
import { openaiGenerateImage } from "./openaiGenerateImage";

export function useApiRoutes(config: PulseConfig, app: Application): void {
    // List pages
    app.get('/api/pages', async (req, res) => {
        const pages = await listPages(config.pagesFolder, config.requiredPagesFolder);
        res.json(pages);
    });

    // Define a route to return settings
    app.get('/api/settings', async (req, res) => {
        const settings = await loadSettings(config.pagesFolder);
        res.json({...settings, availableModels});
    });

    // Define a route to save settings
    app.post('/api/settings', async (req, res) => {
        try {
            // Covert non-string values
            const settings = req.body as Record<string, any>;
            if (typeof settings.maxTokens === 'string') {
                settings.maxTokens = parseInt(settings.maxTokens);
            }
            if (typeof settings.logCompletions === 'string') {
                settings.logCompletions = settings.logCompletions === 'true';
            }

            // Save settings
            await saveSettings(config.pagesFolder, settings);
            res.redirect('/home');
        } catch (err: unknown) {
            console.error(err);
            res.status(500).send((err as Error).message);
        }
    });

    // Define a route to generate an image
    app.post('/api/generate-image', async (req, res) => {
        try {
            // Ensure settings configured
            const { prompt, shape, style } = req.body;
            const isConfigured = await hasConfiguredSettings(config.pagesFolder);
            if (!isConfigured) {
                res.status(400).send('Settings not configured');
                return;
            }

            // Generate image
            const { openaiApiKey, imageQuality } = await loadSettings(config.pagesFolder);
            const response = await openaiGenerateImage({ apiKey: openaiApiKey, prompt, shape, quality: imageQuality, style });
            if (response.completed) {
                res.json(response.value);
            } else {
                res.status(500).send(response.error?.message);
            }
        } catch (err: unknown) {
            console.error(err);
            res.status(500).send((err as Error).message);
        }
    });
}