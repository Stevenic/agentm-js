import os
import sys
import asyncio
from pydantic import BaseModel
import openai
import tiktoken

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Get code to write
task = ' '.join(sys.argv[1:])
if not task:
    print("Please tell me what code to write.")
    sys.exit(1)

# Initialize OpenAI 
api_key = os.getenv('OPENAI_API_KEY')
model = 'gpt-4o-2024-08-06'


# Define output shape
class SourceCode(BaseModel):
    code: str

# Provide additional context
context = ""

# Ask a question using chain of thought
max_tokens = 4000
goal = f"Write a small typescript program that {task}."

async def generate_object(goal, max_tokens, context):
    try:
        response = openai.Completion.create(
            model=model,
            prompt=goal + "\n" + context,
            max_tokens=max_tokens
        )
        return response.choices[0].text.strip()
    except Exception as e:
        print(f"Error: {e}")
        return None

async def main():
    result = await generate_object(goal, max_tokens, context)
    if result:
        print(f"\033[32m{result}\033[0m")
    else:
        print("Failed to generate code.")

if __name__ == "__main__":
    asyncio.run(main())
