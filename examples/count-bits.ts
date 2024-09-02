import { openai, reduceList } from "agentm";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI
const apiKey = process.env.apiKey!;
const model = 'gpt-4o-2024-08-06';
const completePrompt = openai({ apiKey, model });

// Create cancellation token
const shouldContinue = () => true;

// Define a binary number
const list = [1,0,1,1,1,1,0,0,0,1,0,1,0,1,1,1,1,1];

// Count number of even bits that are set to 1
async function countBits() {
    // First count even bits
    let goal = `Count the number of even bits that are set to 1. The index represents the bit position.`;
    let initialValue = { count: 0 };
    let results = await reduceList({goal, list, initialValue, completePrompt, shouldContinue });
    console.log(`Even Bits: ${results.value!.count}`);

    // Now count odd bits
    goal = `Count the number of odd bits that are set to 1. The index represents the bit position.`;
    initialValue = { count: 0 };
    results = await reduceList({goal, list, initialValue, completePrompt, shouldContinue });
    console.log(`Odd Bits: ${results.value!.count}`);
}

countBits();