/**
 * Represents an error that is returned when an Agent is cancelled.
 */
export class CancelledError extends Error {
    /**
     * Creates a new `CancelledError` instance.
     * @param message Optional. Message describing the error.
     */
    public constructor(message?: string) {
        super(message ?? 'The operation was cancelled.');
        this.name = 'CancelledError';
    }
}