import { generateObject, JsonSchema, openai } from 'agentm';
import express from 'express';
import path from 'path';
import fs from 'fs';
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI 
const apiKey = process.env.OPENAI_API_KEY!;
const model = 'gpt-4o-2024-08-06';
const completePrompt = openai({ apiKey, model });

const app = express();
const PORT = 3000;

// Load page state from disk
let page_state = fs.readFileSync(path.join(__dirname, 'pulse', 'index.html'), 'utf8');

// Middleware to parse URL-encoded data (form data)
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "pulse" directory
app.use(express.static(path.join(__dirname, 'pulse')));

// Define a route to serve the static HTML page
app.get('/', (req, res) => {
    res.send(page_state);
});

// Handle POST request from the chat form
app.post('/', async (req, res) => {
    const { message } = req.body; // Extract the message from the request body
    console.log(`Received message: ${message}`);

    // Generate the next page based on the current page state and the user's message
    page_state = await generateNextPage(page_state, message);
    res.send(page_state);
});

app.get('/reset', (req, res) => {
    page_state = fs.readFileSync(path.join(__dirname, 'pulse', 'index.html'), 'utf8');
    res.redirect('/');
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
Update the chat panel with the users message and return brief response from the AI. Only add the next message pair to the chat panel. 
Limit the total number of messages displayed in the panel to 20.
Any details or visualizations should be rendered to the viewer panel.
The basic layout structure of the page needs to be maintained.
You're free to write any additional CSS or JavaScript to enhance the page.
Use the following libraries when generating interactive elements:

- D3 for data visualizations.
- marked for markdown rendering.
- mermaid for diagrams.
- katex for math rendering.`;

async function generateNextPage(page_state: string, message: string): Promise<string> {
    // Provide additional context
    const context = `<CURRENT_PAGE>\n${page_state}\n\n<USER_MESSAGE>\n${message}`;

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