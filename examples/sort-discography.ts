import { openai, sortList } from "agentm";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI 
const apiKey = process.env.OPENAI_API_KEY!;
const model = 'gpt-4o-mini';
const completePrompt = openai({ apiKey, model });

// Create randomized list of rushes studio albums
const list = [
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

// Sort list of rush studio albums chronologically
const logExplanations = true;
const parallelCompletions = 1;
const goal = `Sort the list of rush studio albums chronologically from oldest to newest.`;
sortList({goal, list, parallelCompletions, logExplanations, completePrompt }).then(result => {;
    if (result.completed) {
        result.value!.forEach((item, index) => console.log(`${index + 1}. ${item}`));
    } else {
        console.error(result.error);
    }
});