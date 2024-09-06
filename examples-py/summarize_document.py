import os
import asyncio
from openai import OpenAI
from agentm import summarize_list

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Initialize OpenAI
api_key = os.getenv('OPENAI_API_KEY')
model = 'gpt-4o-mini'
complete_prompt = OpenAI(api_key=api_key, model=model)

# Read document
def read_document(file_path):
    with open(file_path, 'r', encoding='utf8') as file:
        return file.read()

document = read_document('./data/paul-graham-essay.txt')

# Summarize the document
async def summarize_document():
    list_of_documents = [document]
    goal = "Summarize the document."
    result = await summarize_list(goal=goal, list_of_documents=list_of_documents, complete_prompt=complete_prompt)
    if result.completed:
        summary = result.value[0]['summary']
        print(summary)
    else:
        print(result.error)

# Run the async function
if __name__ == "__main__":
    asyncio.run(summarize_document())
