import { Schema } from "jsonschema";

// Agent Arguments

/**
 * Common arguments supported by all agents.
 */
export interface AgentArgs {
    /**
     * Prompt completion function.
     * @remarks
     * This function will be called by agents to complete prompts.
     */
    completePrompt: completePrompt<any>;

    /**
     * Optional. Cancellation function.
     * @remarks
     * This function will be called periodically by agents to check for cancellation.
     */
    shouldContinue?: shouldContinue;

    /**
     * Optional. Maximum number of parallel completions allowed.
     * @remarks
     * Not every agent will take advantage of parallel completions.
     * 
     * Defaults to 1.
     */
    parallelCompletions?: number;
}

/**
 * Common result fields returned by all agents.
 * @remarks
 * Agents may extending this interface to return additional fields.
 * @param TValue The type of the value returned by the agent.
 */
export interface AgentCompletion<TValue> {
    /**
     * Indicates whether the agent completed successfully.
     * @remarks
     * If this field is false, the error field should be set.
     */
    completed: boolean;

    /**
     * The value returned by the agent if it successfully completed.
     * @remarks
     * Only set if the completed field is true.
     */
    value?: TValue;

    /**
     * Error returned by the agent if it did not complete successfully.
     * @remarks
     * Should be set if the completed field is false.
     * 
     * For agents that have been cancelled, the error should be a CancelledError instance.
     */
    error?: Error;
}

/**
 * Adds an "explanation" field to an object to create a chain-of-thought.
 */
export type WithExplanation<TObject extends {}> = TObject & { explanation?: string };

// Cancellations

/**
 * Function that agents can call to check for cancellation.
 * @returns A promise that resolves to true if the agent should continue, or false if it should stop.
 */
export type shouldContinue = () => Promise<boolean>|boolean;

// Prompt Completions

/**
 * Function that completes a prompt.
 * @param args Arguments for the prompt completion.
 * @returns A promise that resolves to the completion result.
 */
export type completePrompt<TValue = string> = (args: PromptCompletionArgs) => Promise<PromptCompletion<TValue>>;

/**
 * Arguments for prompt completions.
 */
export interface PromptCompletionArgs {
    /**
     * The prompt to complete formatted as a "user" message.
     */
    prompt: UserMessage;

    /**
     * Optional. System message to send with the prompt.
     */
    system?: SystemMessage;

    /**
     * Optional. History of messages leading up to the prompt.
     */
    history?: Message[];

    /**
     * Optional. Temperature the model should use for sampling completions.
     */
    temperature?: number;

    /**
     * Optional. Maximum number of tokens the model should return.
     */
    maxTokens?: number;

    /**
     * Optional. Indicates whether the model should always return JSON as it's output.
     */
    jsonMode?: boolean;

    /**
     * Optional. JSON schema used to enforce the models output.
     */
    jsonSchema?: JsonSchema;
}

/**
 * Completion result for a prompt.
 * @remarks
 * Adds usage details to the common agent completion fields.
 * @param TValue The type of the value returned by the completion.
 */
export interface PromptCompletion<TValue> extends AgentCompletion<TValue> {
    /**
     * Optional. Details about the usage of the model for this completion.
     */
    details?: PromptCompletionDetails;
}

/**
 * Reason the prompt completion finished.
 */
export type PromptCompletionFinishReason = 'stop'|'length'|'filtered'|'tool_call'|'unknown';

/**
 * Details about the completion of a prompt.
 */
export interface PromptCompletionDetails {
    /**
     * Number of tokens sent to the model.
     */
    inputTokens: number;

    /**
     * Number of tokens returned by the model.
     */
    outputTokens: number;

    /**
     * Reason the completion finished.
     */
    finishReason: PromptCompletionFinishReason;
}

/**
 * JSON schema for the output of a model.
 */
export interface JsonSchema {
    /**
     * The name of the schema.
     */
    name: string;

    /**
     * The schema definition.
     */
    schema: Schema;

    /**
     * Optional. Description of when the schema should be used.
     */
    description?: string;

    /**
     * Optional. Indicates whether the schema should be strictly enforced.
     */
    strict?: boolean;
}

// Message Types

/**
 * Base message sent to a model when completing a prompt.
 */
export interface Message {
    /**
     * Role of the message.
     */
    role: string;

    /**
     * Content of the message.
     */
    content: string;

    /**
     * Optional. Name of the user sending the message.
     */
    name?: string;
}

/**
 * System message sent to a model when completing a prompt.
 */
export interface SystemMessage extends Message {
    role: 'system';
}

/**
 * User message sent to a model when completing a prompt.
 */
export interface UserMessage extends Message {
    role: 'user';
}

/**
 * Assistant message sent to a model when completing a prompt.
 */
export interface AssistantMessage extends Message {
    role: 'assistant';
}

// Tokenizers

export interface Tokenizer {
    /**
     * Converts a string of text into tokens.
     */
    encodeTokens: encodeTokens;

    /**
     * Converts an array of tokens into a string of text.
     */
    decodeTokens: decodeTokens;
}

/**
 * Converts a string of text into tokens.
 */
export type encodeTokens = (text: string) => number[];

/**
 * Converts an array of tokens into a string of text.
 */
export type decodeTokens = (tokens: number[]) => string;
