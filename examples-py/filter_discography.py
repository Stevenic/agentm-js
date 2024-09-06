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

# Create randomized list of rushes studio albums
rush_albums = [
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

# Define output shape
class AlbumDetails(BaseModel):
    title: str
    details: str

json_shape = {'title': '<album title>', 'details': '<detailed summary of album. include the release date, critic reviews, and a track listing>'}


async def filter_and_sort_list():
    # Filter list to only include albums from the 80's
    print("\033[35;1mFiltering albums to the 80's...\033[0m")
    parallel_completions = 3
    filter_goal = "Filter the list to only include rush albums released in the 1980's."
    filtered = await openai_client.filter_list(goal=filter_goal, list=rush_albums, parallel_completions=parallel_completions)
    if not filtered.completed:
        print(filtered.error)
        return

    # Sort filtered list chronologically
    print("\033[35;1mSorting albums chronologically...\033[0m")
    sort_goal = "Sort the list of rush studio albums chronologically from oldest to newest."
    sorted_list = await openai_client.sort_list(goal=sort_goal, list=filtered.value, parallel_completions=parallel_completions)
    if not sorted_list.completed:
        print(sorted_list.error)
        return

    # Add in world knowledge
    print("\033[35;1mGenerating album details...\033[0m")
    details_goal = "Map the item to the output shape."
    details = await openai_client.map_list(goal=details_goal, list=sorted_list.value, json_shape=json_shape, parallel_completions=parallel_completions)
    if not details.completed:
        print(details.error)
        return

    # Print sorted list
    for item in details.value:
        print(f"Title: \033[32m{item.title}\033[0m\nDetails: \033[32m{item.details}\033[0m\n")

# Run the async function
asyncio.run(filter_and_sort_list())
