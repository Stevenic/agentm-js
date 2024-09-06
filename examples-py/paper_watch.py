import os
import asyncio
import requests
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize OpenAI
api_key = os.getenv('OPENAI_API_KEY')
model = 'gpt-4o-mini'
openai_client = OpenAI(api_key=api_key, model=model)

# Define the projections template
template = '''# <title> (<pubDate in mm/dd/yyyy format>)
<abstract>
[Read more](<link>)'''

def fetch_url(url: str) -> str:
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.text
    except requests.RequestException as error:
        print('Error fetching the RSS feed:', error)
        exit(1)


def parse_feed(data: str) -> list:
    # Extract items from feed
    start = data.index('<item>')
    end = data.rindex('</item>') + len('</item>')
    xml = data[start:end]

    # Split news feed into list of news items
    list_items = [item + '</item>' for item in xml.split('</item>') if item]
    return list_items


async def main():
    # Fetch latest papers
    print("\033[35;1mFetching latest papers from arxiv.org...\033[0m")
    data = fetch_url('https://rss.arxiv.org/rss/cs.cl+cs.ai')
    feed = parse_feed(data)

    # Identify topics of interest
    topics = os.getenv('TOPICS', 'new prompting techniques or advances with agents')
    print(f"\033[35;1mFiltering papers by topics: {topics}...\033[0m")

    # Filter papers by topic
    parallel_completions = 3
    filter_goal = f"Filter the list to only include papers related to {topics}."
    filtered = await openai_client.filter_list(goal=filter_goal, list=feed, parallel_completions=parallel_completions)
    if not filtered['completed']:
        print(filtered['error'])
        return

    # Generate projections
    print(f"\033[35;1mGenerating projections for {len(filtered['value'])} of {len(feed)} papers...\033[0m")
    goal = "Map the news item to the template."
    projections = await openai_client.project_list(goal=goal, list=filtered['value'], template=template, parallel_completions=parallel_completions)
    if not projections['completed']:
        print(projections['error'])
        return

    # Render papers
    for entry in projections['value']:
        print(f"\033[32m{entry['projection']}\033[0m\n\n{'=' * 80}\n")


if __name__ == '__main__':
    asyncio.run(main())
