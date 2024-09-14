import { AgentCompletion, variableToString } from 'agentm-core';
import { spawn } from 'child_process';
import path from 'path';
import { loadFile, listFiles } from './files';

export interface ExecuteScriptArgs {
    pagesFolder: string;
    scriptId: string;
    variables: Record<string, string>;
}

export interface ExecuteScriptResponse {
    output: string;
    errors: string[];
}

export async function listScripts(pagesFolder: string): Promise<string> {
    if (!scriptsList) {
        let list: string[] = [];
        const folder = path.join(pagesFolder, 'scripts');
        const files = (await listFiles(folder)).filter(f => f.endsWith('.json'));
        for (const file of files) {
            const script = await loadFile(path.join(folder, file));
            if (script) {
                try {
                    const parsed = JSON.parse(script) as ParsedScript;
                    const description = parsed.description ? `description: ${parsed.description}\n` : '';
                    const request = parsed.variables ? `request: ${parsed.variables}\n` : '';
                    const response = parsed.response ? `response: ${parsed.response}` : 'response: string';
                    list.push(`POST /api/scripts/${parsed.id}\n${description}${request}${response}`);
                } catch (err) {
                    console.error(err);
                }
            }
        }

        // Cache the list
        scriptsList = list.join('\n\n');
    }

    return scriptsList;
}

export function clearCachedScripts(): void {
    scriptsList = undefined;
}


export async function executeScript(args: ExecuteScriptArgs): Promise<AgentCompletion<ExecuteScriptResponse>> {
    const { pagesFolder, scriptId, variables } = args;

    // Load the script
    const script = await loadFile(path.join(pagesFolder, `scripts`, `${scriptId}.json`));
    if (!script) {
        return { completed: false, error: new Error(`Script not found: ${scriptId}`) };
    }

    // Parse the script
    let parsed: ParsedScript;
    try {
        parsed = JSON.parse(script) as ParsedScript;
    } catch (err) {
        return { completed: false, error: err as Error };
    }

    // Substitute variables
    const commandText = composeArguments(parsed.command, variables);

    // Split into an array while honoring double quotes
    const argv = commandText.match(/"[^"]*"|\S+/g) || [];
    if (argv.length === 0) {
        return { completed: false, error: new Error('No command specified') };
    }

    // Execute the process
    try {
        const command = argv.shift() as string;
        const value = await spawnProcess(command, argv);
    
        return { completed: true, value };
    } catch (err: unknown) {
        return { completed: false, error: err as Error };
    }
}

let scriptsList: string|undefined = undefined;

interface ParsedScript {
    id: string;
    type: 'command';
    command: string;
    description?: string;
    variables?: string;
    response?: string;
}

function spawnProcess(command: string, args: string[]): Promise<ExecuteScriptResponse> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { shell: true });

        let output = '';
        const errors: string[] = [];

        child.stdout.on('data', (data) => {
            output += data;
        });

        child.stderr.on('data', (data) => {
            errors.push(data.toString());
        });

        child.on('close', (code) => {
            resolve({ output, errors });
        });

        child.on('error', (err) => {
            reject(err);
        });
    });
}

function composeArguments(template: string, variables: Record<string, any>): string {
    return template.replace(/{{\s*([^}\s]+)\s*}}/g, (match, name) => {
        // Convert the variable to a string and replace double quotes and line feeds with spaces
        const value = variableToString(variables[name]);
        return value.replace(/["\n]/g, ' ');
    });
}
