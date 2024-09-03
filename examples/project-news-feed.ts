import { openai, projectList } from "agentm";
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

// Define the projections template
const template = 
`# <title> (<pubDate in mm/dd/yyyy format>)
<abstract>
[Read more](<link>)`;


// Summarize the items in the news feed
const parallelCompletions = 3;
const goal = `Map the news item to the template.`;
projectList({goal, list, template, parallelCompletions, completePrompt, shouldContinue }).then(result => {;
    if (result.completed) {
        result.value!.forEach((entry) => console.log(`\x1b[32m${entry.projection}\x1b[0m\n${'='.repeat(80)}`));
    } else {
        console.error(result.error);
    }
});
