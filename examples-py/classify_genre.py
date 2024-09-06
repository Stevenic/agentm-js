import os
import asyncio
from openai import OpenAI
from agentm import classify_list
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

# Create a list of categories formatted as <genre> - <description>
categories = [
    "Pop - Popular music that appeals to a wide audience",
    "Country - Music that originated in the southern United States",
    "Rock - Music characterized by a strong beat and amplified instruments",
    "Electronic - Music produced using electronic devices",
    "Hip Hop - Music that features rap and a strong rhythmic beat"
]

# Identify each artist's genre
parallel_completions = 3
goal = "Identify the genre of each artist from the list."

async def main():
    result = await classify_list(goal=goal, list=artist_list, categories=categories, 
                                 parallel_completions=parallel_completions, complete_prompt=complete_prompt)
    if result.completed:
        for entry in result.value:
            print(f"{entry.item} - {entry.category}")
    else:
        print(result.error)

# Run the main function
if __name__ == "__main__":
    asyncio.run(main())
