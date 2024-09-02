import { CancelledError } from "./CancelledError";
import Semaphore from "./Semaphore";
import { AgentArgs, completePrompt } from "./types";

/**
 * Creates a new completePrompt that limits the number of parallel completions.
 * @remarks
 * The number of completion requests allowed at any given time is limited by the 
 * parallelCompletions argument. Before calling the wrapped completePrompt, the
 * shouldContinue function is called to check for cancellation.
 * @param args The completePrompt to wrap and the number of parallel completions allowed.
 * @returns A new completePrompt wrapper.
 */
export function parallelCompletePrompt<TValue = string>(args: AgentArgs): completePrompt<TValue> {
    const { completePrompt, shouldContinue, parallelCompletions } = args;

    // Create a new semaphore to limit completions
    const semaphore = new Semaphore(parallelCompletions ?? 1);
 
    return async (args) => {
        // Wait for semaphore
        return await semaphore.callFunction(async () => {
            // Check for cancellation
            if (!await shouldContinue()) {
                return { completed: false, error: new CancelledError() };
            }

            // Call completePrompt
            return await completePrompt(args);
        });
    };
}
