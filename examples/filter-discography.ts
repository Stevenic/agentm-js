import { openai, filterList, sortList, mapList } from "agentm";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI 
const apiKey = process.env.apiKey!;
const model = 'gpt-4o-mini';
const completePrompt = openai({ apiKey, model });

// Create cancellation token
const shouldContinue = () => true;

// Create randomized list of rushes studio albums
const rushAlbums = [
    "Grace Under Pressure",
    "Hemispheres",
    "Permanent Waves",
    "Presto",
    "Clockwork Angels",
    "Roll the Bones",
    "Signals",
    "Rush",
    "Power Windows",
    "Fly by Night",
    "A Farewell to Kings",
    "2112",
    "Snakes & Arrows",
    "Test for Echo",
    "Caress of Steel",
    "Moving Pictures",
    "Counterparts",
    "Vapor Trails",
    "Hold Your Fire"
];

// Define output shape
interface AlbumDetails {
    title: string;
    details: string;
}

const jsonShape = { title: '<album title>', details: '<detailed summary of album including its release date>' }; 


// Filter and then sort list of albums chronologically
async function filterAndSortList() {
    // Filter list to only include albums from the 80's
    console.log(`\x1b[35;1mFiltering albums to the 80's...\x1b[0m`);
    const parallelCompletions = 3;
    const filterGoal = `Filter the list to only include rush albums released in the 1980's.`;
    const filtered = await filterList({goal: filterGoal, list: rushAlbums, parallelCompletions, completePrompt, shouldContinue });
    if (!filtered.completed) {
        console.error(filtered.error);
        return;
    }

    // Sort filtered list chronologically
    console.log(`\x1b[35;1mSorting albums chronologically...\x1b[0m`);
    const sortGoal = `Sort the list of rush studio albums chronologically from oldest to newest.`;
    const sorted = await sortList({goal: sortGoal, list: filtered.value!, parallelCompletions, completePrompt, shouldContinue });
    if (!sorted.completed) {
        console.error(sorted.error);
        return;
    }

    // Add in world knowledge
    console.log(`\x1b[35;1mGenerating album details...\x1b[0m`);
    const detailsGoal = `Map the item to the output shape.`;
    const details = await mapList<AlbumDetails>({goal: detailsGoal, list: sorted.value!, jsonShape, parallelCompletions, completePrompt, shouldContinue });
    if (!details.completed) {
        console.error(details.error);
        return;
    }

    // Print sorted list
    details.value!.forEach((item) => console.log(`Title: \x1b[32m${item.title}\x1b[0m\nDetails: \x1b[32m${item.details}\x1b[0m\n`));
}

filterAndSortList();