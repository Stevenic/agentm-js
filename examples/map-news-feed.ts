import { mapList, openai, JsonSchema } from "agentm";
import * as dotenv from "dotenv";
import * as fs from "fs";

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI 
const apiKey = process.env.apiKey!;
const model = 'gpt-4o-mini';
const completePrompt = openai({ apiKey, model });

// Create cancellation token
const shouldContinue = () => true;

// Read file from ./data/news-feed.xml
const file = fs.readFileSync('./data/news-feed.xml', 'utf8');
const start = file.indexOf('<item>');
const end = file.lastIndexOf('</item>') + '</item>'.length;
const xml = file.slice(start, end);

// Split news feed into list of news items
const list = xml.split('</item>').map(item => item + '</item>');
list.pop(); // Remove last empty item

// Define output shape
interface NewsItem {
    title: string;
    abstract: string;
    link: string;
    pubDate: string;
}

const jsonSchema: JsonSchema = {
    name: 'NewsItem',
    schema: {
        type: 'object',
        properties: {
            title: { 
                type: 'string',
                description: 'items title' 
            },
            abstract: { 
                type: 'string',
                description: 'items abstract parsed from description' 
            },
            link: { 
                type: 'string',
                description: 'items link' 
            },
            pubDate: { 
                type: 'string',
                description: 'items publish date', 
            }
        },
        required: ['title', 'abstract', 'link', 'pubDate'],
        additionalProperties: false
    },
    strict: true
};

// Extract news feed from file
const parallelCompletions = 3;
const goal = `Map the item to the output shape.`;
mapList<NewsItem>({goal, list, jsonSchema, parallelCompletions, completePrompt, shouldContinue }).then(result => {;
    if (result.completed) {
        console.log(result.value);
    } else {
        console.error(result.error);
    }
});
