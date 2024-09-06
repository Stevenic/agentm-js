import os
import asyncio
from openai import OpenAI
from agentm import binary_classify_list
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize OpenAI
api_key = os.getenv('OPENAI_API_KEY')
model = 'gpt-4o-mini'
complete_prompt = OpenAI(api_key=api_key, model=model)

# Create randomized list of artists (5 from each genre)
artist_list = [
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
]

# Identify each artist's genre
parallel_completions = 3
goal = "Has the artist had a #1 hit within the last 5 years?"

async def main():
    result = await binary_classify_list(goal=goal, list=artist_list, parallel_completions=parallel_completions, complete_prompt=complete_prompt)
    if result.completed:
        print("Artists with a #1 hit within the last 5 years:")
        for entry in result.value:
            if entry.matches:
                print(entry.item)
    else:
        print(result.error)

# Run the main function
if __name__ == "__main__":
    asyncio.run(main())
