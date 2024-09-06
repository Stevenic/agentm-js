import os
import asyncio
from openai import OpenAI
from agentm import sort_list
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize OpenAI
api_key = os.getenv('OPENAI_API_KEY')
model = 'gpt-4o-mini'
complete_prompt = OpenAI(api_key=api_key, model=model)

# Create randomized list of rushes studio albums
album_list = [
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
]

# Sort list of rush studio albums chronologically
log_explanations = True
parallel_completions = 1
goal = "Sort the list of rush studio albums chronologically from oldest to newest."

async def main():
    result = await sort_list(goal=goal, list=album_list, parallel_completions=parallel_completions, log_explanations=log_explanations, complete_prompt=complete_prompt)
    if result.completed:
        for index, item in enumerate(result.value, start=1):
            print(f"{index}. {item}")
    else:
        print(result.error)

# Run the main function
if __name__ == "__main__":
    asyncio.run(main())
