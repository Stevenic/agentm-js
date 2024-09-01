import { variableToString } from "./variableToString";

/**
 * Composes a prompt from a template and variables.
 * @remarks
 * Any {{variable}} in the template will be replaced with the value of the variable or an empty
 * string.
 * @param template Template to compose.
 * @param variables Variables to replace in the template.
 * @returns Composed prompt.
 */
export function composePrompt(template: string, variables: Record<string, any>): string {
    return template.replace(/{{\s*([^}\s]+)\s*}}/g, (match, name) => {
        return variableToString(variables[name]);
    });
}

