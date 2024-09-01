import { Schema } from "jsonschema";

// Agent Arguments

export interface AgentArgs {
    /**
     * Prompt completion function.
     */
    completePrompt: completePrompt<any>;

    /**
     * Cancellation function.
     */
    shouldContinue: shouldContinue;

    /**
     * Optional. Maximum number of parallel completions allowed.
     * @remarks
     * Defaults to 1.
     */
    parallelCompletions?: number;
}

export interface AgentCompletion<TResult> {
    completed: boolean;
    value?: TResult;
    error?: Error;
}

/**
 * Adds an "explanation" field to an object to create a chain-of-thought.
 */
export type WithExplanation<TObject extends {}> = TObject & { explanation?: string };

// Cancellations

export type shouldContinue = () => Promise<boolean>|boolean;

// Prompt Completions

export type completePrompt<TContent = string> = (args: PromptCompletionArgs) => Promise<AgentCompletion<TContent>>;

export interface PromptCompletionArgs {
    prompt: UserMessage;
    system?: SystemMessage;
    history?: Message[];
    temperature?: number;
    useJSON?: boolean;
    jsonSchema?: JsonSchema;
}

export interface JsonSchema {
    name: string;
    schema: Schema;
}

// Message Types

export interface Message {
    role: string;
    content: string;
    name?: string;
}

export interface SystemMessage extends Message {
    role: 'system';
}

export interface UserMessage extends Message {
    role: 'user';
}

export interface AssistantMessage extends Message {
    role: 'assistant';
}
