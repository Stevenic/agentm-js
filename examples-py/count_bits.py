import os
import asyncio
from openai import OpenAI
from agentm import reduce_list

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Initialize OpenAI
api_key = os.getenv('OPENAI_API_KEY')
model = 'gpt-4o-2024-08-06'
complete_prompt = OpenAI(api_key=api_key, model=model)

# Define a binary number
bit_list = [1, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1]

# Count number of even bits that are set to 1
async def count_bits():
    # First count even bits
    goal = "Count the number of even bits that are set to 1. The index represents the bit position."
    initial_value = {'count': 0}
    results = await reduce_list(goal=goal, list=bit_list, initial_value=initial_value, complete_prompt=complete_prompt)
    print(f"Even Bits: {results['value']['count']}")

    # Now count odd bits
    goal = "Count the number of odd bits that are set to 1. The index represents the bit position."
    initial_value = {'count': 0}
    results = await reduce_list(goal=goal, list=bit_list, initial_value=initial_value, complete_prompt=complete_prompt)
    print(f"Odd Bits: {results['value']['count']}")

# Run the count_bits function
asyncio.run(count_bits())
