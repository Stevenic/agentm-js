import { openai, classifyList } from "agentm-core";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI 
const apiKey = process.env.OPENAI_API_KEY!;
const model = 'gpt-4o-mini';
const completePrompt = openai({ apiKey, model });

// Create randomized list of artists (5 from each genre)
const list = [
    "Martin Garrix",
    "Carrie Underwood",
    "Queen",
    "Ariana Grande",
    "Dua Lipa",
    "Foo Fighters",
    "Calvin Harris",
    "Marshmello",
    "Nicki Minaj",
    "Justin Bieber",
    "Led Zeppelin",
    "Blake Shelton",
    "Luke Combs",
    "The Rolling Stones",
    "David Guetta",
    "The Beatles",
    "Taylor Swift",
    "Kendrick Lamar",
    "Eminem",
    "Drake",
    "Dolly Parton",
    "Tiesto",
    "Travis Scott",
    "Ed Sheeran",
    "Miranda Lambert"
];

// Create a list of categories formatted as <genre> - <description>
const categories = [
    "Pop - Popular music that appeals to a wide audience",
    "Country - Music that originated in the southern United States",
    "Rock - Music characterized by a strong beat and amplified instruments",
    "Electronic - Music produced using electronic devices",
    "Hip Hop - Music that features rap and a strong rhythmic beat"
];

// Identify each artist's genre
const parallelCompletions = 3;
const goal = `Identify the genre of each artist from the list.`;
classifyList({goal, list, categories, parallelCompletions, completePrompt }).then(result => {;
    if (result.completed) {
        result.value!.forEach((entry, index) => console.log(`${entry.item} - ${entry.category}`));
    } else {
        console.error(result.error);
    }
});