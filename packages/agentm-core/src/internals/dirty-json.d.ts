declare module 'dirty-json' {
    export function parse<TObject extends {}>(json: string): TObject;
}