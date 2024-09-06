import os
import asyncio
from pydantic import BaseModel
from openai import OpenAI

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Initialize OpenAI
api_key = os.getenv('OPENAI_API_KEY')
model = 'gpt-4o-2024-08-06'
openai_client = OpenAI(api_key=api_key, model=model)

# Mock up shopping cart data
class Item(BaseModel):
    description: str
    quantity: int
    unit_price: float
    total: float

list_of_items = [
    Item(description='graphic tee', quantity=2, unit_price=19.95, total=39.90),
    Item(description='jeans', quantity=1, unit_price=59.95, total=59.95),
    Item(description='sneakers', quantity=1, unit_price=79.95, total=79.95),
    Item(description='jacket', quantity=1, unit_price=99.95, total=99.95)
]

# Sum up the total quantity and price
async def reduce_list(goal, list_of_items, initial_value):
    # This function would interact with the OpenAI API to process the list
    # For now, we will simulate the reduction process
    total_quantity = initial_value['quantity']
    total_price = initial_value['total']
    for item in list_of_items:
        total_quantity += item.quantity
        total_price += item.total
    return {'completed': True, 'value': {'quantity': total_quantity, 'total': total_price}}

async def main():
    goal = "Sum the quantity and total columns."
    initial_value = {'quantity': 0, 'total': 0}
    result = await reduce_list(goal, list_of_items, initial_value)
    if result['completed']:
        print(result['value'])
    else:
        print("Error:", result.get('error'))

# Run the main function
if __name__ == "__main__":
    asyncio.run(main())
