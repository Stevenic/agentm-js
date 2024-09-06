import os
import asyncio
from pydantic import BaseModel, Field
from agentm import argument_parser, generate_object, JsonSchema, openai

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Initialize OpenAI
api_key = os.getenv('OPENAI_API_KEY')
model = 'gpt-4o-2024-08-06'
complete_prompt = openai(api_key=api_key, model=model)

# Define the TypeDefinition schema
class TypeDefinition(BaseModel):
    interface: str = Field(..., description='TypeScript interface definition for the type')
    json_schema: str = Field(..., description='JSON Schema definition for the type')


type_definition_schema = JsonSchema(
    name='TypeDefinition',
    schema={
        'type': 'object',
        'properties': {
            'interface': {
                'type': 'string',
                'description': 'TypeScript interface definition for the type'
            },
            'jsonSchema': {
                'type': 'string',
                'description': 'JSON Schema definition for the type'
            }
        },
        'required': ['interface', 'jsonSchema'],
        'additionalProperties': False
    },
    strict=True
)

# Define a schema for parsing command line arguments
class Args(BaseModel):
    typename: str = Field(..., description='name of the type to create.')
    description: str = Field(..., description="detailed description of the type including its properties.")
    error: str = Field(None, description='error message to display when arguments are missing.')

args_schema = {
    'typename': {
        'type': 'string',
        'description': 'name of the type to create.',
        'required': True
    },
    'description': {
        'type': 'string',
        'description': "detailed description of the type including its properties.",
        'required': True
    },
    'error': {
        'type': 'string',
        'description': 'error message to display when arguments are missing.',
        'required': False
    }
}

# Main function
async def main():
    # Parse cli arguments
    parser_goal = "Parse the parameters needed to create a new type definition that includes a TypeScript interface and a JSON schema."
    args = await argument_parser(Args, goal=parser_goal, schema=args_schema, argv=os.sys.argv[1:], complete_prompt=complete_prompt)
    if not args.completed or args.value.error:
        print(args.error or args.value.error)
        return

    # Define context
    context = f"TYPENAME: {args.value.typename}\nDESCRIPTION: {args.value.description}"

    # Generate the type definition
    max_tokens = 4000
    goal = "Create a TypeScript interface definition and JSON scheme for the type information in the context."
    json_schema = type_definition_schema
    result = await generate_object(TypeDefinition, goal=goal, json_schema=json_schema, max_tokens=max_tokens, context=context, complete_prompt=complete_prompt)
    if result.completed:
        print(f"Type Interface:\n\x1b[32m{result.value.interface}\x1b[0m\n")
        print(f"JSON Schema:\n\x1b[32m{result.value.json_schema}\x1b[0m\n")
    else:
        print(result.error)

if __name__ == "__main__":
    asyncio.run(main())
