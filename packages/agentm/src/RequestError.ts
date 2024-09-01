
export class RequestError extends Error {
    public constructor(message: string, status: number, name = 'RequestError') {
        super(message);
        this.status = status;
        this.name = name;
    }

    public readonly status: number;

}