/**
 * Convert a variable to a string
 * @param variable Variable to convert.
 * @returns Converted string.
 */
export function variableToString(variable: any): string {
    if (variable === null || variable === undefined) {
        return '';
    }
    if (typeof variable === 'string') {
        return variable;
    }
    if (typeof variable === 'object') {
        return JSON.stringify(variable);
    }
    return variable.toString();
}