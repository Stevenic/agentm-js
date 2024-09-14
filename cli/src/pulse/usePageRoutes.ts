import { loadPageState, normalizePageName, savePageState, updatePageState } from "../pages";
import { hasConfiguredSettings, loadSettings } from "../settings";
import { Application } from 'express';
import { transformPage, transformPageAsObject } from "./transformPage";
import { PulseConfig } from "./init";
import { createCompletePrompt } from "./createCompletePrompt";
import { completePrompt } from "agentm-core";

const HOME_PAGE_ROUTE = '/home';
const PAGE_NOT_FOUND = 'Page not found';

export function usePageRoutes(config: PulseConfig, app: Application): void {
    // Redirect / to /home page
    app.get('/', (req, res) => res.redirect(HOME_PAGE_ROUTE));
    
    // Page retrieval
    app.get('/:page', async (req, res) => {
        // Redirect if settings not configured
        const { page } = req.params;
        const isConfigured = await hasConfiguredSettings(config.pagesFolder);
        if (!isConfigured && page !== 'settings') {
            res.redirect('/settings');
            return;
        }

        // Ensure page exists
        const pageState = await loadPageWithFallback(page, config, false);
        if (!pageState) {
            res.status(404).send(PAGE_NOT_FOUND);
            return;
        }

        res.send(pageState);
    });

    // Page reset
    app.get('/:page/reset', async (req, res) => {
        // Redirect if settings not configured
        const { page } = req.params;
        const isConfigured = await hasConfiguredSettings(config.pagesFolder);
        if (!isConfigured) {
            res.redirect('/settings');
            return;
        }

        // Ensure page exists
        const pageState = await loadPageWithFallback(page, config, true);
        if (!pageState) {
            res.status(404).send(PAGE_NOT_FOUND);
            return;
        }

        res.redirect(`/${page}`);
    });

    // Page save
    app.get('/:page/save', async (req, res) => {
        // Redirect if settings not configured
        const { page } = req.params;
        const isConfigured = await hasConfiguredSettings(config.pagesFolder);
        if (!isConfigured) {
            res.redirect('/settings');
            return;
        }

        // Normalize and validate save-as parameter
        const saveAs = normalizePageName(req.query['name'] as string);
        if (!saveAs) {
            res.status(400).send('Invalid or missing name parameter');
            return;
        }

        // Load page state
        const pageState = await loadPageWithFallback(page, config, false);
        if (!pageState) {
            res.status(404).send(PAGE_NOT_FOUND);
            return;
        }

        // Save as new page and redirect to saved page
        await savePageState(config.pagesFolder, saveAs, pageState);
        res.redirect(`/${saveAs}`);
    });

    // Page transformation
    app.post('/:page', async (req, res) => {
        try {
            // Ensure settings configured
            const { page } = req.params;
            const isConfigured = await hasConfiguredSettings(config.pagesFolder);
            if (!isConfigured) {
                res.status(400).send('Settings not configured');
                return;
            }

            // Ensure page exists
            const pageState = await loadPageWithFallback(page, config, false);
            if (!pageState) {
                res.status(404).send(PAGE_NOT_FOUND);
                return;
            }

            // Get required and optional parameters
            const { message } = req.body; // Extract the message from the request body
            if (typeof message !== 'string') {
                res.status(400).send('Invalid or missing message parameter');
                return;
            }

            // Create model instance
            const innerCompletePrompt = await createCompletePrompt(config.pagesFolder, req.body.model);
            const completePrompt: completePrompt = (args) => {
                // console.log(`SYSTEM:\n${args.system!.content}`);
                // console.log(`PROMPT:\n${args.prompt!.content}`);
                return innerCompletePrompt(args);
            }


            // Transform and cache updated page 
            const pagesFolder = config.pagesFolder;
            const { maxTokens, instructions, model } = await loadSettings(config.pagesFolder);
            const result = model.startsWith('gpt-') ? 
                await transformPageAsObject({ pagesFolder, pageState, message, maxTokens, instructions, completePrompt }) :
                await transformPage({ pagesFolder, pageState, message, maxTokens, instructions, completePrompt });
            if (result.completed) {
                updatePageState(page, result.value!);
                res.send(result.value!);
            } else {
                throw result.error;
            }
        } catch (err: unknown) {
            console.error(err);
            res.status(500).send((err as Error).message);
        }
    });
}

export async function loadPageWithFallback(page: string, config: PulseConfig, reset: boolean): Promise<string|undefined> {
    // Try primary pages folder first
    const pageState = await loadPageState(config.pagesFolder, page, reset);
    if (pageState) {
        return pageState;
    }

    // Try fallback pages folder second
    return loadPageState(config.requiredPagesFolder, page, reset);
}
