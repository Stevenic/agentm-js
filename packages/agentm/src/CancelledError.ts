
export class CancelledError extends Error {
    public constructor(message?: string) {
        super(message ?? 'The operation was cancelled.');
        this.name = 'CancelledError';
    }
}