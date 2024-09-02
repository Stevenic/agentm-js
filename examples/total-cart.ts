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

// Mock up shopping cart data
const list = [
    { description: 'graphic tee', quantity: 2, unit_price: 19.95, total: 39.90 },
    { description: 'jeans', quantity: 1, unit_price: 59.95, total: 59.95 },
    { description: 'sneakers', quantity: 1, unit_price: 79.95, total: 79.95 },
    { description: 'jacket', quantity: 1, unit_price: 99.95, total: 99.95 }
];

// Sum up the total quantity and price
const goal = `Sum the quantity and total columns.`;
const initialValue = { quantity: 0, total: 0 };
reduceList({goal, list, initialValue, completePrompt, shouldContinue }).then(result => {;
    if (result.completed) {
        console.log(result.value);
    } else {
        console.error(result.error);
    }
});