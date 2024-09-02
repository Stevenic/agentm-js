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

export interface AgentCompletion<TValue> {
    completed: boolean;
    value?: TValue;
    error?: Error;
}

/**
 * Adds an "explanation" field to an object to create a chain-of-thought.
 */
export type WithExplanation<TObject extends {}> = TObject & { explanation?: string };

// Cancellations

export type shouldContinue = () => Promise<boolean>|boolean;

// Prompt Completions

export type completePrompt<TValue = string> = (args: PromptCompletionArgs) => Promise<PromptCompletion<TValue>>;

export interface PromptCompletionArgs {
    prompt: UserMessage;
    system?: SystemMessage;
    history?: Message[];
    temperature?: number;
    useJSON?: boolean;
    jsonSchema?: JsonSchema;
}

export interface PromptCompletion<TValue> extends AgentCompletion<TValue> {
    details?: PromptCompletionDetails;
}

export type PromptCompletionFinishReason = 'stop'|'length'|'filtered'|'tool_call'|'unknown';

export interface PromptCompletionDetails {
    inputTokens: number;
    outputTokens: number;
    finishReason: PromptCompletionFinishReason;
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
