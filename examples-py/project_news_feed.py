import os
import asyncio
from openai import OpenAI
from pydantic import BaseModel
import xml.etree.ElementTree as ET

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Initialize OpenAI
api_key = os.getenv('OPENAI_API_KEY')
model = 'gpt-4o-mini'
openai_client = OpenAI(api_key=api_key, model=model)

# Read file from ./data/news-feed.xml
with open('./data/news-feed.xml', 'r', encoding='utf8') as file:
    xml_content = file.read()

# Parse XML and extract items
root = ET.fromstring(xml_content)
items = root.findall('.//item')

# Define the projections template
class NewsItem(BaseModel):
    title: str
    pubDate: str
    abstract: str
    link: str

    def to_template(self):
        return f"# {self.title} ({self.pubDate})\n{self.abstract}\n[Read more]({self.link})"

# Function to map news item to template
async def map_news_item(item):
    title = item.find('title').text
    pub_date = item.find('pubDate').text  # Assuming pubDate is already in mm/dd/yyyy format
    abstract = item.find('description').text
    link = item.find('link').text

    news_item = NewsItem(title=title, pubDate=pub_date, abstract=abstract, link=link)
    return news_item.to_template()

# Summarize the items in the news feed
async def main():
    tasks = [map_news_item(item) for item in items]
    results = await asyncio.gather(*tasks)
    for result in results:
        print(f"\033[32m{result}\033[0m\n{'='*80}")

if __name__ == '__main__':
    asyncio.run(main())
