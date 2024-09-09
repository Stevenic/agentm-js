import { AgentArgs, AgentCompletion, generateObject, JsonSchema } from "agentm-core";

export interface TransformPageArgs extends AgentArgs {
    pageState: string;
    message: string;
    maxTokens: number;
    instructions?: string;
}

export async function transformPage(args: TransformPageArgs): Promise<AgentCompletion<string>> {
    // Provide additional context
    const { pageState, message, maxTokens, instructions, completePrompt, shouldContinue } = args;
    const context = `<CURRENT_PAGE>\n${pageState}\n\n<SERVER_APIS>\n${serverAPIs}\n\n<USER_MESSAGE>\n${message}`;

    // Generate next page
    const result = await generateObject<HtmlPage>({ goal, jsonSchema, maxTokens, context, instructions, completePrompt, shouldContinue });
    if (result.completed) {
        return { completed: true, value: result.value?.content! };
    } else {
        return { completed: false, error: result.error };
    }
}

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

const goal =
`Generate a new web page that represents the next state of the chat based on the users message.
Append the the users message and a brief response from the AI to the chat panel.
Maintain the full conversation history in the chat panel unless asked to clear it.
Any details or visualizations should be rendered to the viewer panel.
The basic layout structure of the page needs to be maintained.
You're free to write any additional CSS or JavaScript to enhance the page.
Write an explication of your reasoning or any hidden thoughts to the thoughts div.`;

const serverAPIs =
`GET /api/data/:table
description: Retrieve all rows from a table
response: Array of JSON rows [{ id: string, ... }]

GET /api/data/:table/:id
description: Retrieve a single row from a table
response: JSON row { id: string, ... }

POST /api/data/:table/:id
description: Save a single row to a table
request: JSON row { id: string, ... }
response: { success: true }

DELETE /api/data/:table/:id
description: Delete a single row from a table
response: { success: true }

GET /api/pages
description: Retrieve a list of all pages
response: Array of page names [string]`;
