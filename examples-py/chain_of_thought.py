import os
import asyncio
from openai import OpenAI
from agentm import chain_of_thought

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Initialize OpenAI
api_key = os.getenv('OPENAI_API_KEY')
model = 'gpt-4o-mini'
complete_prompt = OpenAI(api_key=api_key, model=model)

# Get question from command line
import sys
question = sys.argv[1] if len(sys.argv) > 1 else "What is the meaning of life?"
print(f"Question: \x1b[32m{question}\x1b[0m")

# Ask a question using chain of thought
max_tokens = 4000

async def main():
    result = await chain_of_thought(question=question, max_tokens=max_tokens, complete_prompt=complete_prompt)
    if result.completed:
        value = result.value
        print(f"Answer: \x1b[32m{value.answer}\x1b[0m")
        print(f"Explanation: \x1b[32m{value.explanation}\x1b[0m")
    else:
        print(result.error)

# Run the main function
if __name__ == "__main__":
    asyncio.run(main())
