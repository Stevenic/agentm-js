import os
import asyncio
from openai import OpenAI
from agentm import reduce_list
from pydantic import BaseModel

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Initialize OpenAI
api_key = os.getenv('OPENAI_API_KEY')
model = 'gpt-4o-2024-08-06'
complete_prompt = OpenAI(api_key=api_key, model=model)

# Mock up purchase data
list_of_orders = [
    {
        'order_date': '2022-01-01',
        'items': [
            {'description': 'graphic tee', 'quantity': 1, 'unit_price': 19.95, 'total': 19.95},
        ]
    },
    { 
        'order_date': '2022-01-01',
        'items': [
            {'description': 'graphic tee', 'quantity': 2, 'unit_price': 19.95, 'total': 39.90},
            {'description': 'jeans', 'quantity': 1, 'unit_price': 59.95, 'total': 59.95},
            {'description': 'sneakers', 'quantity': 1, 'unit_price': 79.95, 'total': 79.95},
            {'description': 'jacket', 'quantity': 1, 'unit_price': 99.95, 'total': 99.95}
        ]
    },
    {
        'order_date': '2022-01-02',
        'items': [
            {'description': 'mens polo', 'quantity': 1, 'unit_price': 39.95, 'total': 39.95},
            {'description': 'tan slacks', 'quantity': 1, 'unit_price': 49.95, 'total': 49.95}
        ]
    },
    {
        'order_date': '2022-01-03',
        'items': [
            {'description': 'sneakers', 'quantity': 1, 'unit_price': 79.95, 'total': 79.95},
        ]
    },
    {
        'order_date': '2022-01-03',
        'items': [
            {'description': 'graphic tee', 'quantity': 1, 'unit_price': 19.95, 'total': 19.95},
            {'description': 'sneakers', 'quantity': 1, 'unit_price': 79.95, 'total': 79.95}
        ]
    }
]

# Sum up the total quantity and price
goal = "Count the number of orders with complete outfits where an outfit is pants and a shirt."
initial_value = {'count': 0}

async def main():
    result = await reduce_list(goal=goal, list=list_of_orders, initial_value=initial_value, complete_prompt=complete_prompt)
    if result.completed:
        print(result.value)
    else:
        print(result.error)

# Run the main function
if __name__ == "__main__":
    asyncio.run(main())
