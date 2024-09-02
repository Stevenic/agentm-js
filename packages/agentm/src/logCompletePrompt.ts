import { CancelledError } from "./CancelledError";
import { completePrompt } from "./types";

export function logCompletePrompt<TValue>(completePrompt: completePrompt<TValue>, logDetails = false): completePrompt<TValue> {
    return async (args) => {
        const result = await completePrompt(args);

        // Ignore cancellations
        if (result.error instanceof CancelledError) {
            return result;
        }

        // Log completion
        if (result.completed) {
            console.log(colorizeOutput(result.value));
        } else if (result.error) {
            console.error(colorizeError(result.error));
        } else {
            console.error(colorizeError('Prompt failed to complete.'));
        }

        // Log details
        if (logDetails && result.details) {
            console.log(colorizeValue('Input Tokens', result.details.inputTokens));
            console.log(colorizeValue('Output Tokens', result.details.outputTokens));
            console.log(colorizeValue('Finish Reason', result.details.finishReason));
        }

        // Create separator
        console.log('='.repeat(80));
        return result;
    };
}

function colorizeError(error: Error|string): string {
    if (typeof error === 'string') {
        return `\x1b[31;1m${error}\x1b[0m`;
    } else {
        return `\x1b[31;1m${error.message}\x1b[0m`;
    }
}

function colorizeValue(field: string, value: any, units: string = ''): string {
    return `${field}: ${colorizeOutput(value, '"', units)}`;
}

function colorizeOutput(output: any, quote: string = '', units: string = ''): string {
    if (typeof output === 'string') {
        return `\x1b[32m${quote}${output}${quote}\x1b[0m`;
    } else if (typeof output === 'object' && output !== null) {
        return colorizeOutput(JSON.stringify(output, null, 2));
    } else if (typeof output == 'number') {
        return `\x1b[34m${output}${units}\x1b[0m`;
    } else {
        return `\x1b[34m${output}\x1b[0m`;
    }
}
