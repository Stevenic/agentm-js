import express, {Application} from 'express';
import { usePageRoutes } from './usePageRoutes';
import { useApiRoutes } from './useApiRoutes';
import { PulseConfig } from './init';
import { useDataRoutes } from './useDataRoutes';

export function server(config: PulseConfig): Application {
    const app = express();
    
    // Middleware to parse URL-encoded data (form data)
    app.use(express.urlencoded({ extended: true }));

    // Middleware to parse JSON data
    app.use(express.json());

    // Page handling routes
    usePageRoutes(config, app);

    // API routes
    useApiRoutes(config, app);

    // Data routes
    useDataRoutes(config, app);
    
    return app;
}