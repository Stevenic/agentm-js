import { encodeTokens } from "./types";

/**
 * Arguments to configure a token counter.
 */
export interface TokenCounterArgs {
    /**
     * Tokenizer to use for counting tokens.
     */
    encodeTokens: encodeTokens;

    /**
     * Optional. Maximum number of tokens that are expected to be counted.
     */
    maxExpectedTokens?: number;
}

/**
 * Function that counts the number of tokens in a string.
 */
export type countTokens = (text: string) => number;

/**
 * Creates a function that counts the number of tokens in a string.
 * @remarks
 * The function can be configured with a maximum expected number of tokens to optimize performance.
 * If the length of the text is greater than 8 times the maximum expected tokens, the function will
 * estimate the number of tokens based on the length of the text. Only if the text is below the 
 * threshold will the tokenizer be used to count the tokens.
 * @param args Arguments for the token counter.
 * @returns Function that counts the number of tokens in a string.
 */
export function tokenCounter(args: TokenCounterArgs): countTokens {
    const { encodeTokens, maxExpectedTokens } = args;
    const lengthThreshold = maxExpectedTokens ?  maxExpectedTokens * 8 : Number.MAX_SAFE_INTEGER;
    return (text: string) => {
        if (text.length < lengthThreshold) {
            return encodeTokens(text).length;
        } else {
            return Math.floor(text.length / 4);
        }
    };
}