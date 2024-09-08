import { openai, reduceList } from "agentm-core";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI
const apiKey = process.env.OPENAI_API_KEY!;
const model = 'gpt-4o-2024-08-06';
const completePrompt = openai({ apiKey, model });

// Mock up purchase data
const list = [
    {
        order_date: '2022-01-01',
        items: [
            { description: 'graphic tee', quantity: 1, unit_price: 19.95, total: 19.95 },
        ]
    },
    { 
        order_date: '2022-01-01',
        items: [
            { description: 'graphic tee', quantity: 2, unit_price: 19.95, total: 39.90 },
            { description: 'jeans', quantity: 1, unit_price: 59.95, total: 59.95 },
            { description: 'sneakers', quantity: 1, unit_price: 79.95, total: 79.95 },
            { description: 'jacket', quantity: 1, unit_price: 99.95, total: 99.95 }
        ]
    },
    {
        order_date: '2022-01-02',
        items: [
            { description: 'mens polo', quantity: 1, unit_price: 39.95, total: 39.95 },
            { description: 'tan slacks', quantity: 1, unit_price: 49.95, total: 49.95 }
        ]
    },
    {
        order_date: '2022-01-03',
        items: [
            { description: 'sneakers', quantity: 1, unit_price: 79.95, total: 79.95 },
        ]
    },
    {
        order_date: '2022-01-03',
        items: [
            { description: 'graphic tee', quantity: 1, unit_price: 19.95, total: 19.95 },
            { description: 'sneakers', quantity: 1, unit_price: 79.95, total: 79.95 }
        ]
    }
];

// Sum up the total quantity and price
const goal = `Count the number of orders with complete outfits where an outfit is pants and a shirt.`;
const initialValue = { count: 0 };
reduceList({goal, list, initialValue, completePrompt }).then(result => {;
    if (result.completed) {
        console.log(result.value);
    } else {
        console.error(result.error);
    }
});