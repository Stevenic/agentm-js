import { generateObject, JsonSchema, openai } from 'agentm';
import express from 'express';
import path from 'path';
import fs from 'fs';
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI 
const apiKey = process.env.OPENAI_API_KEY!;
//const model = 'gpt-4o-mini';
const model = 'gpt-4o-2024-08-06';
const completePrompt = openai({ apiKey, model });

const app = express();
const PORT = 3000;

// Middleware to parse URL-encoded data (form data)
app.use(express.urlencoded({ extended: true }));

// Define a route to serve a fetched page
app.get('/', (req, res) => {
    const reset = req.query.reset === 'true';
    const pageState = loadPageState('index', reset);
    if (!pageState) {
        res.status(404).send('Page not found');
        return;
    }

    // Check for save-as
    if (req.query['save-as']) {
        // Format save-as page name to be all lowercase and not have spaces or special characters
        const name = (req.query['save-as'] as string).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        savePageState(name, pageState);
        res.redirect(`/${name}`);
    } else if (reset) {
        res.redirect('/');
    } else {
        res.send(pageState);
    }
});

app.get('/:page', (req, res) => {
    const { page } = req.params;
    const reset = req.query.reset === 'true';
    const pageState = loadPageState(page, reset);
    if (!pageState) {
        res.redirect('/');
        return;
    }

    // Check for save-as
    if (req.query['save-as']) {
        // Format save-as page name to be all lowercase and not have spaces or special characters
        const name = (req.query['save-as'] as string).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        savePageState(name, pageState);
        res.redirect(`/${name}`);
    } else if (reset) {
        res.redirect(`/${page}`);
    } else {
        res.send(pageState);
    }
});

// Handle POST request from the chat form
app.post('/', async (req, res) => {
    // Fetch current page state
    let pageState = loadPageState('index', false);
    if (!pageState) {
        res.status(404).send('Page not found');
        return;
    }

    // Generate next pageState based on user input
    const { message } = req.body; // Extract the message from the request body
    pageState = await generateNextPage(pageState, message);

    // Update and return the page state
    updatePageState('index', pageState);
    res.send(pageState);
});

app.post('/:page', async (req, res) => {
    // Fetch current page state
    const { page } = req.params;
    let pageState = loadPageState(page, false);
    if (!pageState) {
        res.status(404).send('Page not found');
        return;
    }

    // Generate next pageState based on user input
    const { message } = req.body; // Extract the message from the request body
    pageState = await generateNextPage(pageState, message);

    // Update and return the page state
    updatePageState(page, pageState);
    res.send(pageState);
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Define output shape
interface HtmlPage {
    content: string;
}

const jsonSchema: JsonSchema = {
    name: 'HtmlPage',
    schema: {
        type: 'object',
        properties: {
            content: {
                type: 'string',
                description: 'html page content to return'
            }
        },
        required: ['content'],
        additionalProperties: false
    },
    strict: true
};

const pageGoal =
`Generate a new web page that represents the next state of the chat based on the users message.
Update the chat panel with the users message and return a brief response from the AI. Only add the next message pair to the chat panel. 
Limit the total number of messages displayed in the panel to 50.
Any details or visualizations should be rendered to the viewer panel.
The basic layout structure of the page needs to be maintained.
You're free to write any additional CSS or JavaScript to enhance the page.
Use the following libraries when generating interactive elements:

- D3 for data visualizations. Use a different color for each dimension but base your colors off the pages color scheme.
- marked for markdown rendering and code highlighting.
- mermaid for diagrams.

Write an explication of your reasoning or any hidden thoughts to the thoughts div.`;

async function generateNextPage(pageState: string, message: string): Promise<string> {
    // Provide additional context
    const context = `<CURRENT_PAGE>\n${pageState}\n\n<USER_MESSAGE>\n${message}`;

    // Generate next page
    const maxTokens = 12000;
    const goal = pageGoal;
    const result = await generateObject<HtmlPage>({ goal, jsonSchema, maxTokens, context, completePrompt });
    if (result.completed) {
        return result.value?.content!;
    } else {
        throw result.error;
    }
}


// Page State Cache
const pages: { [name: string]: string } = {};

function loadPageState(name: string, reset: boolean): string|undefined {
    if (!pages[name] || reset) {
        if (!fs.existsSync(path.join(__dirname, 'pulse', `${name}.html`))) {
            return undefined;
        }
        pages[name] = fs.readFileSync(path.join(__dirname, 'pulse', `${name}.html`), 'utf8');
    }

    return pages[name];
}

function savePageState(name: string, content: string) {
    pages[name] = content;
    fs.writeFileSync(path.join(__dirname, 'pulse', `${name}.html`), content);
}

function updatePageState(name: string, content: string) {
    pages[name] = content;
}