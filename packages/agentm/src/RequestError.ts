
/**
 * Represents an error that occurred during a model request.
 */
export class RequestError extends Error {
    /**
     * Creates a new `RequestError` instance.
     * @param message Message describing the error.
     * @param status HTTP status code of the error.
     * @param name Optional. Name of the error.
     */
    public constructor(message: string, status: number, name = 'RequestError') {
        super(message);
        this.status = status;
        this.name = name;
    }

    /**
     * HTTP status code of the error.
     */
    public readonly status: number;

}