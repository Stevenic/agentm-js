import { logCompletePrompt, mapList, openai } from "agentm";
import * as dotenv from "dotenv";
import * as fs from "fs";

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI 
const apiKey = process.env.apiKey!;
const model = 'gpt-4o-mini';
const completePrompt = logCompletePrompt(openai({ apiKey, model }), true);

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

const outputShape = { title: '<items title>', abstract: '<items abstract parsed from description>', link: '<items link>', pubDate: '<items publish date>' }; 

// Extract news feed from file
const parallelCompletions = 3;
const goal = `Map the item to the output shape.`;
mapList<NewsItem>({goal, list, outputShape, parallelCompletions, completePrompt, shouldContinue }).then(result => {;
    if (result.completed) {
        console.log(result.value);
    } else {
        console.error(result.error);
    }
});
