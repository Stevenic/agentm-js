import os
import asyncio
from openai import OpenAI
import tiktoken
from pydantic import BaseModel

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Initialize OpenAI
api_key = os.getenv('OPENAI_API_KEY')
model = 'gpt-4o-mini'
openai_client = OpenAI(api_key=api_key, model=model)

# Read document as context
def read_context(file_path):
    with open(file_path, 'r', encoding='utf8') as file:
        return file.read()

context = read_context('./data/satya-nadella-build2024-keynote.txt')

# Get question from command line
import sys
question = sys.argv[1] if len(sys.argv) > 1 else "What features were announced for copilot pc? was a ship date provided?"
print(f"Question: \x1b[32m{question}\x1b[0m")

# Define a Pydantic model for the response
class GroundedAnswerResponse(BaseModel):
    answer: str
    explanation: str

# Function to get grounded answer
async def grounded_answer(question, context, max_tokens, openai_client):
    # Simulate the groundedAnswer function
    # This is a placeholder for the actual implementation
    response = await openai_client.complete(prompt=f"{context}\n{question}", max_tokens=max_tokens)
    if response:
        return GroundedAnswerResponse(answer=response['choices'][0]['text'], explanation="This is a simulated explanation.")
    else:
        raise Exception("Failed to get a response from the model.")

# Ask a question using chain of thought
max_tokens = 2000

async def main():
    try:
        result = await grounded_answer(question, context, max_tokens, openai_client)
        print(f"Answer: \x1b[32m{result.answer}\x1b[0m")
        print(f"Explanation: \x1b[32m{result.explanation}\x1b[0m")
    except Exception as e:
        print(f"Error: {str(e)}")

# Run the main function
if __name__ == "__main__":
    asyncio.run(main())
