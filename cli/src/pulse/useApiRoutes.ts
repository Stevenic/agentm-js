import { listPages } from "../pages";
import { hasConfiguredSettings, loadSettings, saveSettings } from "../settings";
import { Application } from 'express';
import { PulseConfig } from "./init";
import { availableModels, createCompletePrompt } from "./createCompletePrompt";
import { generateDefaultImage, generateImage } from "./generateImage";
import { chainOfThought } from "agentm-core";

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
    app.post('/api/generate/image', async (req, res) => {
        try {
            // Ensure settings configured
            const { prompt, shape, style } = req.body;
            const isConfigured = await hasConfiguredSettings(config.pagesFolder);
            if (!isConfigured) {
                res.status(400).send('Settings not configured');
                return;
            }

            // Generate image
            const { serviceApiKey, imageQuality, model } = await loadSettings(config.pagesFolder);
            const response = model.startsWith('gpt-') ?
                await generateImage({ apiKey: serviceApiKey, prompt, shape, quality: imageQuality, style }) :
                await generateDefaultImage();
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

    // Define a route to generate a completion using chain-of-thought
    app.post('/api/generate/completion', async (req, res) => {
        try {
            // Ensure settings configured
            const isConfigured = await hasConfiguredSettings(config.pagesFolder);
            if (!isConfigured) {
                res.status(400).send('Settings not configured');
                return;
            }

            // Generate completion
            const { prompt, temperature } = req.body;
            const { maxTokens } = await loadSettings(config.pagesFolder);
            const completePrompt = await createCompletePrompt(config.pagesFolder, req.body.model);
            const response = await chainOfThought({ question: prompt, temperature, maxTokens, completePrompt });
            if (response.completed) {
                res.json(response.value ?? {});
            } else {
                console.error(response.error);
                res.status(500).send(response.error?.message);
            }
        } catch (err: unknown) {
            console.error(err);
            res.status(500).send((err as Error).message);
        }
    });
}