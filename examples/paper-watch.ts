import { openai, filterList, projectList } from "agentm";
import * as dotenv from "dotenv";
import fetch from 'node-fetch';

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI 
const apiKey = process.env.OPENAI_API_KEY!;
const model = 'gpt-4o-mini';
const completePrompt = openai({ apiKey, model });


// Define the projections template
const template = 
`# <title> (<pubDate in mm/dd/yyyy format>)
<abstract>
[Read more](<link>)`;

async function main() {
    // Fetch latest papers
    console.log(`\x1b[35;1mFetching latest papers from arxiv.org...\x1b[0m`);
    const data = await fetchUrl(`https://rss.arxiv.org/rss/cs.cl+cs.ai`);
    const feed = parseFeed(data);

    // Identify topics of interest
    const topics = process.argv[2] ?? `new prompting techniques or advances with agents`;
    console.log(`\x1b[35;1mFiltering papers by topics: ${topics}...\x1b[0m`);
    
    // Filter papers by topic
    const parallelCompletions = 3;
    const filterGoal = `Filter the list to only include papers related to ${topics}.`;
    const filtered = await filterList({goal: filterGoal, list: feed, parallelCompletions, completePrompt });
    if (!filtered.completed) {
        console.error(filtered.error);
        return;
    }

    // Generate projections
    console.log(`\x1b[35;1mGenerating projections for ${filtered.value!.length} of ${feed.length} papers...\x1b[0m`);
    const goal = `Map the news item to the template.`;
    const projections = await projectList({goal, list: filtered.value!, template, parallelCompletions, completePrompt })
    if (!projections.completed) {
        console.error(projections.error);
        return;
    }

    // Render papers
    projections.value!.forEach((entry) => console.log(`\x1b[32m${entry.projection}\x1b[0m\n\n${'='.repeat(80)}\n`));    
}

async function fetchUrl(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error('Error fetching the RSS feed:', error);
        process.exit(1);
    }
}

function parseFeed(data: string): string[] {
    // Extract items from feed
    const start = data.indexOf('<item>');
    const end = data.lastIndexOf('</item>') + '</item>'.length;
    const xml = data.slice(start, end);

    // Split news feed into list of news items
    const list = xml.split('</item>').map(item => item + '</item>');
    list.pop(); // Remove last empty item

    return list;
}

main();