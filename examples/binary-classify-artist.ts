import { openai, binaryClassifyList } from "agentm-core";
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

// Identify each artist's genre
const parallelCompletions = 3;
const goal = `Has the artist had a #1 hit within the last 5 years?`;
binaryClassifyList({goal, list, parallelCompletions, completePrompt }).then(result => {;
    if (result.completed) {
        console.log("Artists with a #1 hit within the last 5 years:");
        result.value!.filter(entry => entry.matches).forEach(entry => console.log(entry.item));
    } else {
        console.error(result.error);
    }
});