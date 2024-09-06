import os
import asyncio
from pydantic import BaseModel, Field
import openai
import xml.etree.ElementTree as ET

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Initialize OpenAI
api_key = os.getenv('OPENAI_API_KEY')
model = 'gpt-4o-mini'

# Read file from ./data/news-feed.xml
with open('./data/news-feed.xml', 'r', encoding='utf8') as file:
    xml_content = file.read()

start = xml_content.index('<item>')
end = xml_content.rindex('</item>') + len('</item>')
xml = xml_content[start:end]

# Split news feed into list of news items
def split_news_items(xml):
    root = ET.fromstring(f'<root>{xml}</root>')
    return [ET.tostring(item, encoding='unicode') for item in root.findall('item')]

list_of_items = split_news_items(xml)

# Define output shape
class NewsItem(BaseModel):
    title: str = Field(..., description='items title')
    abstract: str = Field(..., description='items abstract parsed from description')
    link: str = Field(..., description='items link')
    pubDate: str = Field(..., description='items publish date')

# Extract news feed from file
parallel_completions = 3
goal = "Map the item to the output shape."

async def map_list(goal, list_of_items, model, api_key):
    openai.api_key = api_key
    tasks = []
    for item in list_of_items:
        tasks.append(complete_prompt(goal, item, model))
    return await asyncio.gather(*tasks)

async def complete_prompt(goal, item, model):
    try:
        response = openai.Completion.create(
            model=model,
            prompt=f"{goal}: {item}",
            max_tokens=150
        )
        return response.choices[0].text.strip()
    except Exception as e:
        return str(e)

async def main():
    result = await map_list(goal, list_of_items, model, api_key)
    for res in result:
        print(res)

if __name__ == "__main__":
    asyncio.run(main())
