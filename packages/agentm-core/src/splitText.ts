import { Tokenizer, shouldContinue } from "./types";
import { tokenCounter } from "./tokenCounter";
import { CancelledError } from "./CancelledError";

export interface SplitTextArgs {
    /**
     * Text to split into chunks.
     */
    text: string;

    /**
     * Tokenizer to use for splitting text.
     */
    tokenizer: Tokenizer;

    /**
     * Maximum number of tokens that can be in a chunk.
     */
    maxChunkSize: number;

    /**
     * Optional. List of separators to use for splitting text.
     * @remarks
     * Defaults to using separators that are optimized for markdown files.
     */
    separators?: string[];

    /**
     * Optional. Cancellation function that can be used to stop long running split operations
     */
    shouldContinue?: shouldContinue;
}

export interface TextChunk {
    text: string;
    length: number;
    startPos: number;
    endPos: number;
}

export function splitText(args: SplitTextArgs): TextChunk[]  {
    const { text, tokenizer, maxChunkSize } = args;
    const separators = args.separators ?? DEFAULT_SEPARATORS;

    // Create a token counter
    const encodeTokens = tokenizer.encodeTokens;
    const countTokens = tokenCounter({ encodeTokens, maxExpectedTokens: maxChunkSize });

    function checkContinue() {
        if (args.shouldContinue && !args.shouldContinue()) {
            throw new CancelledError();
        }
    }
    
    function recursiveSplit(text: string, separators: string[], startPos: number): TextChunk[] {
        const chunks: TextChunk[] = [];
        if (text.length > 0) {
            // Split text into parts
            let parts: string[];
            let separator = '';
            const nextSeparators = separators.length > 1 ? separators.slice(1) : [];
            if (separators.length > 0) {
                // Split by separator
                separator = separators[0];
                parts = separator == ' ' ? splitBySpaces(text) : text.split(separator);
            } else {
                // Cut text in half
                const half = Math.floor(text.length / 2);
                parts = [text.substring(0, half), text.substring(half)];
            }

            // Iterate over parts
            for (let i = 0; i < parts.length; i++) {
                checkContinue();
                const lastChunk = (i === parts.length - 1);

                // Get chunk text and endPos
                let chunk = parts[i];
                const endPos = (startPos + (chunk.length - 1)) + (lastChunk ? 0 : separator.length);
                if (!lastChunk) {
                    chunk += separator;
                }

                // Ensure chunk contains text
                if (!containsAlphanumeric(chunk)) {
                    continue;
                }

                // Count length of text
                const length = countTokens(chunk);
                if (length > maxChunkSize) {
                    // Break the text into smaller chunks
                    const subChunks = recursiveSplit(chunk, nextSeparators, startPos);
                    chunks.push(...subChunks);
                } else {
                    // Append chunk to output
                    chunks.push({ text: chunk, length, startPos, endPos });
                }

                // Update startPos
                startPos = endPos + 1;
            }
        }

        return combineChunks(chunks);
    }

    function combineChunks(chunks: TextChunk[]): TextChunk[] {
        const combinedChunks: TextChunk[] = [];
        let currentChunk: TextChunk|undefined;
        for (let i = 0; i < chunks.length; i++) {
            checkContinue();
            const chunk = chunks[i];
            if (currentChunk) {
                const length = currentChunk.length + chunk.length;
                if (length > maxChunkSize) {
                    combinedChunks.push(currentChunk);
                    currentChunk = chunk;
                } else {
                    currentChunk.text += chunk.text;
                    currentChunk.endPos = chunk.endPos;
                    currentChunk.length += length;
                }
            } else {
                currentChunk = chunk;
            }
        }
        if (currentChunk) {
            combinedChunks.push(currentChunk);
        }
        return combinedChunks;
    }

    function containsAlphanumeric(text: string): boolean {
        for (let i = 0; i < text.length; i++) {
            if (ALPHANUMERIC_CHARS.includes(text[i])) {
                return true;
            }
        }
        return false;
    }

    function splitBySpaces(text: string): string[] {
        // Split text by tokens and return parts
        const parts: string[] = [];
        let tokens = encodeTokens(text);
        do {
            checkContinue();
            if (tokens.length <= maxChunkSize) {
                parts.push(tokenizer.decodeTokens(tokens));
                break;
            } else {
                const span = tokens.splice(0, maxChunkSize);
                parts.push(tokenizer.decodeTokens(span));
            }
        } while (true);

        return parts;
    }

    // Recursively split text into chunks
    return recursiveSplit(text, separators, 0);
}

const ALPHANUMERIC_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const DEFAULT_SEPARATORS = [
    // First, try to split along Markdown headings (starting with level 2)
    "\n## ",
    "\n### ",
    "\n#### ",
    "\n##### ",
    "\n###### ",
    // Note the alternative syntax for headings (below) is not handled here
    // Heading level 2
    // ---------------
    // End of code block
    "```\n\n",
    // Horizontal lines
    "\n\n***\n\n",
    "\n\n---\n\n",
    "\n\n___\n\n",
    // Note that this splitter doesn't handle horizontal lines defined
    // by *three or more* of ***, ---, or ___, but this is not handled
    // Github tables
    "<table>",
    // "<tr>",
    // "<td>",
    // "<td ",
    "\n\n",
    "\n",
    " "
];
